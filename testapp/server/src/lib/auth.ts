/**
 * Lucia Authentication Configuration
 *
 * Configures Lucia for session-based authentication with Drizzle ORM.
 */

import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from '../db/index.js';
import { sessions, users } from '../db/schema/index.js';

const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

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
