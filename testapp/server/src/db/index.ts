/**
 * Database Client
 *
 * Drizzle ORM client configured for PostgreSQL.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Connection pool configuration
const connectionString = process.env.DATABASE_URL;

// For query purposes
const queryClient = postgres(connectionString, {
  max: 10, // Maximum connections in pool
  idle_timeout: 20, // Seconds before closing idle connection
  connect_timeout: 10, // Seconds to wait for connection
});

// Create drizzle instance with schema
export const db = drizzle(queryClient, { schema });

// Export types
export type Database = typeof db;
