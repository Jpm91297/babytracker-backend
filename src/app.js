import express from 'express';
import './models/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { childrenRouter } from './routes/children.js';
import { invitesRouter } from './routes/invites.js';

// Init Express application
export function createApp() {
    const app = express();
    app.disable('x-powered-by');
    app.use(express.json());

    // Auth Routes
    app.use('/api/auth', authRouter);

    // Children & Invite Routes
    app.use('/api/children', childrenRouter);
    app.use('/api/invites', invitesRouter);

    // Error Handling Middleware
    app.use(notFound);
    app.use(errorHandler);
    return app;
}
