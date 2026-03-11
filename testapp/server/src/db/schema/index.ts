/**
 * Database Schema Index
 *
 * Central export point for all database schemas.
 */

// Export all table schemas
export * from './users';
export * from './sessions';


// Re-export relations if needed
export { usersRelations } from './users';
export { sessionsRelations } from './sessions';

