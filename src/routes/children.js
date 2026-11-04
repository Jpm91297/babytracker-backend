import { randomInt } from 'node:crypto';
import { Router } from 'express';
import { col, fn } from 'sequelize';
import { requireAuth } from '../auth/requireAuth.js';
import { sequelize } from '../db.js';
import { HttpError } from '../middleware/errorHandler.js';
import { Children, ChildCaregivers, Events, Invites } from '../models/index.js';
import { validateChildAccess } from '../middleware/validateChildAccess.js';

export const childrenRouter = Router();

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Allowed Characters in invite code
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_TTL_MS = 48 * 60 * 60 * 1000; // 48 Hours

// Re-Map SQL Columns
export const toChildJson = (child, role) => ({ id: child.Id, name: child.Name, birthDate: child.BirthDate, role });

// Bad Request
const invalid = (message) => new HttpError(400, message);

// Rejects impossible dates like 2026-02-31, which JS would roll over to March
function isRealDate(value) {
    if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

// Generates random 9 character invite code 
function generateInviteCode() {
    return Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
}

// Returns all children associated with user
childrenRouter.get('/', requireAuth, async (req, res) => {

    // Query children user has access to
    const memberships = await ChildCaregivers.findAll({
        where: { UserId: req.userId },
        include: [{ model: Children, as: 'child', required: true }],
        order: [[{ model: Children, as: 'child' }, 'Name', 'ASC']],
    });

    // Query most recent events for all children
    const lastEvents = await Events.findAll({
        attributes: ['ChildId', 'Type', [fn('MAX', col('StartedAt')), 'LastAt']],
        where: { ChildId: memberships.map((m) => m.ChildId), Type: ['feeding', 'diaper'] },
        group: ['ChildId', 'Type'],
        raw: true,
    });

    // Extract date of last event per child & type
    const lastAt = (childId, type) =>
        lastEvents.find((e) => e.ChildId.toLowerCase() === childId.toLowerCase() && e.Type === type)?.LastAt ?? null;

    res.json({
        children: memberships.map((m) => ({
            ...toChildJson(m.child, m.Role),
            lastFeedAt: lastAt(m.ChildId, 'feeding'),
            lastDiaperAt: lastAt(m.ChildId, 'diaper'),
        })),
    });
});

// Create New Child
childrenRouter.post('/', requireAuth, async (req, res) => {

    const name = String(req.body?.name ?? '').trim();
    const birthDate = req.body?.birthDate || null;

    // Verify Request Body
    if (!name) throw invalid('Name is required');
    if (name.length > 100) throw invalid('Name must be 100 characters or fewer');
    if (birthDate !== null && !isRealDate(birthDate)) throw invalid('Enter a valid birth date');

    const child = await sequelize.transaction(async (transaction) => { // Init transaction

        // New child
        const created = await Children.create({ Name: name, BirthDate: birthDate, CreatedBy: req.userId }, { transaction });

        // Create relation between user & child
        await ChildCaregivers.create(
            { ChildId: created.Id, UserId: req.userId, Role: 'owner', AddedBy: req.userId },
            { transaction },
        );
        return created;
    });

    res.status(201).json({ child: toChildJson(child, 'owner') });
});

// Get a Single Child
childrenRouter.get('/:id', requireAuth, async (req, res) => {

    const membership = await validateChildAccess(req.params.id, req.userId);

    res.json({ child: toChildJson(membership.child, membership.Role) });

});

// Generate Invite Code for Child
childrenRouter.post('/:id/invites', requireAuth, async (req, res) => {

    const membership = await validateChildAccess(req.params.id, req.userId);

    if (membership.Role !== 'owner') throw new HttpError(403, 'Only an owner can invite caregivers');

    const invite = await Invites.create({
        Code: generateInviteCode(),
        ChildId: membership.ChildId,
        CreatedBy: req.userId,
        ExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
    });

    res.status(201).json({ invite: { code: invite.Code, expiresAt: invite.ExpiresAt } });

});