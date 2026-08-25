jest.mock('../logger');

const mockAuthenticate = jest.fn();
jest.mock('sequelize', () => ({
    Sequelize: jest.fn().mockImplementation(() => ({
        authenticate: mockAuthenticate
    }))
}));

import { databaseConnection } from '../database';
import { logger } from '../logger';

const mockLog = logger.for('test') as unknown as { info: jest.Mock; error: jest.Mock };

describe('databaseConnection', () => {
    beforeEach(() => {
        mockAuthenticate.mockReset();
        mockLog.info.mockClear();
        mockLog.error.mockClear();
    });

    it('authenticates and logs success', async () => {
        mockAuthenticate.mockResolvedValueOnce(undefined);

        await databaseConnection();

        expect(mockAuthenticate).toHaveBeenCalledTimes(1);
        expect(mockLog.info).toHaveBeenCalledWith('AutheService Mysql database connection has been stablished');
    });

    it('logs an error when authentication fails', async () => {
        mockAuthenticate.mockRejectedValueOnce(new Error('connection refused'));

        await databaseConnection();

        expect(mockLog.error).toHaveBeenCalledWith('Auth Service - Unable to connect to database');
    });
});
