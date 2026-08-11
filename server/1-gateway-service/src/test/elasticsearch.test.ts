const mockHealth = jest.fn();

jest.mock('@elastic/elasticsearch', () => ({
    Client: jest.fn().mockImplementation(() => ({
        cluster: { health: mockHealth }
    }))
}));
jest.mock('../config', () => ({
    jobberConfig: { ELASTIC_SEARCH_URL: 'http://elasticsearch:9200' }
}));
jest.mock('../logger', () => {
    const mockChildLogger = { log: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    return { logger: { for: jest.fn(() => mockChildLogger) } };
});

import { Client } from '@elastic/elasticsearch';
import { logger } from '../logger';
import { elasticSearch } from '../elasticsearch';

const mockClientCtor = Client as unknown as jest.Mock;
const clientCtorArgs = mockClientCtor.mock.calls[0][0];

const mockLog = logger.for('test') as unknown as { info: jest.Mock; error: jest.Mock; log: jest.Mock };

describe('ElasticSearch', () => {
    beforeEach(() => {
        mockHealth.mockReset();
        mockLog.info.mockClear();
        mockLog.error.mockClear();
        mockLog.log.mockClear();
    });

    it('constructs the elasticsearch client using the configured URL', () => {
        expect(clientCtorArgs).toEqual({ node: 'http://elasticsearch:9200' });
    });

    describe('checkConnection', () => {
        it('logs the health status once the cluster responds', async () => {
            mockHealth.mockResolvedValueOnce({ status: 'green' });

            await elasticSearch.checkConnection();

            expect(mockLog.info).toHaveBeenCalledWith('GatewayService connecting to Elasticsearch');
            expect(mockLog.info).toHaveBeenCalledWith('GatewayService Elasticsearch health status = green');
            expect(mockHealth).toHaveBeenCalledTimes(1);
        });

        it('retries after logging an error until the cluster responds', async () => {
            const error = new Error('connection refused');
            mockHealth.mockRejectedValueOnce(error).mockResolvedValueOnce({ status: 'yellow' });

            await elasticSearch.checkConnection();

            expect(mockLog.error).toHaveBeenCalledWith('Connection to ElasticSearch failed, Retrying...');
            expect(mockLog.log).toHaveBeenCalledWith('error', 'GatewayService checkConnection() method error: ', error);
            expect(mockHealth).toHaveBeenCalledTimes(2);
        });
    });
});
