jest.mock('dotenv', () => ({
    config: jest.fn()
}));

describe('Config', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('falls back to empty strings and the default app icon URL when env vars are unset', () => {
        delete process.env.NODE_ENV;
        delete process.env.CLIENT_URL;
        delete process.env.SENDER_EMAIL;
        delete process.env.SENDER_EMAIL_PASSWORD;
        delete process.env.RABBITMQ_ENDPOINT;
        delete process.env.ELASTIC_SEARCH_URL;
        delete process.env.APP_ICON_URL;

        const { jobberConfig } = require('../config');

        expect(jobberConfig.NODE_ENV).toBe('');
        expect(jobberConfig.CLIENT_URL).toBe('');
        expect(jobberConfig.SENDER_EMAIL).toBe('');
        expect(jobberConfig.SENDER_EMAIL_PASSWORD).toBe('');
        expect(jobberConfig.RABBITMQ_ENDPOINT).toBe('');
        expect(jobberConfig.ELASTIC_SEARCH_URL).toBe('');
        expect(jobberConfig.APP_ICON_URL).toBe('https://ibb.co/P7YwMV5');
    });

    it('uses the provided env vars when they are set', () => {
        process.env.NODE_ENV = 'production';
        process.env.CLIENT_URL = 'https://client.example.com';
        process.env.SENDER_EMAIL = 'sender@example.com';
        process.env.SENDER_EMAIL_PASSWORD = 'secret';
        process.env.RABBITMQ_ENDPOINT = 'amqp://rabbitmq:5672';
        process.env.ELASTIC_SEARCH_URL = 'http://elasticsearch:9200';
        process.env.APP_ICON_URL = 'https://example.com/icon.png';

        const { jobberConfig } = require('../config');

        expect(jobberConfig.NODE_ENV).toBe('production');
        expect(jobberConfig.CLIENT_URL).toBe('https://client.example.com');
        expect(jobberConfig.SENDER_EMAIL).toBe('sender@example.com');
        expect(jobberConfig.SENDER_EMAIL_PASSWORD).toBe('secret');
        expect(jobberConfig.RABBITMQ_ENDPOINT).toBe('amqp://rabbitmq:5672');
        expect(jobberConfig.ELASTIC_SEARCH_URL).toBe('http://elasticsearch:9200');
        expect(jobberConfig.APP_ICON_URL).toBe('https://example.com/icon.png');
    });
});
