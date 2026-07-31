import * as connection from '@notifications/queues/connection';
import { Channel, ConsumeMessage } from 'amqplib';
import { consumeAuthEmailMessages, consumeOrderEmailMessages } from '../email.consumer';
import { logger } from '../../logger';
import { sendEmail } from '../mail.transport';

jest.mock('@notifications/queues/connection');
jest.mock('amqplib');
jest.mock('@edemuner/jobber-shared');
jest.mock('../../logger');
jest.mock('../mail.transport', () => ({ sendEmail: jest.fn() }));
jest.mock('@notifications/config', () => ({
    jobberConfig: { CLIENT_URL: 'https://client.test', APP_ICON_URL: 'https://icon.test' }
}));

const mockLog = logger.for('test') as unknown as { log: jest.Mock };

function createMockChannel() {
    return {
        assertExchange: jest.fn(),
        publish: jest.fn(),
        assertQueue: jest.fn(),
        bindQueue: jest.fn(),
        consume: jest.fn(),
        ack: jest.fn()
    };
}

describe('EmailConsumer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    describe('consumeAuthEmailMessages method', () => {
        it('asserts the exchange/queue, binds the queue, and starts consuming', async () => {
            const channel = createMockChannel();
            channel.assertQueue.mockReturnValue({ queue: 'auth-email-queue', messageCount: 0, consumerCount: 0 });

            await consumeAuthEmailMessages(channel as unknown as Channel);

            expect(channel.assertExchange).toHaveBeenCalledWith('jobber-email-notification', 'direct');
            expect(channel.assertQueue).toHaveBeenCalledTimes(1);
            expect(channel.consume).toHaveBeenCalledTimes(1);
            expect(channel.bindQueue).toHaveBeenCalledWith('auth-email-queue', 'jobber-email-notification', 'auth-email');
        })

        it('creates a connection when no channel is provided', async () => {
            const channel = createMockChannel();
            channel.assertQueue.mockReturnValue({ queue: 'auth-email-queue', messageCount: 0, consumerCount: 0 });
            (connection.createConnection as jest.Mock).mockResolvedValue(channel);

            await consumeAuthEmailMessages(undefined as unknown as Channel);

            expect(connection.createConnection).toHaveBeenCalledTimes(1);
            expect(channel.assertExchange).toHaveBeenCalledWith('jobber-email-notification', 'direct');
        })

        it('parses the message, sends the verification email, and acks it', async () => {
            const channel = createMockChannel();
            channel.assertQueue.mockReturnValue({ queue: 'auth-email-queue', messageCount: 0, consumerCount: 0 });

            await consumeAuthEmailMessages(channel as unknown as Channel);

            const onMessage = channel.consume.mock.calls[0][1];
            const payload = {
                receiverEmail: 'buyer@example.com',
                username: 'buyer',
                verifyLink: 'https://verify.link',
                resetLink: '',
                template: 'verifyEmail'
            };
            const message = { content: Buffer.from(JSON.stringify(payload)) } as unknown as ConsumeMessage;

            await onMessage(message);

            expect(sendEmail).toHaveBeenCalledWith('verifyEmail', 'buyer@example.com', {
                appLink: 'https://client.test',
                appIcon: 'https://icon.test',
                username: 'buyer',
                verifyLink: 'https://verify.link',
                resetLink: ''
            });
            expect(channel.ack).toHaveBeenCalledWith(message);
        })

        it('logs an error when setting up the consumer fails', async () => {
            const channel = createMockChannel();
            const error = new Error('exchange assertion failed');
            channel.assertExchange.mockImplementation(() => { throw error; });

            await consumeAuthEmailMessages(channel as unknown as Channel);

            expect(mockLog.log).toHaveBeenCalledWith('error', 'NotificationService EmailConsumer consumeAuthEmailMessages() method', error);
        })
    });

    describe('consumeOrderEmailMessages method', () => {
        it('asserts the exchange/queue, binds the queue, and starts consuming', async () => {
            const channel = createMockChannel();
            channel.assertQueue.mockReturnValue({ queue: 'order-email-queue', messageCount: 0, consumerCount: 0 });

            await consumeOrderEmailMessages(channel as unknown as Channel);

            expect(channel.assertExchange).toHaveBeenCalledWith('jobber-order-notification', 'direct');
            expect(channel.assertQueue).toHaveBeenCalledTimes(1);
            expect(channel.consume).toHaveBeenCalledTimes(1);
            expect(channel.bindQueue).toHaveBeenCalledWith('order-email-queue', 'jobber-order-notification', 'order-email');
        })

        it('creates a connection when no channel is provided', async () => {
            const channel = createMockChannel();
            channel.assertQueue.mockReturnValue({ queue: 'order-email-queue', messageCount: 0, consumerCount: 0 });
            (connection.createConnection as jest.Mock).mockResolvedValue(channel);

            await consumeOrderEmailMessages(undefined as unknown as Channel);

            expect(connection.createConnection).toHaveBeenCalledTimes(1);
        })

        it('sends both the order-placed and order-receipt emails for an orderPlaced message', async () => {
            const channel = createMockChannel();
            channel.assertQueue.mockReturnValue({ queue: 'order-email-queue', messageCount: 0, consumerCount: 0 });

            await consumeOrderEmailMessages(channel as unknown as Channel);

            const onMessage = channel.consume.mock.calls[0][1];
            const payload = { receiverEmail: 'buyer@example.com', template: 'orderPlaced' };
            const message = { content: Buffer.from(JSON.stringify(payload)) } as unknown as ConsumeMessage;

            await onMessage(message);

            expect(sendEmail).toHaveBeenNthCalledWith(1, 'orderPlaced', 'buyer@example.com', expect.any(Object));
            expect(sendEmail).toHaveBeenNthCalledWith(2, 'orderReceipt', 'buyer@example.com', expect.any(Object));
            expect(channel.ack).toHaveBeenCalledWith(message);
        })

        it('sends a single email for a non-orderPlaced message', async () => {
            const channel = createMockChannel();
            channel.assertQueue.mockReturnValue({ queue: 'order-email-queue', messageCount: 0, consumerCount: 0 });

            await consumeOrderEmailMessages(channel as unknown as Channel);

            const onMessage = channel.consume.mock.calls[0][1];
            const payload = { receiverEmail: 'seller@example.com', template: 'orderDelivered' };
            const message = { content: Buffer.from(JSON.stringify(payload)) } as unknown as ConsumeMessage;

            await onMessage(message);

            expect(sendEmail).toHaveBeenCalledTimes(1);
            expect(sendEmail).toHaveBeenCalledWith('orderDelivered', 'seller@example.com', expect.any(Object));
            expect(channel.ack).toHaveBeenCalledWith(message);
        })

        it('logs an error when setting up the consumer fails', async () => {
            const channel = createMockChannel();
            const error = new Error('queue assertion failed');
            channel.assertExchange.mockImplementation(() => { throw error; });

            await consumeOrderEmailMessages(channel as unknown as Channel);

            expect(mockLog.log).toHaveBeenCalledWith('error', 'NotificationService EmailConsumer consumeOrderEmailMessages() method', error);
        })
    })
})
