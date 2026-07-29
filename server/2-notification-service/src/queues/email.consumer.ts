import { Channel, ConsumeMessage } from 'amqplib';
import { logger } from '../logger';
import { createConnection } from './connection';
import { IEmailLocals } from '@edemuner/jobber-shared';
import { jobberConfig } from '@notifications/config';
import { sendEmail } from './mail.transport';

const log = logger.for('emailConsumer');

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
            const { receiverEmail, username, verifyLink, resetLink, template } = JSON.parse(msg!.content.toString());
            const locals: IEmailLocals = {
                appLink: `${jobberConfig.CLIENT_URL}`,
                appIcon: 'https://ibb.co/P7YwMV5',
                username,
                verifyLink,
                resetLink,
            }

            await sendEmail(template, receiverEmail, locals);
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