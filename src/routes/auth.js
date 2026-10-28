import { Router } from 'express';
import { clearAuthCookie, setAuthCookie } from '../auth/cookie.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { requireAuth } from '../auth/requireAuth.js';
import { signToken } from '../auth/token.js';
import { HttpError } from '../middleware/errorHandler.js';
import { Users } from '../models/index.js';

export const authRouter = Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Re-Map SQL Columns
const toUserJson = (user) => ({ id: user.Id, name: user.Name, email: user.Email });

// Bad Request
const invalid = (message) => new HttpError(400, message);

const DUMMY_HASH = await hashPassword('timing-equalizer');

async function signIn(res, user) {
    setAuthCookie(res, await signToken(user.Id));
}

authRouter.post('/signup', async (req, res) => {
    const name = req.body?.name?.trim();
    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password;

    if (!name || !email || !password) throw invalid('Name, email and password are required');
    if (!EMAIL_PATTERN.test(email)) throw invalid('Enter a valid email address');
    if (password.length < 8) throw invalid('Password must be at least 8 characters');

    if (await Users.findOne({ where: { Email: email } })) {
        throw new HttpError(409,'An account with this email already exists');
    }

    const user = await Users.create({ Name: name, Email: email, PasswordHash: await hashPassword(password) });

    await signIn(res, user);

    res.status(201).json({ user: toUserJson(user) });
});

authRouter.post('/login', async (req, res) => {

    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password;
    
    if (!email || !password) throw invalid('Email and password are required');

    const user = await Users.findOne({ where: { Email: email } });

    // Hash password regardless of whether user exists
    const passwordOk = await verifyPassword(password, user?.PasswordHash ?? DUMMY_HASH);

    if (!user || !passwordOk) {
        throw new HttpError(401,'Email or password is incorrect');
    }

    await signIn(res, user);
    
    res.json({ user: toUserJson(user) });
});

authRouter.post('/logout', (_req, res) => {
    clearAuthCookie(res); // Remove HTTP Cookie
    res.status(204).end();
});

authRouter.get('/user', requireAuth, async (req, res) => {
    const user = await Users.findByPk(req.userId);
    if (!user) {
        // Valid token for a user that no longer exists
        clearAuthCookie(res);
        throw new HttpError(401,'Sign in to continue');
    }
    res.json({ user: toUserJson(user) });
});
