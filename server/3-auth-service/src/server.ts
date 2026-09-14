import { logger } from './logger';
import { jobberConfig } from './config';
import { Application, json, NextFunction, Request, Response, urlencoded } from 'express';
import hpp from 'hpp';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import http from 'http';
import { CustomError, IAuthPayload, IErrorResponse } from '@edemuner/jobber-shared';
import { verify } from 'jsonwebtoken';
import { checkConnection } from './elasticsearch';
import { StatusCodes } from 'http-status-codes';

const log = logger.for('authDatabaseServer');
const SERVER_PORT = 4002;

export function start(app: Application): void {
    securityMiddleware(app);
    standardMiddleware(app);
    routesMiddleware(app);
    startQueues();
    startElasticSearch();
    authErrorHandler(app);
    startServer(app);
}

function securityMiddleware(app: Application): void {
    app.set('trust proxy', 1);
    app.use(hpp());
    app.use(helmet());
    app.use((
        cors({
            origin: jobberConfig.API_GATEWAY_URL,
            credentials: true,
            methods: [ 'GET', 'POST',  'PUT', 'DELETE', 'OPTIONS' ]
        })
    ));
    // Bearer 123g12k31g2
    app.use((req: Request, res: Response, next: NextFunction) => {
        if(req.headers.authorization){
            const token = req.headers.authorization.split(' ')[1];
            const payload = verify(token, jobberConfig.JWT_TOKEN!) as IAuthPayload;
            req.currentUser = payload;
        }
        next();
    })
}

function standardMiddleware(app: Application): void {
    app.use(compression());
    app.use(json({ limit: '200mb' }));
    app.use(urlencoded({ extended: true, limit: '200mb' }));
}

function routesMiddleware(app: Application): void {
    console.log(app);
}

async function startQueues(): Promise<void>{

}

function startElasticSearch(): void {
    checkConnection();
}

function authErrorHandler(app: Application): void {
        app.use('*', (req: Request, res: Response) => {
            const fullUrl =  `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            log.log('error', `${fullUrl} endpoint does not exist`);
            res.status(StatusCodes.NOT_FOUND).json({ message: 'The called endpoint does not exist.' });
        });
        app.use((error: IErrorResponse, req: Request, res: Response, next: NextFunction) => {
            log.log('error', `AuthService ${error.comingFrom}:`, error);
            if(error instanceof CustomError){
                res.status(error.statusCode).json(error.serializeErrors());
            }
            next();
        });

}

function startServer(app: Application): void {
    try {
        const httpServer: http.Server = new http.Server(app);
        log.info(`Authentication server has started with process id ${process.pid}`);
        httpServer.listen(SERVER_PORT, () => {
            log.info( `Authentication server running on port ${SERVER_PORT}`);
        })
    } catch (error) {
        log.log('error', 'AuthService startServer method error', error);
    }
}