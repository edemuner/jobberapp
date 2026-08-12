import { Health } from '../controller/health';
import { healthRoutes } from '../routes/health';

interface RouteLayer {
    route?: {
        path: string;
        methods: Record<string, boolean>;
        stack: Array<{ handle: unknown }>;
    };
}

describe('HealthRoutes', () => {
    it('registers a GET /gateway-health route using Health.prototype.health', () => {
        const router = healthRoutes.routes();

        const layer = (router.stack as RouteLayer[]).find((l) => l.route?.path === '/gateway-health');

        expect(layer).toBeDefined();
        expect(layer?.route?.methods.get).toBe(true);
        expect(layer?.route?.stack[0].handle).toBe(Health.prototype.health);
    });
});
