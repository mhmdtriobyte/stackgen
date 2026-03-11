/**
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
  console.log('  testapp - Database Seeding');
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

      console.log(`      Created: ${userData.email}`);
    }

    // Display summary
    console.log('[3/3] Seed completed successfully!');
    console.log('');
    console.log('==========================================');
    console.log('  Test Accounts');
    console.log('==========================================');
    for (const user of SEED_USERS) {
      console.log(`  Email:    ${user.email}`);
      console.log(`  Password: ${user.password}`);
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
