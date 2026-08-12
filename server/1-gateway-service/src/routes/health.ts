import { Health } from '@gateway/controller/health';
import express, { Router } from 'express';

class HealthRoutes {
    private router: Router;

    constructor(){
        this.router = express.Router();
    }

    public routes(): Router {
        this.router.get('/gateway-health', Health.prototype.health);
        return this.router;
    }
}

export const healthRoutes: HealthRoutes = new HealthRoutes();