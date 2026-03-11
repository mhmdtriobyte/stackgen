/**
 * Users Table Schema
 *
 * Defines the users table structure for authentication and user management.
 * Database: PostgreSQL
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sessions } from './sessions';


/**
 * Users table - stores user account information
 *
 * Fields:
 * - id: UUID primary key (auto-generated)
 * - email: Unique email address for authentication
 * - emailVerified: Timestamp when email was verified
 * - passwordHash: Hashed password (nullable for OAuth-only users)
 * - name: User's display name
 * - image: Profile image URL
 * - createdAt: Account creation timestamp
 * - updatedAt: Last update timestamp
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: timestamp('email_verified', { mode: 'date' }),
    passwordHash: text('password_hash'),
    name: varchar('name', { length: 255 }),
    image: text('image'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Index on email for fast lookups during authentication
    emailIdx: index('users_email_idx').on(table.email),
    // Index on createdAt for sorting/pagination
    createdAtIdx: index('users_created_at_idx').on(table.createdAt),
  })
);

/**
 * Users relations - defines relationships with other tables
 */
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),

}));

// Type exports for use throughout the application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
