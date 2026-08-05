import { StatusCodes } from 'http-status-codes';
import { BadRequestError } from '@edemuner/jobber-shared';

jest.mock('../logger', () => {
    const mockChildLogger = { log: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    return { logger: { for: jest.fn(() => mockChildLogger) } };
});
jest.mock('cookie-session', () => jest.fn(() => 'cookieSessionMiddleware'));
jest.mock('cors', () => jest.fn(() => 'corsMiddleware'));
jest.mock('hpp', () => jest.fn(() => 'hppMiddleware'));
jest.mock('helmet', () => jest.fn(() => 'helmetMiddleware'));
jest.mock('compression', () => jest.fn(() => 'compressionMiddleware'));
jest.mock('express', () => ({
    json: jest.fn(() => 'jsonMiddleware'),
    urlencoded: jest.fn(() => 'urlencodedMiddleware')
}));

import cookieSession from 'cookie-session';
import cors from 'cors';
import hpp from 'hpp';
import helmet from 'helmet';
import compression from 'compression';
import { json, urlencoded } from 'express';

import { GatewayServer } from '../server';
import { logger } from '../logger';

import type { Application, NextFunction, Request, Response } from 'express';

const mockLog = logger.for('test') as unknown as { log: jest.Mock };

function createMockApp() {
    return { set: jest.fn(), use: jest.fn() } as unknown as jest.Mocked<Application>;
}

describe('GatewayServer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('start', () => {
        it('wires up security, standard, and error-handling middleware on the app', () => {
            const app = createMockApp();
            const server = new GatewayServer(app);

            server.start();

            expect(app.set).toHaveBeenCalledWith('trust proxy', 1);
            expect(cookieSession).toHaveBeenCalledWith({
                name: 'session',
                keys: [],
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
