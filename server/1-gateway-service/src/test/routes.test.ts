import type { Application } from 'express';

jest.mock('../routes/health', () => ({
    healthRoutes: { routes: jest.fn(() => 'healthRouter') }
}));

import { appRoutes } from '../routes';
import { healthRoutes } from '../routes/health';

describe('appRoutes', () => {
    it('mounts the router returned by healthRoutes.routes() at the root path', () => {
        const app = { use: jest.fn() } as unknown as jest.Mocked<Application>;

        appRoutes(app);

        expect(healthRoutes.routes).toHaveBeenCalledTimes(1);
        expect(app.use).toHaveBeenCalledWith('', 'healthRouter');
    });
});
