import { TOKEN_TTL_SECONDS } from './token.js';

export const AUTH_COOKIE = 'bt_session';

const cookieOptions = () => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
});

export function setAuthCookie(res, token) {
    res.cookie(AUTH_COOKIE, token, { ...cookieOptions(), maxAge: TOKEN_TTL_SECONDS * 1000 });
}

export function clearAuthCookie(res) {
    res.clearCookie(AUTH_COOKIE, cookieOptions());
}

// Express doesn't parse cookies without cookie-parser; this is all we need from it
export function readCookie(req, name) {
    const header = req.headers.cookie;
    if (!header) return undefined;
    for (const part of header.split(';')) {
        const eq = part.indexOf('=');
        if (eq === -1 || part.slice(0, eq).trim() !== name) continue;
        try {
            return decodeURIComponent(part.slice(eq + 1).trim());
        } catch {
            return undefined;
        }
    }
    return undefined;
}
