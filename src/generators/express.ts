/**
 * Express 5 Backend Generator Module
 *
 * Generates a complete Express 5 backend project with:
 * - TypeScript configuration
 * - Drizzle ORM (PostgreSQL or SQLite)
 * - Lucia authentication with session cookies
 * - CORS, Helmet, Compression middleware
 * - Routes: public (/api/health, /api/info), protected (/api/dashboard, /api/profile)
 * - Auth routes (/api/auth/signin, /api/auth/signup, /api/auth/signout, /api/auth/me)
 * - Proper error handling middleware
 * - Database schema (users, sessions)
 * - Seed script for development data
 */

import path from 'path';
import fs from 'fs-extra';
import {
  BaseGenerator,
  type ProjectConfig,
  type GenerationResult,
  generateExpressPackageJson,
  generateExpressTsConfig,
  generateDrizzleConfig,
  generateDatabaseClient,
  generateUsersSchema,
  generateSessionsSchema,
  generateSchemaIndex,
  getTemplateDir,
  writeFile,
  DEPENDENCY_VERSIONS,
} from './base.js';

// =============================================================================
// EXPRESS SPECIFIC CONTENT GENERATORS
// =============================================================================

/**
 * Generates src/index.ts - Main server entry point
 */
function generateServerEntry(config: ProjectConfig): string {
  return `/**
 * Express Server Entry Point
 *
 * Configures and starts the Express 5 server with all middleware and routes.
 * Generated for: ${config.name}
 */

import 'dotenv/config';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { protectedRouter } from './routes/protected.js';

/**
 * Initialize Express application
 */
function createApp(): Express {
  const app = express();

  // ==========================================================================
  // SECURITY MIDDLEWARE
  // ==========================================================================

  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // ==========================================================================
  // PARSING MIDDLEWARE
  // ==========================================================================

  // Compression for responses
  app.use(compression());

  // Parse JSON bodies
  app.use(express.json({ limit: '10mb' }));

  // Parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Parse cookies
  app.use(cookieParser());

  // ==========================================================================
  // LOGGING MIDDLEWARE
  // ==========================================================================

  app.use(requestLogger);

  // ==========================================================================
  // ROUTES
  // ==========================================================================

  // Public routes
  app.use('/api/health', healthRouter);
  app.use('/api/info', healthRouter);

  // Authentication routes
  app.use('/api/auth', authRouter);

  // Protected routes (require authentication)
  app.use('/api', protectedRouter);

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function main(): Promise<void> {
  const app = createApp();
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || '0.0.0.0';

  app.listen(port, host, () => {
    console.log(\`
======================================
  ${config.name} Server
======================================
  Environment: \${process.env.NODE_ENV || 'development'}
  Server:      http://\${host}:\${port}
  Health:      http://\${host}:\${port}/api/health
======================================
    \`);
  });
}

// Start server
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export { createApp };
`;
}

/**
 * Generates src/middleware/error-handler.ts
 */
function generateErrorHandler(): string {
  return `/**
 * Error Handling Middleware
 *
 * Provides centralized error handling for the Express application.
 */

import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'ERROR';
    this.details = details;
    this.isOperational = true;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(404, message, 'NOT_FOUND');
  }

  static conflict(message: string): AppError {
    return new AppError(409, message, 'CONFLICT');
  }

  static tooManyRequests(message = 'Too many requests'): AppError {
    return new AppError(429, message, 'TOO_MANY_REQUESTS');
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(500, message, 'INTERNAL_ERROR');
  }
}

/**
 * Error response structure
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
  timestamp: string;
  path: string;
}

/**
 * Global error handler middleware
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error for debugging
  const timestamp = new Date().toISOString();
  console.error(\`[ERROR] \${timestamp} \${req.method} \${req.path}:\`, {
    message: err.message,
    name: err.name,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  const response: ErrorResponse = {
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    timestamp,
    path: req.path,
  };

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    response.error = {
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    };
    res.status(400).json(response);
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    response.error = {
      message: err.message,
      code: err.code,
      details: err.details,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle syntax errors in JSON
  if (err instanceof SyntaxError && 'body' in err) {
    response.error = {
      message: 'Invalid JSON in request body',
      code: 'INVALID_JSON',
    };
    res.status(400).json(response);
    return;
  }

  // Handle other errors
  if (process.env.NODE_ENV === 'development') {
    response.error.message = err.message;
    response.error.details = err.stack;
  }

  res.status(500).json(response);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ErrorResponse = {
    success: false,
    error: {
      message: \`Route \${req.method} \${req.path} not found\`,
      code: 'NOT_FOUND',
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  res.status(404).json(response);
};
`;
}

/**
 * Generates src/middleware/request-logger.ts
 */
