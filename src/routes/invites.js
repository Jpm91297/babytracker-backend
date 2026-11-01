import { Router } from 'express';
import { Op } from 'sequelize';
import { requireAuth } from '../auth/requireAuth.js';
import { sequelize } from '../db.js';
import { HttpError } from '../middleware/errorHandler.js';
import { Children, ChildCaregivers, Invites } from '../models/index.js';
import { toChildJson } from './children.js';

export const invitesRouter = Router();

invitesRouter.use(requireAuth);

const invalidCode = () => new HttpError(404, 'This invite code is invalid or has expired');

// Validate Code & Add Child
invitesRouter.post('/accept', async (req, res) => {

    // Verify client request
    const code = String(req.body?.code ?? '').trim().toUpperCase();
    if (!code) throw new HttpError(400, 'Invite code is required');

    const child = await sequelize.transaction(async (transaction) => { // Init transaction

        const now = new Date();

        // Code matches, hasn't been accepted, hasn't been revoked, & hasn't expired
        const usable = { Code: code, AcceptedAt: null, RevokedAt: null, ExpiresAt: { [Op.gt]: now } };

        // Find matching invite
        const invite = await Invites.findOne({
            where: usable,
            include: [{ model: Children, as: 'child', required: true }],
            transaction,
        });

        if (!invite) throw invalidCode();

        // Ensure user doesn't already have access to this child
        const existing = await ChildCaregivers.findOne({
            where: { ChildId: invite.ChildId, UserId: req.userId },
            transaction,
        });

        if (existing) throw new HttpError(409, `You already have access to this child!`);

        // Update Invite, verify once again code is still valid
        const [claimed] = await Invites.update(
            { AcceptedBy: req.userId, AcceptedAt: now },
            { where: usable, transaction },
        );

        // race condition rollback
        if (claimed === 0) throw invalidCode();
        
        await ChildCaregivers.create(
            { ChildId: invite.ChildId, UserId: req.userId, Role: invite.Role, AddedBy: invite.CreatedBy },
            { transaction },
        );

        return toChildJson(invite.child, invite.Role);
    });

    res.json({ child });
});
