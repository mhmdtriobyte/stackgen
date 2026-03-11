/**
 * CLI Types and Interfaces
 *
 * This module defines all type definitions used throughout the stackgen CLI.
 * These types ensure type safety and provide clear contracts between modules.
 */

/**
 * Available frontend framework options
 */
export type FrontendFramework = 'nextjs' | 'vite';

/**
 * Available backend framework options
 * - 'nextjs' uses Next.js API routes (when frontend is nextjs)
 * - 'express' is used when frontend is vite
 */
export type BackendFramework = 'nextjs' | 'express';

/**
 * Available database options
 */
export type DatabaseOption = 'postgresql' | 'sqlite';

/**
 * Available authentication options
 */
export type AuthOption = 'authjs' | 'lucia';

/**
 * Available deployment target options
 */
export type DeploymentTarget = 'docker' | 'vercel';

/**
 * Extra tooling configuration options
 */
export interface ExtrasConfig {
  /** Include ESLint configuration */
  eslint: boolean;
  /** Include Prettier configuration */
  prettier: boolean;
  /** Include Husky git hooks */
  husky: boolean;
  /** Include GitHub Actions CI/CD workflows */
  githubActions: boolean;
}

/**
 * Complete project configuration options
 *
 * This interface represents all the choices made during the CLI prompts
 * or provided via command-line arguments.
 */
export interface ProjectOptions {
  /** Project name (used for directory and package.json) */
  projectName: string;
  /** Selected frontend framework */
  frontend: FrontendFramework;
  /** Selected backend framework (derived from frontend choice) */
  backend: BackendFramework;
  /** Selected database */
  database: DatabaseOption;
  /** Selected authentication solution */
  auth: AuthOption;
  /** Selected deployment target */
  deployment: DeploymentTarget;
  /** Extra tooling configuration */
  extras: ExtrasConfig;
}

/**
 * CLI argument options parsed from command line
 *
 * These are the raw options from commander before processing.
 * Optional fields indicate values that may need to be collected interactively.
 */
export interface CLIArgs {
  /** Non-interactive mode - use defaults for unspecified options */
  yes: boolean;
  /** Project name from --name flag */
  name?: string;
  /** Frontend framework from --frontend flag */
  frontend?: FrontendFramework;
  /** Database from --database flag */
  database?: DatabaseOption;
  /** Auth solution from --auth flag */
  auth?: AuthOption;
  /** Deployment target from --deployment flag */
  deployment?: DeploymentTarget;
}

/**
 * Default project options used in non-interactive mode
 */
export const DEFAULT_OPTIONS: Omit<ProjectOptions, 'projectName'> = {
  frontend: 'nextjs',
  backend: 'nextjs',
  database: 'postgresql',
  auth: 'authjs',
  deployment: 'docker',
  extras: {
    eslint: true,
    prettier: true,
    husky: true,
    githubActions: true,
  },
};

/**
 * Validation result for project name
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validates a project name according to npm naming conventions
 *
 * @param name - The project name to validate
 * @returns Validation result with optional error message
 */
export function validateProjectName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'Project name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length > 214) {
    return { valid: false, message: 'Project name must be 214 characters or fewer' };
  }

  if (trimmed.startsWith('.') || trimmed.startsWith('_')) {
    return { valid: false, message: 'Project name cannot start with a dot or underscore' };
  }

  // npm package name rules: lowercase, no spaces, only URL-safe characters
  const validPattern = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
  if (!validPattern.test(trimmed)) {
    return {
      valid: false,
      message: 'Project name must be lowercase and URL-friendly (letters, numbers, hyphens, underscores)',
    };
  }

  return { valid: true };
}

/**
 * Derives the backend framework based on frontend selection
 *
 * @param frontend - Selected frontend framework
 * @returns Appropriate backend framework
 */
export function deriveBackend(frontend: FrontendFramework): BackendFramework {
  return frontend === 'nextjs' ? 'nextjs' : 'express';
}
