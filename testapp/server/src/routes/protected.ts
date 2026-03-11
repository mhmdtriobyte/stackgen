/**
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
