import 'dotenv/config';
import { SignJWT, jwtVerify } from 'jose';

export const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

if (!process.env.JWT_SECRET) throw new Error('Missing required env var JWT_SECRET (see .env.example)');
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// Set User ID as Token subject & sign
export function signToken(userId) {
    return new SignJWT()
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
        .sign(secret);
}

// Returns the user id, or null if the token is missing, malformed, tampered with or expired
export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
        return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
        return null;
    }
}
