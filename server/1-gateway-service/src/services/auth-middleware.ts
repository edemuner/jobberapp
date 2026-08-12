import { BadRequestError, IAuthPayload, NotAuthorizedError } from "@edemuner/jobber-shared";
import { jobberConfig } from "@gateway/config";
import { NextFunction, Request, Response } from "express";
import { verify } from 'jsonwebtoken';


class AuthMiddleware {
    public verifyUser(req: Request, res: Response, next: NextFunction): void {
        if(!req.session?.jwt){
            throw new NotAuthorizedError('Token is not available', 'GatewayService verifyUser()');
        }

        try {
            const payload: IAuthPayload = verify(req.session!.jwt, `${jobberConfig.JWT_TOKEN}`) as IAuthPayload;
            req.currentUser = payload;
        } catch (error) {
            throw new NotAuthorizedError('Token is not available', 'GatewayService verifyUser()');
        }

        next();
    }

    public checkAuthentication(req: Request, _res:Response, next: NextFunction): void {
        if(!req.currentUser){
            throw new BadRequestError('Authentication is required to access this route', 'GatewayService checkAuthentication()')
        }
        next();
    }
}


export const authMiddleware: AuthMiddleware = new AuthMiddleware();