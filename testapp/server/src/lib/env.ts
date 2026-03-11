/**
 * Environment Variable Validation
 *
 * Uses Zod to validate environment variables at startup.
 * This ensures all required variables are present and correctly formatted.
 */

import { z } from 'zod';

/**
 * Server-side environment variables schema
 */
const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z
    .string()
    .url()
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'DATABASE_URL must be a valid PostgreSQL connection string'
    ),
  // Lucia doesn't require specific env vars, but you might want:
  SESSION_SECRET: z.string().min(32).optional(),
});

/**
 * Client-side environment variables schema (exposed to browser)
 * In Next.js, these must be prefixed with NEXT_PUBLIC_
 */
const clientEnvSchema = z.object({
  // Add any NEXT_PUBLIC_* variables here
});

/**
 * Validates server environment variables
 * Call this at application startup
 */
export function validateServerEnv(): z.infer<typeof serverEnvSchema> {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

/**
 * Validates client environment variables
 */
export function validateClientEnv(): z.infer<typeof clientEnvSchema> {
  const parsed = clientEnvSchema.safeParse({
    // Map NEXT_PUBLIC_* variables here
  });

  if (!parsed.success) {
    console.error('Invalid client environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid client environment variables');
  }

  return parsed.data;
}

// Type exports
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
