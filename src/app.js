import express from 'express';
import './models/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';

// Built separately from index.js so tests can start it without the listen/connect side effects
export function createApp() {
    const app = express();
    app.disable('x-powered-by');
    app.use(express.json());

    app.use('/api/health', healthRouter);

    app.use(notFound);
    app.use(errorHandler);
    return app;
}
