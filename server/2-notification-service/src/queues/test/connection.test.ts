jest.mock('@notifications/logger');
jest.mock('amqplib', () => ({
    connect: jest.fn()
}));

import client, { Channel, ChannelModel } from 'amqplib';
import { createConnection } from '../connection';
import { logger } from '@notifications/logger';

const mockLog = logger.for('test') as unknown as { info: jest.Mock; log: jest.Mock };

describe('createConnection', () => {
    let onceSpy: jest.SpyInstance;

    beforeEach(() => {
        (client.connect as jest.Mock).mockReset();
        mockLog.info.mockClear();
        mockLog.log.mockClear();
        onceSpy = jest.spyOn(process, 'once').mockImplementation(() => process);
    });

    afterEach(() => {
        onceSpy.mockRestore();
    });

    it('connects, creates a channel, logs success, and registers a SIGINT handler that closes both', async () => {
        const mockChannel = { close: jest.fn().mockResolvedValue(undefined) } as unknown as Channel;
        const mockConnection = {
            createChannel: jest.fn().mockResolvedValue(mockChannel),
            close: jest.fn().mockResolvedValue(undefined)
        } as unknown as ChannelModel;
        (client.connect as jest.Mock).mockResolvedValueOnce(mockConnection);

        const result = await createConnection();

        expect(result).toBe(mockChannel);
        expect(mockLog.info).toHaveBeenCalledWith('Notification server connected to queue successfully...');
        expect(onceSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));

        const sigintHandler = onceSpy.mock.calls[0][1] as () => Promise<void>;
        await sigintHandler();

        expect(mockChannel.close).toHaveBeenCalledTimes(1);
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
    });

    it('logs an error and returns undefined when the connection fails', async () => {
        const error = new Error('rabbitmq unreachable');
        (client.connect as jest.Mock).mockRejectedValueOnce(error);

        const result = await createConnection();

        expect(result).toBeUndefined();
        expect(mockLog.log).toHaveBeenCalledWith('error', 'NotificationService createConnection() method:', error);
    });
});
