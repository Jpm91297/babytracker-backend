import { Router } from 'express';
import { requireAuth } from '../auth/requireAuth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { Events, Users } from '../models/index.js';
import { validateChildAccess } from '../middleware/validateChildAccess.js';

export const eventsRouter = Router();

eventsRouter.use(requireAuth);

const MAX_NOTES_LENGTH = 500;

// Bad Request
const invalid = (message) => new HttpError(400, message);

const isSeconds = (value) => Number.isInteger(value) && value >= 0;

// Newest first. Start times are per minute, so ties go by when they were logged
const NEWEST_FIRST = [['StartedAt', 'DESC'], ['CreatedAt', 'DESC']];

// Re-Map SQL Columns
const toEventJson = (event) => ({
    id: event.Id,
    type: event.Type,
    startedAt: event.StartedAt,
    details: event.Details,
    notes: event.Notes,
    loggedBy: { id: event.loggedByUser.Id, name: event.loggedByUser.Name },
});

// Build Details JSON by event type
const DETAILS_BY_TYPE = {

    feeding(details) {
        if (details?.method === 'breast') {
            const { leftSec, rightSec } = details;

            if (!isSeconds(leftSec) || !isSeconds(rightSec)) throw invalid('Enter a valid feeding duration');

            if (leftSec + rightSec === 0) throw invalid('A breast feeding needs a duration');

            return { method: 'breast', leftSec, rightSec };
        }

        if (details?.method === 'bottle') {
            const { amountMl, contents } = details;

            if (!Number.isFinite(amountMl) || amountMl <= 0) throw invalid('Enter a valid bottle amount');

            if (!['breast_milk', 'formula'].includes(contents)) throw invalid('Invalid Content Type');

            return { method: 'bottle', amountMl, contents };
        }

        throw invalid('Feeding method must be breast or bottle');
    },

    diaper(details) {
        if (!['wet', 'dirty', 'mixed', 'dry'].includes(details?.type)) {
            throw invalid('Diaper type must be wet, dirty, mixed or dry');
        }
        return { type: details.type };
    },
};

// Date from an ISO timestamp string
function parseTimestamp(value) {
    if (typeof value !== 'string') return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

// Latest Events
eventsRouter.get('/:id/summary', async (req, res) => {

    // Validate Access
    const { ChildId } = await validateChildAccess(req.params.id, req.userId);

    const latest = (type) => Events.findOne({ where: { ChildId, Type: type }, include: [{ model: Users, as: 'loggedByUser', attributes: ['Id', 'Name'], required: true }], order: NEWEST_FIRST });

    const [lastFeeding, lastDiaper] = await Promise.all([latest('feeding'), latest('diaper')]);

    res.json({
        lastFeeding: lastFeeding && toEventJson(lastFeeding),
        lastDiaper: lastDiaper && toEventJson(lastDiaper),
    });
});

// All of a Child's Events, Newest First
eventsRouter.get('/:id/events', async (req, res) => {

    // Validate Access
    const { ChildId } = await validateChildAccess(req.params.id, req.userId);

    const events = await Events.findAll({ where: { ChildId }, include: [{ model: Users, as: 'loggedByUser', attributes: ['Id', 'Name'], required: true }], order: NEWEST_FIRST });

    res.json({ events: events.map(event => toEventJson(event)) });
});

// Log a New Event
eventsRouter.post('/:id/events', async (req, res) => {

    // Validate Access
    const { ChildId } = await validateChildAccess(req.params.id, req.userId);

    const { type, details, notes, startedAt } = req.body ?? {};

    // Verify Request Body
    if (typeof type !== 'string' || !Object.hasOwn(DETAILS_BY_TYPE, type)) throw invalid('Unknown event type');

    const started = parseTimestamp(startedAt);
    if (!started) throw invalid('Enter a valid start time');

    if (notes != null && typeof notes !== 'string') throw invalid('Notes must be text');
    const trimmedNotes = notes?.trim() || null;
    if (trimmedNotes?.length > MAX_NOTES_LENGTH) throw invalid(`Notes must be ${MAX_NOTES_LENGTH} characters or fewer`);

    const { Id } = await Events.create({
        ChildId,
        Type: type,
        StartedAt: started,
        Details: DETAILS_BY_TYPE[type](details),
        Notes: trimmedNotes,
        LoggedBy: req.userId,
    });

    const event = await Events.findByPk(Id, { include: [{ model: Users, as: 'loggedByUser', attributes: ['Id', 'Name'], required: true }] });

    res.status(201).json({ event: toEventJson(event) });
});
