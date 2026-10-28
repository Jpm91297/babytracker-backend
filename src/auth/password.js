import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

// Stored as "salt:hash", both hex
export async function hashPassword(password) {
    const salt = randomBytes(16);
    const hash = await scryptAsync(password, salt, KEY_LENGTH);
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
    const [saltHex, hashHex] = stored.split(':');
    if (!saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, 'hex');
    const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
}
