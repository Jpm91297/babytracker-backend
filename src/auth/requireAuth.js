import { HttpError } from '../middleware/errorHandler.js';
import { AUTH_COOKIE, readCookie } from './cookie.js';
import { verifyToken } from './token.js';

// Middle-ware to authenicate cookie, otherwise throw 401
export async function requireAuth(req, _res, next) {
    const token = readCookie(req, AUTH_COOKIE);
    const userId = token ? await verifyToken(token) : null;
    if (!userId) throw new HttpError(401,'Sign in to continue');
    req.userId = userId;
    next();
}
