import 'express-async-errors';
import { logger } from './logger';
import { Application } from 'express';
import http from 'http';
import { healthRoutes } from './routes';
import { checkConnection } from './elasticsearch';
import { createConnection } from './queues/connection';
import { consumeAuthEmailMessages, consumeOrderEmailMessages } from './queues/email.consumer';
import { Channel } from 'amqplib';
import { jobberConfig } from './config';
import { IEmailMessageDetails } from '@edemuner/jobber-shared';


const SERVER_PORT = 4001;
const log = logger.for('notificationServer');

export function start(app: Application): void {
    startServer(app);
    app.use('', healthRoutes);
    startQueues();
    startElasticSearch();
}

async function startQueues(): Promise<void> {
    const emailChannel: Channel = await createConnection() as Channel;
    await consumeAuthEmailMessages(emailChannel);
    await consumeOrderEmailMessages(emailChannel);

    const verificationLink = `${jobberConfig.CLIENT_URL}/confirm_email?v_token=falssssse`;
    const messageDetails: IEmailMessageDetails = {
        receiverEmail: `eduardood15@hotmail.com`,
        verifyLink: verificationLink,
        template: 'verifyEmail'
    }

    await emailChannel.assertExchange('jobber-email-notification', 'direct');
    //const message = JSON.stringify({name: 'jobber-auth'})
    const message = JSON.stringify(messageDetails)
    emailChannel.publish('jobber-email-notification', 'auth-email', Buffer.from(message)); 

    // await emailChannel.assertExchange('jobber-order-notification', 'direct');
    // const message2 = JSON.stringify({name: 'jobber-order'})
    // emailChannel.publish('jobber-order-notification', 'order-email', Buffer.from(message2)); 

}

function startElasticSearch(): void {
    checkConnection();
}

function startServer(app: Application): void {
    try {
        const httpServer: http.Server = new http.Server(app);
        log.info(`Worker with process id of ${process.pid} on notification server has started.`)
        httpServer.listen(SERVER_PORT, () => {
            log.info(`Notification server running on port ${SERVER_PORT}.`);
        })
    } catch(error){
        log.log('error', 'NotificationService startServer() method:', error);
    }
}