jest.mock('@auth/logger');
jest.mock('../connection', () => ({
    createConnection: jest.fn()
}));

import { Channel } from 'amqplib';
import { logger } from '@auth/logger';
import { createConnection } from '../connection';
import { publishDirectMessage } from '../auth.producer';

const mockLog = logger.for('test') as unknown as { info: jest.Mock; log: jest.Mock };

describe('publishDirectMessage', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('asserts the exchange, publishes the message, and logs success', async () => {
        const channel = {
            assertExchange: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn()
        } as unknown as Channel;

        await publishDirectMessage(channel, 'auth-exchange', 'auth.created', 'message-body', 'published auth message');

        expect(channel.assertExchange).toHaveBeenCalledWith('auth-exchange', 'direct');
        expect(channel.publish).toHaveBeenCalledWith(
            'auth-exchange',
            'auth.created',
            Buffer.from('message-body')
        );
        expect(mockLog.info).toHaveBeenCalledWith('published auth message');
        expect(createConnection).not.toHaveBeenCalled();
    });

    it('creates a connection when no channel is supplied', async () => {
        const channel = {
            assertExchange: jest.fn().mockResolvedValue(undefined),
            publish: jest.fn()
        } as unknown as Channel;
        (createConnection as jest.Mock).mockResolvedValueOnce(channel);

        await publishDirectMessage(undefined as unknown as Channel, 'auth-exchange', 'auth.created', 'message-body', 'published auth message');

        expect(createConnection).toHaveBeenCalledTimes(1);
        expect(channel.publish).toHaveBeenCalledWith(
            'auth-exchange',
            'auth.created',
            Buffer.from('message-body')
        );
    });

    it('logs an error when publishing fails', async () => {
        const error = new Error('exchange unavailable');
        const channel = {
            assertExchange: jest.fn().mockRejectedValueOnce(error),
            publish: jest.fn()
        } as unknown as Channel;

        await publishDirectMessage(channel, 'auth-exchange', 'auth.created', 'message-body', 'published auth message');

        expect(mockLog.log).toHaveBeenCalledWith(
            'error',
            'AuthService Provider publishDirectMessage(): ',
            error
        );
    });
});
