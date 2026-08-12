import { StatusCodes } from 'http-status-codes';
import type { Request, Response } from 'express';
import { Health } from '../controller/health';

describe('Health controller', () => {
    it('responds with 200 and a health message', () => {
        const health = new Health();
        const req = {} as Request;
        const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as unknown as jest.Mocked<Response>;

        health.health(req, res);

        expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
        expect(res.send).toHaveBeenCalledWith('API Gatewway service is healthy and OK.');
    });
});
