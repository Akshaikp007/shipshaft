import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password securely using bcryptjs.
 * @param {string} password Plaintext password
 * @returns {Promise<string>} Hashed password string
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Securely compare a candidate password against an existing bcrypt hash.
 * @param {string} candidatePassword Plaintext password candidate
 * @param {string} hash Stored bcrypt password hash
 * @returns {Promise<boolean>} True if matching, false otherwise
 */
export async function comparePassword(candidatePassword, hash) {
  if (!candidatePassword || !hash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, hash);
}
