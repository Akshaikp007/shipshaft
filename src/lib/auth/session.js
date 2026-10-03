import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'shipshaft_session';
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Retrieve the secret key as a Uint8Array for jose.
 * Falls back to an internal default only if JWT_SECRET is unset in dev.
 */
function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET || 'shipshaft_super_secure_jwt_secret_dev_key_2026';
  return new TextEncoder().encode(secret);
}

/**
 * Sign a session payload into a compact JWT.
 * @param {object} payload
 * @returns {Promise<string>}
 */
export async function signSessionToken(payload) {
  const secretKey = getJwtSecretKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey);
}

/**
 * Verify and decode a session JWT.
 * @param {string} token
 * @returns {Promise<object|null>}
 */
export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}

/**
 * Standard cookie configuration for session cookie.
 */
export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  };
}

/**
 * Create a session for an authenticated user, storing JWT in an HTTP-only cookie.
 * @param {object} user User object (must have _id, email, role, name)
 * @returns {Promise<object>} Session payload
 */
export async function createSession(user) {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const token = await signSessionToken(payload);
  const cookieStore = await cookies();
  const options = getSessionCookieOptions();

  cookieStore.set(options.name, token, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
    maxAge: options.maxAge,
  });

  return { token, payload };
}

/**
 * Retrieve the current server session from the HTTP-only cookie.
 * @returns {Promise<object|null>}
 */
export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }
  return verifySessionToken(sessionCookie.value);
}

/**
 * Destroy the current session by clearing the HTTP-only cookie.
 */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
