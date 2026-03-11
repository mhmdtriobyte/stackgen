/**
 * Drizzle Kit Configuration
 *
 * This file configures Drizzle Kit for database migrations and schema management.
 * Generated for: testapp
 * Database: postgresql
 */

import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// PostgreSQL Configuration
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Enable verbose logging during development
  verbose: true,
  // Enable strict mode for better type safety
  strict: true,
} satisfies Config;
