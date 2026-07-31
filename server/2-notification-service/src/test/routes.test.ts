import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { healthRoutes } from '../routes';

describe('healthRoutes', () => {
    it('registers a GET /notification-health route that responds with 200 and a health message', () => {
        const router = healthRoutes();
        const layer = router.stack.find((stackLayer) => stackLayer.route?.path === '/notification-health');

        expect(layer).toBeDefined();

        const handler = layer!.route!.stack[0].handle;
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        } as unknown as Response;

        handler({} as Request, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
        expect(res.send).toHaveBeenCalledWith('Notification service is healthy and OK.');
    });
});
