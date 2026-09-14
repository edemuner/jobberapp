import { StatusCodes } from 'http-status-codes';
import { BadRequestError } from '@edemuner/jobber-shared';

jest.mock('../logger', () => {
    const mockChildLogger = { log: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    return { logger: { for: jest.fn(() => mockChildLogger) } };
});
jest.mock('../config', () => ({
    jobberConfig: { API_GATEWAY_URL: 'https://gateway.test', JWT_TOKEN: 'jwt-secret' }
}));
jest.mock('../elasticsearch', () => ({
    checkConnection: jest.fn()
}));
jest.mock('hpp', () => jest.fn(() => 'hppMiddleware'));
jest.mock('helmet', () => jest.fn(() => 'helmetMiddleware'));
jest.mock('cors', () => jest.fn(() => 'corsMiddleware'));
jest.mock('compression', () => jest.fn(() => 'compressionMiddleware'));
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('express', () => ({
    ...jest.requireActual('express'),
    json: jest.fn(() => 'jsonMiddleware'),
    urlencoded: jest.fn(() => 'urlencodedMiddleware')
}));

jest.mock('http', () => {
    const actual = jest.requireActual('http');
    const mockListen = jest.fn((_port: number, cb: () => void) => {
        cb();
        return {};
    });
    const mockHttpServerCtor = jest.fn().mockImplementation(() => ({ listen: mockListen }));
    return { ...actual, Server: Object.assign(mockHttpServerCtor, { mockListen }) };
});

import hpp from 'hpp';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { verify } from 'jsonwebtoken';
import { json, urlencoded } from 'express';
import http from 'http';

import { start } from '../server';
import { logger } from '../logger';
import { checkConnection } from '../elasticsearch';

import type { Application, NextFunction, Request, Response } from 'express';

const mockHttpServerCtor = http.Server as unknown as jest.Mock & { mockListen: jest.Mock };
const mockListen = mockHttpServerCtor.mockListen;

const mockLog = logger.for('test') as unknown as { log: jest.Mock; info: jest.Mock };

function createMockApp() {
    return { set: jest.fn(), use: jest.fn() } as unknown as jest.Mocked<Application>;
}

const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

describe('auth-service server', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        mockListen.mockImplementation((_port: number, cb: () => void) => {
            cb();
            return {};
        });
        mockHttpServerCtor.mockImplementation(() => ({ listen: mockListen }));
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe('start', () => {
        it('wires up security, standard, routing, queue, elasticsearch and error-handling middleware, then starts the http server', async () => {
            const app = createMockApp();

            start(app);
            await flushMicrotasks();

            expect(app.set).toHaveBeenCalledWith('trust proxy', 1);
            expect(hpp).toHaveBeenCalledWith();
            expect(app.use).toHaveBeenCalledWith('hppMiddleware');
            expect(helmet).toHaveBeenCalledWith();
            expect(app.use).toHaveBeenCalledWith('helmetMiddleware');
            expect(cors).toHaveBeenCalledWith({
                origin: 'https://gateway.test',
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
            });
            expect(app.use).toHaveBeenCalledWith('corsMiddleware');

            expect(compression).toHaveBeenCalledWith();
            expect(app.use).toHaveBeenCalledWith('compressionMiddleware');
            expect(json).toHaveBeenCalledWith({ limit: '200mb' });
            expect(app.use).toHaveBeenCalledWith('jsonMiddleware');
            expect(urlencoded).toHaveBeenCalledWith({ extended: true, limit: '200mb' });
            expect(app.use).toHaveBeenCalledWith('urlencodedMiddleware');

            expect(consoleLogSpy).toHaveBeenCalledWith(app);

            expect(checkConnection).toHaveBeenCalledTimes(1);

            expect(app.use).toHaveBeenCalledWith('*', expect.any(Function));

            expect(mockHttpServerCtor).toHaveBeenCalledWith(app);
            expect(mockListen).toHaveBeenCalledWith(4002, expect.any(Function));
            expect(mockLog.info).toHaveBeenCalledWith(`Authentication server has started with process id ${process.pid}`);
            expect(mockLog.info).toHaveBeenCalledWith('Authentication server running on port 4002');
        });

        it('logs an error if constructing the http server throws', async () => {
            mockHttpServerCtor.mockImplementationOnce(() => {
                throw new Error('failed to bind port');
            });
            const app = createMockApp();

            start(app);
            await flushMicrotasks();

            expect(mockLog.log).toHaveBeenCalledWith('error', 'AuthService startServer method error', expect.any(Error));
        });
    });

    describe('JWT bearer middleware', () => {
        function getJwtMiddleware(app: jest.Mocked<Application>) {
            start(app);
            const call = (app.use as jest.Mock).mock.calls.find(
                (call) => call.length === 1 && typeof call[0] === 'function' && call[0].length === 3
            );
            return call[0] as (req: Request, res: Response, next: NextFunction) => void;
        }

        it('decodes the bearer token and attaches it to req.currentUser when present', () => {
            const app = createMockApp();
            const middleware = getJwtMiddleware(app);
            const payload = { userId: 'abc123' };
            (verify as jest.Mock).mockReturnValue(payload);
            const req = { headers: { authorization: 'Bearer some.jwt.token' } } as unknown as Request;
            const next = jest.fn();

            middleware(req, {} as Response, next);

            expect(verify).toHaveBeenCalledWith('some.jwt.token', 'jwt-secret');
            expect(req.currentUser).toEqual(payload);
            expect(next).toHaveBeenCalledTimes(1);
        });

        it('skips verification and calls next when no authorization header is present', () => {
            const app = createMockApp();
            const middleware = getJwtMiddleware(app);
            const req = { headers: {} } as unknown as Request;
            const next = jest.fn();

            middleware(req, {} as Response, next);

            expect(verify).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalledTimes(1);
        });
    });

    describe('authErrorHandler', () => {
        function startAndCaptureHandlers() {
            const app = createMockApp();
            start(app);

            const notFoundHandler = (app.use as jest.Mock).mock.calls.find(
                (call) => call[0] === '*'
            )[1] as (req: Request, res: Response) => void;
            const errorMiddleware = (app.use as jest.Mock).mock.calls.find(
                (call) => call.length === 1 && typeof call[0] === 'function' && call[0].length === 4
            )[0] as (error: unknown, req: Request, res: Response, next: NextFunction) => void;

            return { notFoundHandler, errorMiddleware };
        }

        function createMockRes() {
            return {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as unknown as jest.Mocked<Response>;
        }

        it('responds 404 for unmatched routes', () => {
            const { notFoundHandler } = startAndCaptureHandlers();
            const req = { protocol: 'http', get: jest.fn().mockReturnValue('localhost'), originalUrl: '/missing' } as unknown as Request;
            const res = createMockRes();

            notFoundHandler(req, res);

            expect(mockLog.log).toHaveBeenCalledWith('error', 'http://localhost/missing endpoint does not exist');
            expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
            expect(res.json).toHaveBeenCalledWith({ message: 'The called endpoint does not exist.' });
        });

        it('serializes and responds with the error status when the error is a CustomError', () => {
            const { errorMiddleware } = startAndCaptureHandlers();
            const error = new BadRequestError('invalid payload', 'AuthServer test');
            const res = createMockRes();
            const next = jest.fn();

            errorMiddleware(error, {} as Request, res, next);

            expect(mockLog.log).toHaveBeenCalledWith('error', 'AuthService AuthServer test:', error);
            expect(res.status).toHaveBeenCalledWith(error.statusCode);
            expect(res.json).toHaveBeenCalledWith(error.serializeErrors());
            expect(next).toHaveBeenCalledTimes(1);
        });

        it('skips serialization and still calls next when the error is not a CustomError', () => {
            const { errorMiddleware } = startAndCaptureHandlers();
            const error = { comingFrom: 'unknown', statusCode: 500 };
            const res = createMockRes();
            const next = jest.fn();

            errorMiddleware(error, {} as Request, res, next);

            expect(mockLog.log).toHaveBeenCalledWith('error', 'AuthService unknown:', error);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalledTimes(1);
        });
    });
});
