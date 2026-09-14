import type { Application } from 'express';
import { appRoutes } from '../routes';

describe('appRoutes', () => {
    it('registers a placeholder handler on the root path', () => {
        const app = { use: jest.fn() } as unknown as jest.Mocked<Application>;

        appRoutes(app);

        expect(app.use).toHaveBeenCalledWith('', expect.any(Function));
    });

    it('the placeholder handler is a no-op', () => {
        const app = { use: jest.fn() } as unknown as jest.Mocked<Application>;

        appRoutes(app);
        const [, placeholderHandler] = (app.use as jest.Mock).mock.calls[0];

        expect(placeholderHandler()).toBeUndefined();
    });
});
