export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

export function notFound(req, _res, next) {
    next(new HttpError(404, `No route for ${req.method} ${req.path}`));
}

// All four params must be defined for express to reconginze this as an error handler
export function errorHandler(err, _req, res, _next) {
    if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message });
        return;
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
}
