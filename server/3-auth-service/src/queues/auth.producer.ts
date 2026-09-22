import { Channel } from 'amqplib';
import { logger } from '../logger';
import { createConnection } from './connection';

const log = logger.for('authServiceProducer');

export async function publishDirectMessage(
    channel: Channel,
    exchangeName: string,
    routingKey: string,
    message: string,
    logMessage: string
): Promise<void> {
    try {
        if(!channel){
            channel = await createConnection() as Channel;
        }

        await channel.assertExchange(exchangeName, 'direct');
        channel.publish(exchangeName, routingKey, Buffer.from(message));
        log.info(logMessage);
    } catch (error) {
        log.log('error', 'AuthService Provider publishDirectMessage(): ', error);
    }
}
