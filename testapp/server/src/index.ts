/**
 * Express Server Entry Point
 *
 * Configures and starts the Express 5 server with all middleware and routes.
 * Generated for: testapp
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
    console.log(`
======================================
  testapp Server
======================================
  Environment: ${process.env.NODE_ENV || 'development'}
  Server:      http://${host}:${port}
  Health:      http://${host}:${port}/api/health
======================================
    `);
  });
}

// Start server
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export { createApp };
