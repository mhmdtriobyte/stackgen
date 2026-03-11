/**
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

    const logMessage = `[${logLevel.toUpperCase()}] ${timestamp} ${req.method} ${req.path} ${statusCode} ${duration}ms`;

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
