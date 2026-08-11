import { StatusCodes } from 'http-status-codes';
import { BadRequestError } from '@edemuner/jobber-shared';

jest.mock('../logger', () => {
    const mockChildLogger = { log: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    return { logger: { for: jest.fn(() => mockChildLogger) } };
});
jest.mock('../config', () => ({
    jobberConfig: { SECRET_KEY_ONE: 'secret-one', SECRET_KEY_TWO: 'secret-two' }
}));
jest.mock('../elasticsearch', () => ({
    elasticSearch: { checkConnection: jest.fn() }
}));
jest.mock('cookie-session', () => jest.fn(() => 'cookieSessionMiddleware'));
jest.mock('cors', () => jest.fn(() => 'corsMiddleware'));
jest.mock('hpp', () => jest.fn(() => 'hppMiddleware'));
jest.mock('helmet', () => jest.fn(() => 'helmetMiddleware'));
jest.mock('compression', () => jest.fn(() => 'compressionMiddleware'));
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

import cookieSession from 'cookie-session';
import cors from 'cors';
import hpp from 'hpp';
import helmet from 'helmet';
import compression from 'compression';
import { json, urlencoded } from 'express';

import http from 'http';

import { GatewayServer } from '../server';
import { logger } from '../logger';
import { elasticSearch } from '../elasticsearch';

import type { Application, NextFunction, Request, Response } from 'express';

const mockHttpServerCtor = http.Server as unknown as jest.Mock & { mockListen: jest.Mock };
const mockListen = mockHttpServerCtor.mockListen;

const mockLog = logger.for('test') as unknown as { log: jest.Mock; info: jest.Mock };

function createMockApp() {
    return { set: jest.fn(), use: jest.fn() } as unknown as jest.Mocked<Application>;
}

const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

describe('GatewayServer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockListen.mockImplementation((_port: number, cb: () => void) => {
            cb();
            return {};
        });
        mockHttpServerCtor.mockImplementation(() => ({ listen: mockListen }));
    });

    describe('start', () => {
        it('wires up security, standard, and error-handling middleware on the app', async () => {
            const app = createMockApp();
            const server = new GatewayServer(app);

            server.start();
            await flushMicrotasks();

            expect(app.set).toHaveBeenCalledWith('trust proxy', 1);
            expect(cookieSession).toHaveBeenCalledWith({
                name: 'session',
                keys: ['secret-one', 'secret-two'],
                maxAge: 24 * 7 * 3600000,
                secure: false
            });
            expect(app.use).toHaveBeenCalledWith('cookieSessionMiddleware');
            expect(hpp).toHaveBeenCalledWith();
            expect(app.use).toHaveBeenCalledWith('hppMiddleware');
            expect(helmet).toHaveBeenCalledWith();
            expect(app.use).toHaveBeenCalledWith('helmetMiddleware');
            expect(cors).toHaveBeenCalledWith({
                origin: '',
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

            expect(app.use).toHaveBeenCalledWith('*', expect.any(Function));
            expect(app.use).toHaveBeenCalledWith(expect.any(Function));

            expect(elasticSearch.checkConnection).toHaveBeenCalledTimes(1);

            expect(mockHttpServerCtor).toHaveBeenCalledWith(app);
            expect(mockListen).toHaveBeenCalledWith(4000, expect.any(Function));
            expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Gateway server started with process ID'));
            expect(mockLog.info).toHaveBeenCalledWith('Gateway server running on port 4000');
        });

        it('logs an error if constructing the http server throws', async () => {
            mockHttpServerCtor.mockImplementationOnce(() => {
                throw new Error('failed to bind port');
            });
            const app = createMockApp();
            const server = new GatewayServer(app);

            server.start();
            await flushMicrotasks();

            expect(mockLog.log).toHaveBeenCalledWith('error', 'GatewayService startServer() error method:', expect.any(Error));
        });

        it('logs an error if httpServer.listen throws', async () => {
            mockListen.mockImplementationOnce(() => {
                throw new Error('port already in use');
            });
            const app = createMockApp();
            const server = new GatewayServer(app);

            server.start();
            await flushMicrotasks();

            expect(mockLog.log).toHaveBeenCalledWith('error', 'GatewayService startServer() error method:', expect.any(Error));
        });
    });

    describe('errorHandler', () => {
        function startAndCaptureHandlers() {
            const app = createMockApp();
            const server = new GatewayServer(app);
            server.start();

            const notFoundHandler = (app.use as jest.Mock).mock.calls.find(
                (call) => call[0] === '*'
            )[1] as (req: Request, res: Response, next: NextFunction) => void;
            const errorMiddleware = (app.use as jest.Mock).mock.calls.find(
                (call) => call.length === 1 && typeof call[0] === 'function'
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
            const next = jest.fn();

            notFoundHandler(req, res, next);

            expect(mockLog.log).toHaveBeenCalledWith('error', 'http://localhost/missing endpoint does not exist');
            expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
            expect(res.json).toHaveBeenCalledWith({ message: 'The called endpoint does not exist.' });
        });

        it('serializes and responds with the error status when the error is a CustomError', () => {
            const { errorMiddleware } = startAndCaptureHandlers();
            const error = new BadRequestError('invalid payload', 'GatewayServer test');
            const res = createMockRes();
            const next = jest.fn();

            errorMiddleware(error, {} as Request, res, next);

            expect(mockLog.log).toHaveBeenCalledWith('error', 'GatewayService GatewayServer test:', error);
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

            expect(mockLog.log).toHaveBeenCalledWith('error', 'GatewayService unknown:', error);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalledTimes(1);
        });
    });
});
