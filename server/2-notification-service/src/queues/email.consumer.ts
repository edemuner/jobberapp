import { winstonLogger } from '@edemuner/jobber-shared';
import { Channel, ConsumeMessage } from 'amqplib';
import { config } from '../config';
import { Logger } from 'winston';
import { createConnection } from './connection';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'emailConsumer', 'debug');

async function consumeAuthEmailMessages(channel: Channel): Promise<void> {
    try {
        if(!channel){
            channel = await createConnection() as Channel;
        }

        const exchangeName = 'jobber-email-notification';
        const routingKey = 'auth-email';
        const queueName = 'auth-email-queue';

        await channel.assertExchange(exchangeName, 'direct');
        const jobberQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });

        await channel.bindQueue(jobberQueue.queue, exchangeName, routingKey);
        channel.consume(jobberQueue.queue, async (msg: ConsumeMessage | null) => {
            console.log(JSON.parse(msg!.content.toString()))
            channel.ack(msg!)
        })
    } catch(error){
        log.log('error', 'NotificationService EmailConsumer consumeAuthEmailMessages() method', error);
    }
} 

async function consumeOrderEmailMessages(channel: Channel): Promise<void> {
    try {
        if(!channel){
            channel = await createConnection() as Channel;
        }

        const exchangeName = 'jobber-order-notification';
        const routingKey = 'order-email';
        const queueName = 'order-email-queue';

        await channel.assertExchange(exchangeName, 'direct');
        const jobberQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });

        await channel.bindQueue(jobberQueue.queue, exchangeName, routingKey);
        channel.consume(jobberQueue.queue, async (msg: ConsumeMessage | null) => {
            console.log(JSON.parse(msg!.content.toString()))
            channel.ack(msg!)
        })
    } catch(error){
        log.log('error', 'NotificationService EmailConsumer consumeOrderEmailMessages() method', error);
    }
} 


export { consumeAuthEmailMessages, consumeOrderEmailMessages }