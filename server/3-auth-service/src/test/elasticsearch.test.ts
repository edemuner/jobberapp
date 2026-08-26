jest.mock('../logger');

const mockHealth = jest.fn();
jest.mock('@elastic/elasticsearch', () => ({
    Client: jest.fn().mockImplementation(() => ({
        cluster: { health: mockHealth }
    }))
}));

import { checkConnection } from '../elasticsearch';

describe('checkConnection', () => {
    beforeEach(() => {
        mockHealth.mockReset();
    });

    it('resolves once the elasticsearch cluster health check succeeds', async () => {
        mockHealth.mockResolvedValueOnce({ status: 'green' });

        await checkConnection();

        expect(mockHealth).toHaveBeenCalledTimes(1);
    });

    it('retries the health check after a failure until it succeeds', async () => {
        mockHealth
            .mockRejectedValueOnce(new Error('connection refused'))
            .mockResolvedValueOnce({ status: 'yellow' });

        await checkConnection();

        expect(mockHealth).toHaveBeenCalledTimes(2);
    });
});
