/**
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
      name: 'testapp',
      version: process.env.npm_package_version || '0.0.1',
      environment: process.env.NODE_ENV || 'development',
      database: {
        type: 'postgresql',
        status: dbStatus,
      },
      auth: 'lucia',
      timestamp: new Date().toISOString(),
    },
  });
});

export { router as healthRouter };
