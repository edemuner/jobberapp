import { BadRequestError, NotAuthorizedError } from '@edemuner/jobber-shared';
import type { NextFunction, Request, Response } from 'express';

jest.mock('@gateway/config', () => ({
    jobberConfig: { JWT_TOKEN: 'test-jwt-secret' }
}));
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn()
}));

import { verify } from 'jsonwebtoken';
import { authMiddleware } from '../services/auth-middleware';

const mockVerify = verify as jest.Mock;

describe('AuthMiddleware', () => {
    afterEach(() => jest.clearAllMocks());

    describe('verifyUser', () => {
        it('throws NotAuthorizedError when there is no session jwt', () => {
            const req = { session: null } as unknown as Request;
            const res = {} as Response;
            const next = jest.fn() as NextFunction;

            expect(() => authMiddleware.verifyUser(req, res, next)).toThrow(NotAuthorizedError);
            expect(next).not.toHaveBeenCalled();
        });

        it('decodes the jwt, sets req.currentUser, and calls next when the token is valid', () => {
            const payload = { id: 1, username: 'jane', email: 'jane@example.com' };
            mockVerify.mockReturnValue(payload);
            const req = { session: { jwt: 'valid-token' } } as unknown as Request;
            const res = {} as Response;
            const next = jest.fn() as NextFunction;

            authMiddleware.verifyUser(req, res, next);

            expect(mockVerify).toHaveBeenCalledWith('valid-token', 'test-jwt-secret');
            expect(req.currentUser).toEqual(payload);
            expect(next).toHaveBeenCalledTimes(1);
        });

        it('throws NotAuthorizedError when the jwt fails verification', () => {
            mockVerify.mockImplementation(() => {
                throw new Error('invalid signature');
            });
            const req = { session: { jwt: 'bad-token' } } as unknown as Request;
            const res = {} as Response;
            const next = jest.fn() as NextFunction;

            expect(() => authMiddleware.verifyUser(req, res, next)).toThrow(NotAuthorizedError);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('checkAuthentication', () => {
        it('throws BadRequestError when there is no currentUser on the request', () => {
            const req = {} as Request;
            const res = {} as Response;
            const next = jest.fn() as NextFunction;

            expect(() => authMiddleware.checkAuthentication(req, res, next)).toThrow(BadRequestError);
            expect(next).not.toHaveBeenCalled();
        });

        it('calls next when a currentUser is present', () => {
            const req = { currentUser: { id: 1, username: 'jane', email: 'jane@example.com' } } as unknown as Request;
            const res = {} as Response;
            const next = jest.fn() as NextFunction;

            authMiddleware.checkAuthentication(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
        });
    });
});
