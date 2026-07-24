import { jobberConfig } from '@notifications/config';
import { logger } from '@notifications/logger';
import client, { Channel, ChannelModel } from 'amqplib';
import { Logger } from 'winston';

const log: Logger = logger.for('notificationQueueConnection');

async function createConnection(): Promise<Channel | undefined> {
    try {
        const connection: ChannelModel = await client.connect(`${jobberConfig.RABBITMQ_ENDPOINT}`);
        const channel: Channel = await connection.createChannel();
        log.info('Notification server connected to queue successfully...');
        closeConnection(channel, connection);
        return channel;
    } catch(error){
        log.log('error', 'NotificationService createConnection() method:', error)
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