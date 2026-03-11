/**
 * Password Utilities
 *
 * Provides secure password hashing and verification using bcrypt.
 */

import { hash, compare } from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hashes a password using bcrypt
 *
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

/**
 * Verifies a password against a hash
 *
 * @param password - Plain text password to verify
 * @param hashedPassword - Stored password hash
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}
