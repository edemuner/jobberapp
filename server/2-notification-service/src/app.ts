import express, { Express } from 'express';
import { start } from "./server";

function initialize(): void {
    const app: Express = express();
    start(app);
}

initialize();