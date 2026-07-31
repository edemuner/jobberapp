import { logger } from '../logger';

describe('logger', () => {
    it('builds a service logger that can create per-module child loggers', () => {
        const moduleLogger = logger.for('loggerTest');

        expect(moduleLogger).toBeDefined();
        expect(typeof moduleLogger.info).toBe('function');
    });
});
