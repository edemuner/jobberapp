import dotenv from 'dotenv';

dotenv.config({});

class Config {
    public NODE_ENV: string | undefined;
    public CLIENT_URL: string | undefined;
    public SENDER_EMAIL: string | undefined;
    public SENDER_EMAIL_PASSWORD: string | undefined;
    public RABBITMQ_ENDPOINT: string | undefined;
    public ELASTIC_SEARCH_URL: string | undefined;
    public ELASTIC_APM_SERVER_URL: string | undefined;
    public ELASTIC_APM_SECRET_TOKEN: string | undefined;
    public ENABLE_APM: string | undefined;

    constructor() {
        this.NODE_ENV = process.env.NODE_ENV || '';
        this.CLIENT_URL = process.env.CLIENT_URL || '';
        this.SENDER_EMAIL = process.env.SENDER_EMAIL || '';
        this.SENDER_EMAIL_PASSWORD = process.env.SENDER_EMAIL_PASSWORD || '';
        this.RABBITMQ_ENDPOINT = process.env.RABBITMQ_ENDPOINT || '';
        this.ELASTIC_SEARCH_URL = process.env.ELASTIC_SEARCH_URL || '';
        this.ELASTIC_APM_SERVER_URL = process.env.ELASTIC_APM_SERVER_URL || '';
        this.ELASTIC_APM_SECRET_TOKEN = process.env.ELASTIC_APM_SECRET_TOKEN || '';
        this.ENABLE_APM = process.env.ENABLE_APM || '0';
    }
}

export const jobberConfig: Config = new Config();