function generateRequestLogger(): string {
  return `/**
 * Request Logging Middleware
 *
 * Logs incoming requests with timing information.
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Request logger middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Color code based on status
    let logLevel: 'info' | 'warn' | 'error' = 'info';
    if (statusCode >= 500) {
      logLevel = 'error';
    } else if (statusCode >= 400) {
      logLevel = 'warn';
    }

    const logMessage = \`[\${logLevel.toUpperCase()}] \${timestamp} \${req.method} \${req.path} \${statusCode} \${duration}ms\`;

    switch (logLevel) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  });

  next();
}
`;
}

/**
 * Generates src/middleware/auth.ts - Authentication middleware
 */
function generateAuthMiddleware(): string {
  return `/**
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
`;
}

/**
 * Generates src/lib/auth.ts - Lucia configuration
 */
function generateLuciaAuth(config: ProjectConfig): string {
  const adapterImport = config.database === 'postgresql'
    ? `import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';`
    : `import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';`;

  const adapterInit = config.database === 'postgresql'
    ? `const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);`
    : `const adapter = new DrizzleSQLiteAdapter(db, sessions, users);`;

  return `/**
 * Lucia Authentication Configuration
 *
 * Configures Lucia for session-based authentication with Drizzle ORM.
 */

import { Lucia } from 'lucia';
${adapterImport}
import { db } from '../db/index.js';
import { sessions, users } from '../db/schema/index.js';

${adapterInit}

/**
 * Lucia instance
 */
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    name: 'auth_session',
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      name: attributes.name,
      image: attributes.image,
    };
  },
});

/**
 * Type declarations for Lucia
 */
declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      name: string | null;
      image: string | null;
    };
  }
}

export type { User, Session } from 'lucia';
`;
}

/**
 * Generates src/lib/password.ts - Password hashing utilities
 */
function generatePasswordUtils(): string {
  return `/**
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
`;
}

/**
 * Generates src/lib/validation.ts - Zod validation schemas
 */
function generateValidationSchemas(): string {
  return `/**
 * Validation Schemas
 *
 * Zod schemas for request validation.
 */

import { z } from 'zod';

/**
 * Sign up request schema
 */
export const signUpSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

/**
 * Sign in request schema
 */
export const signInSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required'),
});

/**
 * Profile update schema
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  image: z
    .string()
    .url('Invalid image URL')
    .optional()
    .nullable(),
});

// Type exports
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
`;
}

/**
 * Generates src/routes/health.ts - Health check routes
 */
function generateHealthRoutes(config: ProjectConfig): string {
  return `/**
 * Health Check Routes
 *
 * Public endpoints for health checks and system information.
 */

import { Router, type Request, type Response } from 'express';
import { db } from '../db/index.js';

const router = Router();

/**
 * GET /api/health
 * Basic health check endpoint
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

/**
 * GET /api/info
 * System information endpoint
 */
router.get('/info', async (_req: Request, res: Response) => {
  // Test database connection
  let dbStatus = 'disconnected';
  try {
    // Simple query to test connection
    await db.query.users.findFirst();
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }

  res.json({
    success: true,
    data: {
      name: '${config.name}',
      version: process.env.npm_package_version || '0.0.1',
      environment: process.env.NODE_ENV || 'development',
      database: {
        type: '${config.database}',
        status: dbStatus,
      },
      auth: 'lucia',
      timestamp: new Date().toISOString(),
    },
  });
});

export { router as healthRouter };
`;
}

/**
 * Generates src/routes/auth.ts - Authentication routes
 */
function generateAuthRoutes(): string {
  return `/**
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
`;
}

/**
 * Generates src/routes/protected.ts - Protected routes
 */
function generateProtectedRoutes(): string {
  return `/**
 * Protected Routes
 *
 * Routes that require authentication.
 * Routes: /api/dashboard, /api/profile
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { eq } from 'drizzle-orm';

import { db } from '../db/index.js';
import { users } from '../db/schema/index.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { updateProfileSchema } from '../lib/validation.js';
import { AppError } from '../middleware/error-handler.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * GET /api/dashboard
 * Get dashboard data for authenticated user
 */
router.get('/dashboard', (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  res.json({
    success: true,
    data: {
      message: 'Welcome to your dashboard!',
      user: {
        id: authReq.user.id,
        email: authReq.user.email,
        name: authReq.user.name,
        image: authReq.user.image,
      },
      stats: {
        // Example dashboard stats - customize as needed
        memberSince: 'Recently joined',
        lastLogin: new Date().toISOString(),
      },
    },
  });
});

/**
 * GET /api/profile
 * Get user profile
 */
router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const user = await db.query.users.findFirst({
      where: eq(users.id, authReq.user.id),
      columns: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/profile
 * Update user profile
 */
router.patch('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // Validate request body
    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      throw validation.error;
    }

    const updates = validation.data;

    // Only update if there are changes
    if (Object.keys(updates).length === 0) {
      throw AppError.badRequest('No updates provided');
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, authReq.user.id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        updatedAt: users.updatedAt,
      });

    if (!updatedUser) {
      throw AppError.notFound('User not found');
    }

    res.json({
      success: true,
      data: {
        message: 'Profile updated successfully',
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as protectedRouter };
`;
}

