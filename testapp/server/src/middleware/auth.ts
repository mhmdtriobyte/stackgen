/**
 * Authentication Middleware
 *
 * Provides session validation and user authentication for protected routes.
 */

import type { Request, Response, NextFunction } from 'express';
import { lucia } from '../lib/auth.js';
import type { User, Session } from 'lucia';
import { AppError } from './error-handler.js';

/**
 * Extended Express Request with user and session
 */
export interface AuthenticatedRequest extends Request {
  user: User;
  session: Session;
}

/**
 * Extended Express Request with optional user and session
 */
export interface OptionalAuthRequest extends Request {
  user: User | null;
  session: Session | null;
}

/**
 * Validates session and attaches user to request
 * Does not require authentication, just validates if session exists
 */
export async function validateSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const sessionId = req.cookies[lucia.sessionCookieName] ?? null;

  if (!sessionId) {
    (req as OptionalAuthRequest).user = null;
    (req as OptionalAuthRequest).session = null;
    return next();
  }

  try {
    const { session, user } = await lucia.validateSession(sessionId);

    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }

    if (!session) {
      const blankCookie = lucia.createBlankSessionCookie();
      res.cookie(blankCookie.name, blankCookie.value, blankCookie.attributes);
    }

    (req as OptionalAuthRequest).user = user;
    (req as OptionalAuthRequest).session = session;
    next();
  } catch (error) {
    console.error('Session validation error:', error);
    (req as OptionalAuthRequest).user = null;
    (req as OptionalAuthRequest).session = null;
    next();
  }
}

/**
 * Requires authentication - returns 401 if not authenticated
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const sessionId = req.cookies[lucia.sessionCookieName] ?? null;

  if (!sessionId) {
    return next(AppError.unauthorized('Authentication required'));
  }

  try {
    const { session, user } = await lucia.validateSession(sessionId);

    if (!session || !user) {
      const blankCookie = lucia.createBlankSessionCookie();
      res.cookie(blankCookie.name, blankCookie.value, blankCookie.attributes);
      return next(AppError.unauthorized('Invalid or expired session'));
    }

    if (session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }

    (req as AuthenticatedRequest).user = user;
    (req as AuthenticatedRequest).session = session;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    next(AppError.unauthorized('Authentication failed'));
  }
}
