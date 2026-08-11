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
        delete process.env.JWT_TOKEN;
        delete process.env.GATEWAY_JWT_TOKEN;
        delete process.env.SECRET_KEY_ONE;
        delete process.env.SECRET_KEY_TWO;
        delete process.env.AUTH_BASE_URL;
        delete process.env.USERS_BASE_URL;
        delete process.env.GIG_BASE_URL;
        delete process.env.MESSAGE_BASE_URL;
        delete process.env.ORDER_BASE_URL;
        delete process.env.REVIEW_BASE_URL;
        delete process.env.REDIS_HOST;
        delete process.env.ELASTIC_SEARCH_URL;
        delete process.env.ELASTIC_APM_SERVER_URL;
        delete process.env.ELASTIC_APM_SECRET_TOKEN;
        delete process.env.ENABLE_APM;

        const { jobberConfig } = require('../config');

        expect(jobberConfig.NODE_ENV).toBe('');
        expect(jobberConfig.CLIENT_URL).toBe('');
        expect(jobberConfig.JWT_TOKEN).toBe('');
        expect(jobberConfig.GATEWAY_JWT_TOKEN).toBe('');
        expect(jobberConfig.SECRET_KEY_ONE).toBe('');
        expect(jobberConfig.SECRET_KEY_TWO).toBe('');
        expect(jobberConfig.AUTH_BASE_URL).toBe('');
        expect(jobberConfig.USERS_BASE_URL).toBe('');
        expect(jobberConfig.GIG_BASE_URL).toBe('');
        expect(jobberConfig.MESSAGE_BASE_URL).toBe('');
        expect(jobberConfig.ORDER_BASE_URL).toBe('');
        expect(jobberConfig.REVIEW_BASE_URL).toBe('');
        expect(jobberConfig.REDIS_HOST).toBe('');
        expect(jobberConfig.ELASTIC_SEARCH_URL).toBe('');
        expect(jobberConfig.ELASTIC_APM_SERVER_URL).toBe('');
        expect(jobberConfig.ELASTIC_APM_SECRET_TOKEN).toBe('');
        expect(jobberConfig.ENABLE_APM).toBe('0');
    });

    it('uses the provided env vars when they are set', () => {
        process.env.NODE_ENV = 'production';
        process.env.CLIENT_URL = 'https://client.example.com';
        process.env.JWT_TOKEN = 'jwt-secret';
        process.env.GATEWAY_JWT_TOKEN = 'gateway-jwt-secret';
        process.env.SECRET_KEY_ONE = 'secret-one';
        process.env.SECRET_KEY_TWO = 'secret-two';
        process.env.AUTH_BASE_URL = 'http://auth:4001';
        process.env.USERS_BASE_URL = 'http://users:4002';
        process.env.GIG_BASE_URL = 'http://gig:4003';
        process.env.MESSAGE_BASE_URL = 'http://message:4004';
        process.env.ORDER_BASE_URL = 'http://order:4005';
        process.env.REVIEW_BASE_URL = 'http://review:4006';
        process.env.REDIS_HOST = 'redis://redis:6379';
        process.env.ELASTIC_SEARCH_URL = 'http://elasticsearch:9200';
        process.env.ELASTIC_APM_SERVER_URL = 'http://apm:8200';
        process.env.ELASTIC_APM_SECRET_TOKEN = 'apm-secret';
        process.env.ENABLE_APM = '1';

        const { jobberConfig } = require('../config');

        expect(jobberConfig.NODE_ENV).toBe('production');
        expect(jobberConfig.CLIENT_URL).toBe('https://client.example.com');
        expect(jobberConfig.JWT_TOKEN).toBe('jwt-secret');
        expect(jobberConfig.GATEWAY_JWT_TOKEN).toBe('gateway-jwt-secret');
        expect(jobberConfig.SECRET_KEY_ONE).toBe('secret-one');
        expect(jobberConfig.SECRET_KEY_TWO).toBe('secret-two');
        expect(jobberConfig.AUTH_BASE_URL).toBe('http://auth:4001');
        expect(jobberConfig.USERS_BASE_URL).toBe('http://users:4002');
        expect(jobberConfig.GIG_BASE_URL).toBe('http://gig:4003');
        expect(jobberConfig.MESSAGE_BASE_URL).toBe('http://message:4004');
        expect(jobberConfig.ORDER_BASE_URL).toBe('http://order:4005');
        expect(jobberConfig.REVIEW_BASE_URL).toBe('http://review:4006');
        expect(jobberConfig.REDIS_HOST).toBe('redis://redis:6379');
        expect(jobberConfig.ELASTIC_SEARCH_URL).toBe('http://elasticsearch:9200');
        expect(jobberConfig.ELASTIC_APM_SERVER_URL).toBe('http://apm:8200');
        expect(jobberConfig.ELASTIC_APM_SECRET_TOKEN).toBe('apm-secret');
        expect(jobberConfig.ENABLE_APM).toBe('1');
    });
});
