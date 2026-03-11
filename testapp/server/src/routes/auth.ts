/**
 * Authentication Routes
 *
 * Handles user registration, login, and logout.
 * Routes: /api/auth/signin, /api/auth/signup, /api/auth/signout, /api/auth/me
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { generateId } from 'lucia';

import { db } from '../db/index.js';
import { users } from '../db/schema/index.js';
import { lucia } from '../lib/auth.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signUpSchema, signInSchema } from '../lib/validation.js';
import { validateSession, type OptionalAuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';

const router = Router();

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validation = signUpSchema.safeParse(req.body);
    if (!validation.success) {
      throw validation.error;
    }

    const { name, email, password } = validation.data;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      throw AppError.conflict('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = generateId(15);
    await db.insert(users).values({
      id: userId,
      email,
      name,
      passwordHash,
    });

    // Create session
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    res.status(201).json({
      success: true,
      data: {
        message: 'Account created successfully',
        user: {
          id: userId,
          email,
          name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/signin
 * Sign in an existing user
 */
router.post('/signin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validation = signInSchema.safeParse(req.body);
    if (!validation.success) {
      throw validation.error;
    }

    const { email, password } = validation.data;

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !user.passwordHash) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // Verify password
    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // Create session
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    res.json({
      success: true,
      data: {
        message: 'Signed in successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/signout
 * Sign out the current user
 */
router.post('/signout', validateSession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as OptionalAuthRequest;

    if (authReq.session) {
      await lucia.invalidateSession(authReq.session.id);
    }

    const blankCookie = lucia.createBlankSessionCookie();
    res.cookie(blankCookie.name, blankCookie.value, blankCookie.attributes);

    res.json({
      success: true,
      data: {
        message: 'Signed out successfully',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', validateSession, async (req: Request, res: Response) => {
  const authReq = req as OptionalAuthRequest;

  if (!authReq.user) {
    res.json({
      success: true,
      data: {
        user: null,
      },
    });
    return;
  }

  res.json({
    success: true,
    data: {
      user: {
        id: authReq.user.id,
        email: authReq.user.email,
        name: authReq.user.name,
        image: authReq.user.image,
      },
    },
  });
});

export { router as authRouter };
