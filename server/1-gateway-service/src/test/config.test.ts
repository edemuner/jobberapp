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

    it('falls back to empty strings when env vars are unset', () => {
        delete process.env.NODE_ENV;
        delete process.env.CLIENT_URL;
        delete process.env.SENDER_EMAIL;
        delete process.env.SENDER_EMAIL_PASSWORD;
        delete process.env.RABBITMQ_ENDPOINT;
        delete process.env.ELASTIC_SEARCH_URL;
        delete process.env.ELASTIC_APM_SERVER_URL;
        delete process.env.ELASTIC_APM_SECRET_TOKEN;
        delete process.env.ENABLE_APM;

        const { jobberConfig } = require('../config');

        expect(jobberConfig.NODE_ENV).toBe('');
        expect(jobberConfig.CLIENT_URL).toBe('');
        expect(jobberConfig.SENDER_EMAIL).toBe('');
        expect(jobberConfig.SENDER_EMAIL_PASSWORD).toBe('');
        expect(jobberConfig.RABBITMQ_ENDPOINT).toBe('');
        expect(jobberConfig.ELASTIC_SEARCH_URL).toBe('');
        expect(jobberConfig.ELASTIC_APM_SERVER_URL).toBe('');
        expect(jobberConfig.ELASTIC_APM_SECRET_TOKEN).toBe('');
        expect(jobberConfig.ENABLE_APM).toBe('0');
    });

    it('uses the provided env vars when they are set', () => {
        process.env.NODE_ENV = 'production';
        process.env.CLIENT_URL = 'https://client.example.com';
        process.env.SENDER_EMAIL = 'sender@example.com';
        process.env.SENDER_EMAIL_PASSWORD = 'secret';
        process.env.RABBITMQ_ENDPOINT = 'amqp://rabbitmq:5672';
        process.env.ELASTIC_SEARCH_URL = 'http://elasticsearch:9200';
        process.env.ELASTIC_APM_SERVER_URL = 'http://apm:8200';
        process.env.ELASTIC_APM_SECRET_TOKEN = 'apm-secret';
        process.env.ENABLE_APM = '1';

        const { jobberConfig } = require('../config');

        expect(jobberConfig.NODE_ENV).toBe('production');
        expect(jobberConfig.CLIENT_URL).toBe('https://client.example.com');
        expect(jobberConfig.SENDER_EMAIL).toBe('sender@example.com');
        expect(jobberConfig.SENDER_EMAIL_PASSWORD).toBe('secret');
        expect(jobberConfig.RABBITMQ_ENDPOINT).toBe('amqp://rabbitmq:5672');
        expect(jobberConfig.ELASTIC_SEARCH_URL).toBe('http://elasticsearch:9200');
        expect(jobberConfig.ELASTIC_APM_SERVER_URL).toBe('http://apm:8200');
        expect(jobberConfig.ELASTIC_APM_SECRET_TOKEN).toBe('apm-secret');
        expect(jobberConfig.ENABLE_APM).toBe('1');
    });
});
