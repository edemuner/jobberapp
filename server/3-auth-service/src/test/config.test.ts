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
    delete process.env.RABBITMQ_ENDPOINT;
    delete process.env.ELASTIC_SEARCH_URL;
    delete process.env.API_GATEWAY_URL;

    const { jobberConfig } = require('../config');

    expect(jobberConfig.NODE_ENV).toBe('');
    expect(jobberConfig.CLIENT_URL).toBe('');
    expect(jobberConfig.JWT_TOKEN).toBe('');
    expect(jobberConfig.GATEWAY_JWT_TOKEN).toBe('');
    expect(jobberConfig.RABBITMQ_ENDPOINT).toBe('');
    expect(jobberConfig.ELASTIC_SEARCH_URL).toBe('');
    expect(jobberConfig.API_GATEWAY_URL).toBe('');
  });

  it('uses the provided env vars when they are set', () => {
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_URL = 'https://client.example.com';
    process.env.JWT_TOKEN = 'jwt-secret';
    process.env.GATEWAY_JWT_TOKEN = 'gateway-jwt-secret';
    process.env.RABBITMQ_ENDPOINT = 'amqp://rabbitmq:5672';
    process.env.ELASTIC_SEARCH_URL = 'http://elasticsearch:9200';
    process.env.API_GATEWAY_URL = 'http://gateway:4000';

    const { jobberConfig } = require('../config');

    expect(jobberConfig.NODE_ENV).toBe('production');
    expect(jobberConfig.CLIENT_URL).toBe('https://client.example.com');
    expect(jobberConfig.JWT_TOKEN).toBe('jwt-secret');
    expect(jobberConfig.GATEWAY_JWT_TOKEN).toBe('gateway-jwt-secret');
    expect(jobberConfig.RABBITMQ_ENDPOINT).toBe('amqp://rabbitmq:5672');
    expect(jobberConfig.ELASTIC_SEARCH_URL).toBe('http://elasticsearch:9200');
    expect(jobberConfig.API_GATEWAY_URL).toBe('http://gateway:4000');
  });
});