/**
 * Generates src/db/seed.ts - Database seeding script
 */
function generateSeedScript(config: ProjectConfig): string {
  return `/**
 * Database Seed Script
 *
 * Populates the database with development data.
 * Run with: npm run db:seed
 */

import 'dotenv/config';
import { db } from './index.js';
import { users, sessions } from './schema/index.js';
import { hashPassword } from '../lib/password.js';
import { generateId } from 'lucia';

/**
 * Seed data configuration
 */
const SEED_USERS = [
  {
    email: 'admin@example.com',
    name: 'Admin User',
    password: 'Admin123!',
  },
  {
    email: 'user@example.com',
    name: 'Test User',
    password: 'User123!',
  },
  {
    email: 'demo@example.com',
    name: 'Demo User',
    password: 'Demo123!',
  },
];

/**
 * Main seed function
 */
async function seed(): Promise<void> {
  console.log('');
  console.log('==========================================');
  console.log('  ${config.name} - Database Seeding');
  console.log('==========================================');
  console.log('');

  try {
    // Clear existing data
    console.log('[1/3] Clearing existing data...');
    await db.delete(sessions);
    await db.delete(users);
    console.log('      Cleared sessions and users tables');

    // Create users
    console.log('[2/3] Creating seed users...');
    for (const userData of SEED_USERS) {
      const userId = generateId(15);
      const passwordHash = await hashPassword(userData.password);

      await db.insert(users).values({
        id: userId,
        email: userData.email,
        name: userData.name,
        passwordHash,
      });

      console.log(\`      Created: \${userData.email}\`);
    }

    // Display summary
    console.log('[3/3] Seed completed successfully!');
    console.log('');
    console.log('==========================================');
    console.log('  Test Accounts');
    console.log('==========================================');
    for (const user of SEED_USERS) {
      console.log(\`  Email:    \${user.email}\`);
      console.log(\`  Password: \${user.password}\`);
      console.log('');
    }
    console.log('==========================================');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('Seed failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run seed
seed();
`;
}

/**
 * Generates nodemon.json configuration
 */
function generateNodemonConfig(): Record<string, unknown> {
  return {
    watch: ['src'],
    ext: 'ts,json',
    ignore: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exec: 'tsx src/index.ts',
  };
}

/**
 * Generates .env.example for Express
 */
