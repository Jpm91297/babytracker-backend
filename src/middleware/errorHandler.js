// Throw from any handler; Express 5 forwards rejected promises to the error handler.
// `fields` is an optional list of { field, message } for 400 responses.
export class HttpError extends Error {
    constructor(status, code, message, fields) {
        super(message);
        this.status = status;
        this.code = code;
        this.fields = fields;
    }
}

export function notFound(req, _res, next) {
    next(new HttpError(404, 'not_found', `No route for ${req.method} ${req.path}`));
}

// Express recognizes error handlers by their four parameters, so _next must stay
export function errorHandler(err, _req, res, _next) {
    if (err instanceof HttpError) {
        res.status(err.status).json({
            error: { code: err.code, message: err.message, ...(err.fields ? { fields: err.fields } : {}) },
        });
        return;
    }
    // express.json() sets type 'entity.parse.failed' on malformed bodies
    if (err?.type === 'entity.parse.failed') {
        res.status(400).json({ error: { code: 'invalid_json', message: 'Request body is not valid JSON' } });
        return;
    }
    console.error(err);
    res.status(500).json({ error: { code: 'internal', message: 'Something went wrong' } });
}
