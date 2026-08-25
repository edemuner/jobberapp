import { logger } from './logger';
import { Sequelize } from 'sequelize';

const log = logger.for('authDatabaseServer');

export const sequelize = new Sequelize(process.env.MYSQL_DB!, {
    dialect:'mysql',
    logging: false,
    dialectOptions: {
        multipleStatements: true
    }
});

export async function databaseConnection(): Promise<void> {
    try {
        await sequelize.authenticate();
        log.info('AutheService Mysql database connection has been stablished');
    } catch (error) {
        log.error('Auth Service - Unable to connect to database');
    }
}