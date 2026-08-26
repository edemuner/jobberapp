import { logger } from './logger';
import { jobberConfig } from './config';
import { Application, NextFunction, Request, Response } from 'express';
import hpp from 'hpp';
import helmet from 'helmet';
import cors from 'cors';
import { IAuthPayload } from '@edemuner/jobber-shared';
import { verify } from 'jsonwebtoken';

const log = logger.for('authDatabaseServer');
const SERVER_PORT = 4002;

export function start(app: Application): void {

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
    })
}