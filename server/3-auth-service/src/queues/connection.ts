import { jobberConfig } from '@auth/config';
import { logger } from '@auth/logger';
import client, { Channel, ChannelModel } from 'amqplib';

const log = logger.for('authQueueConnection');

async function createConnection(): Promise<Channel | undefined> {
    try {
        const connection: ChannelModel = await client.connect(`${jobberConfig.RABBITMQ_ENDPOINT}`);
        const channel: Channel = await connection.createChannel();
        log.info('Auth service connected to queue successfully...');
        closeConnection(channel, connection);
        return channel;
    } catch (error) {
        log.log('error', 'AuthService createConnection() method:', error);
        return undefined;
    }
}

function closeConnection(channel: Channel, connection: ChannelModel): void {
    process.once('SIGINT', async () => {
        await channel.close();
        await connection.close();
    });
}

export { createConnection };