function generateExpressEnvExample(config: ProjectConfig): string {
  const lines = [
    '# Environment Variables',
    '# Copy this file to .env and fill in the values',
    '',
    '# Node environment',
    'NODE_ENV=development',
    '',
    '# Server configuration',
    'PORT=3000',
    'HOST=0.0.0.0',
    '',
    '# CORS - comma-separated list of allowed origins',
    'CORS_ORIGIN=http://localhost:5173',
    '',
    '# Database',
  ];

  if (config.database === 'postgresql') {
    lines.push('DATABASE_URL=postgresql://user:password@localhost:5432/dbname');
  } else {
    lines.push(`DATABASE_PATH=./data/${config.name}.db`);
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Generates enhanced package.json for Express with Lucia auth
 */
function generateEnhancedExpressPackageJson(config: ProjectConfig): Record<string, unknown> {
  const basePackageJson = generateExpressPackageJson(config) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    scripts: Record<string, string>;
    [key: string]: unknown;
  };

  // Ensure Lucia dependencies are included
  basePackageJson.dependencies.lucia = DEPENDENCY_VERSIONS.lucia;
  basePackageJson.dependencies['@lucia-auth/adapter-drizzle'] = DEPENDENCY_VERSIONS.luciaAdapterDrizzle;
  basePackageJson.dependencies.bcryptjs = DEPENDENCY_VERSIONS.bcryptjs;
  basePackageJson.devDependencies['@types/bcryptjs'] = DEPENDENCY_VERSIONS.typesBcryptjs;

  // Add seed script
  basePackageJson.scripts['db:seed'] = 'tsx src/db/seed.ts';

  return basePackageJson;
}

// =============================================================================
// EXPRESS GENERATOR CLASS
// =============================================================================

export class ExpressGenerator extends BaseGenerator {
  constructor(config: ProjectConfig, destPath: string) {
    super(config, destPath);
  }

  async generate(): Promise<GenerationResult> {
    try {
      // Create project structure
      await this.createDirectoryStructure();

      // Generate configuration files
      await this.generatePackageJson();
      await this.generateTsConfig();
      await this.generateNodemonConfig();

      // Generate source files
      await this.generateServerEntry();
      await this.generateMiddleware();
      await this.generateLibFiles();
      await this.generateRoutes();

      // Generate Drizzle files
      await this.setupDrizzle();

      // Generate seed script
      await this.generateSeedScript();

      // Generate shared files
      await this.setupSharedFiles();

      // Copy any existing templates
      const templateDir = getTemplateDir('express');
      await this.copyTemplateFiles(templateDir);

      return this.createResult(true, 'Express 5 backend project generated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.errors.push(errorMessage);
      return this.createResult(false, `Failed to generate Express project: ${errorMessage}`);
    }
  }

  private async createDirectoryStructure(): Promise<void> {
    const directories = [
      'src',
      'src/db',
      'src/db/schema',
      'src/lib',
      'src/middleware',
      'src/routes',
      'drizzle/migrations',
      'data',
    ];

    for (const dir of directories) {
      const dirPath = path.join(this.destPath, dir);
      await fs.ensureDir(dirPath);
    }
  }

  protected async generatePackageJson(): Promise<void> {
    const packageJson = generateEnhancedExpressPackageJson(this.config);
    await this.writeProjectJsonFile('package.json', packageJson);
  }

  protected async generateTsConfig(): Promise<void> {
    const tsConfig = generateExpressTsConfig();
    await this.writeProjectJsonFile('tsconfig.json', tsConfig);
  }

  private async generateNodemonConfig(): Promise<void> {
    const nodemonConfig = generateNodemonConfig();
    await this.writeProjectJsonFile('nodemon.json', nodemonConfig);
  }

  private async generateServerEntry(): Promise<void> {
    await this.writeProjectFile('src/index.ts', generateServerEntry(this.config));
  }

  private async generateMiddleware(): Promise<void> {
    await this.writeProjectFile('src/middleware/error-handler.ts', generateErrorHandler());
    await this.writeProjectFile('src/middleware/request-logger.ts', generateRequestLogger());
    await this.writeProjectFile('src/middleware/auth.ts', generateAuthMiddleware());
  }

  private async generateLibFiles(): Promise<void> {
    await this.writeProjectFile('src/lib/auth.ts', generateLuciaAuth(this.config));
    await this.writeProjectFile('src/lib/password.ts', generatePasswordUtils());
    await this.writeProjectFile('src/lib/validation.ts', generateValidationSchemas());
  }

  private async generateRoutes(): Promise<void> {
    await this.writeProjectFile('src/routes/health.ts', generateHealthRoutes(this.config));
    await this.writeProjectFile('src/routes/auth.ts', generateAuthRoutes());
    await this.writeProjectFile('src/routes/protected.ts', generateProtectedRoutes());
  }

  private async generateSeedScript(): Promise<void> {
    await this.writeProjectFile('src/db/seed.ts', generateSeedScript(this.config));
  }

  protected override async setupDrizzle(): Promise<void> {
    // Generate drizzle.config.ts
    await this.writeProjectFile('drizzle.config.ts', generateDrizzleConfig(this.config));

    // Generate database client
    await this.writeProjectFile('src/db/index.ts', generateDatabaseClient(this.config));

    // Generate schema files
    await this.writeProjectFile('src/db/schema/users.ts', generateUsersSchema(this.config));
    await this.writeProjectFile('src/db/schema/sessions.ts', generateSessionsSchema(this.config));
    await this.writeProjectFile('src/db/schema/index.ts', generateSchemaIndex(this.config));

    // Create migrations directory with .gitkeep
    const migrationsDir = path.join(this.destPath, 'drizzle', 'migrations');
    await fs.ensureDir(migrationsDir);
    await writeFile(path.join(migrationsDir, '.gitkeep'), '');
    this.createdFiles.push(path.join(migrationsDir, '.gitkeep'));
  }

  protected override async setupSharedFiles(): Promise<void> {
    // Override to use Express-specific .env.example
    await super.setupSharedFiles();
    await this.writeProjectFile('.env.example', generateExpressEnvExample(this.config));
  }
}

// =============================================================================
// STANDALONE GENERATE FUNCTION
// =============================================================================

/**
 * Standalone function to generate an Express 5 backend project
 * Can be used without instantiating the class
 */
export async function generate(
  config: ProjectConfig,
  destPath: string
): Promise<GenerationResult> {
  const generator = new ExpressGenerator(config, destPath);
  return generator.generate();
}

export default ExpressGenerator;
