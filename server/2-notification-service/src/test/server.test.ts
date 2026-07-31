import type { Application } from 'express';

jest.mock('../logger');
jest.mock('../routes', () => ({ healthRoutes: jest.fn() }));
jest.mock('../elasticsearch', () => ({ checkConnection: jest.fn() }));
jest.mock('../queues/connection', () => ({ createConnection: jest.fn() }));
jest.mock('../queues/email.consumer', () => ({
    consumeAuthEmailMessages: jest.fn(),
    consumeOrderEmailMessages: jest.fn()
}));
jest.mock('../config', () => ({ jobberConfig: { CLIENT_URL: 'https://client.test' } }));

const mockListen = jest.fn((_port: number, cb: () => void) => {
    cb();
    return {};
});
const mockHttpServerCtor = jest.fn().mockImplementation(() => ({ listen: mockListen }));
jest.mock('http', () => ({ Server: mockHttpServerCtor }));

import { start } from '../server';
import { logger } from '../logger';
import { healthRoutes } from '../routes';
import { checkConnection } from '../elasticsearch';
import { createConnection } from '../queues/connection';
import { consumeAuthEmailMessages, consumeOrderEmailMessages } from '../queues/email.consumer';

const mockLog = logger.for('test') as unknown as { info: jest.Mock; log: jest.Mock };

function createMockApp() {
    return { use: jest.fn() } as unknown as Application;
}

const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

describe('start', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('starts the http server, registers health routes, starts queues, and checks elasticsearch', async () => {
        const channel = {
            assertExchange: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn()
        };
        (createConnection as jest.Mock).mockResolvedValue(channel);
        (consumeAuthEmailMessages as jest.Mock).mockResolvedValue(undefined);
        (consumeOrderEmailMessages as jest.Mock).mockResolvedValue(undefined);

        const app = createMockApp();
        start(app);
        await flushMicrotasks();

        expect(mockHttpServerCtor).toHaveBeenCalledWith(app);
        expect(mockListen).toHaveBeenCalledWith(4001, expect.any(Function));
        expect(app.use).toHaveBeenCalledWith('', healthRoutes);
        expect(createConnection).toHaveBeenCalledTimes(1);
        expect(consumeAuthEmailMessages).toHaveBeenCalledWith(channel);
        expect(consumeOrderEmailMessages).toHaveBeenCalledWith(channel);
        expect(channel.assertExchange).toHaveBeenCalledWith('jobber-email-notification', 'direct');
        expect(channel.publish).toHaveBeenCalledWith('jobber-email-notification', 'auth-email', expect.any(Buffer));
        expect(checkConnection).toHaveBeenCalledTimes(1);
    });

    it('logs an error if starting the http server throws', async () => {
        const channel = {
            assertExchange: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn()
        };
        (createConnection as jest.Mock).mockResolvedValue(channel);
        (consumeAuthEmailMessages as jest.Mock).mockResolvedValue(undefined);
        (consumeOrderEmailMessages as jest.Mock).mockResolvedValue(undefined);
        mockHttpServerCtor.mockImplementationOnce(() => {
            throw new Error('failed to bind port');
        });

        const app = createMockApp();
        start(app);
        await flushMicrotasks();

        expect(mockLog.log).toHaveBeenCalledWith('error', 'NotificationService startServer() method:', expect.any(Error));
    });
});
