#!/usr/bin/env node

/**
 * stackgen - Full-Stack TypeScript Project Generator
 *
 * Main entry point for the CLI application.
 * Orchestrates the entire project generation workflow:
 *   1. Parse command-line arguments
 *   2. Collect project options (interactive or non-interactive)
 *   3. Generate the project structure
 *   4. Initialize git repository
 *   5. Display success message with next steps
 *
 * @module stackgen
 */

import path from 'path';
import { execSync } from 'child_process';
import { parseArgs } from './cli/args.js';
import {
  collectOptions,
  collectOptionsNonInteractive,
  showNonInteractiveSummary,
  showOutro,
  showError,
  showWarning,
  showSuccess,
  showInfo,
  createSpinner,
} from './cli/prompts.js';
import type { ProjectOptions, FrontendFramework, BackendFramework } from './cli/types.js';
import { generateProject, isMonorepoConfig, type ProjectConfig } from './generators/index.js';

// =============================================================================
// TYPE CONVERSION
// =============================================================================

/**
 * Converts ProjectOptions (from CLI) to ProjectConfig (for generators)
 *
 * The types are compatible but have some naming differences:
 * - ProjectOptions.projectName -> ProjectConfig.name
 * - ProjectOptions.deployment -> ProjectConfig.deployment (maps 'docker' and 'vercel')
 *
 * @param options - CLI project options
 * @returns Generator project config
 */
function convertToProjectConfig(options: ProjectOptions): ProjectConfig {
  return {
    name: options.projectName,
    frontend: options.frontend,
    backend: mapBackendType(options.frontend, options.backend),
    database: options.database,
    auth: options.auth,
    deployment: mapDeploymentType(options.deployment),
    extras: {
      eslint: options.extras.eslint,
      prettier: options.extras.prettier,
      husky: options.extras.husky,
      docker: options.deployment === 'docker',
      githubActions: options.extras.githubActions,
      envValidation: true, // Always include env validation
    },
  };
}

/**
 * Maps CLI backend type to generator backend type
 */
function mapBackendType(frontend: FrontendFramework, backend: BackendFramework): 'express' | 'none' {
  if (frontend === 'nextjs') {
    // Next.js has built-in API routes, no separate backend needed
    return 'none';
  }
  return backend === 'express' ? 'express' : 'none';
}

/**
 * Maps CLI deployment target to generator deployment type
 */
function mapDeploymentType(deployment: 'docker' | 'vercel'): 'docker' | 'vercel' | 'none' {
  return deployment;
}

// =============================================================================
// GIT INITIALIZATION
// =============================================================================

/**
 * Initializes a git repository in the project directory
 *
 * @param projectPath - Path to the project directory
 * @returns True if successful, false otherwise
 */
function initializeGitRepo(projectPath: string): boolean {
  try {
    execSync('git init', {
      cwd: projectPath,
      stdio: 'pipe',
    });

    execSync('git add -A', {
      cwd: projectPath,
      stdio: 'pipe',
    });

    execSync('git commit -m "Initial commit from stackgen"', {
      cwd: projectPath,
      stdio: 'pipe',
    });

    return true;
  } catch {
    // Git might not be installed or configured
    return false;
  }
}

// =============================================================================
// PROJECT GENERATION
// =============================================================================

/**
 * Runs the project generation with proper spinner messages
 *
 * @param options - Project options from CLI
 * @param destPath - Destination path for the project
 */
async function runGeneration(options: ProjectOptions, destPath: string): Promise<void> {
  const spinner = createSpinner();
  const config = convertToProjectConfig(options);
  const isMonorepo = isMonorepoConfig(config);

  try {
    // Start generation
    spinner.start('Creating project structure...');

    // Log what we're generating
    if (options.frontend === 'nextjs') {
      spinner.message('Generating Next.js 15 project...');
    } else if (isMonorepo) {
      spinner.message('Generating Vite + Express monorepo...');
    } else {
      spinner.message('Generating Vite + React project...');
    }

    // Run the actual generation
    const result = await generateProject(config, destPath);

    if (!result.success) {
      spinner.stop('Generation failed');
      throw new Error(result.message);
    }

    // Show progress for different parts
    spinner.message('Setting up database schema...');
    await delay(100);

    spinner.message('Configuring authentication...');
    await delay(100);

    if (config.extras.docker) {
      spinner.message('Adding Docker configuration...');
      await delay(50);
    }

    if (config.extras.githubActions) {
      spinner.message('Creating CI/CD workflows...');
      await delay(50);
    }

    if (config.extras.eslint || config.extras.prettier) {
      spinner.message('Configuring code quality tools...');
      await delay(50);
    }

    if (config.extras.husky) {
      spinner.message('Setting up git hooks...');
      await delay(50);
    }

    // Initialize git repository
    spinner.message('Initializing git repository...');
    const gitInitialized = initializeGitRepo(destPath);

    if (gitInitialized) {
      spinner.stop(`Project created successfully! (${result.filesCreated.length} files)`);
    } else {
      spinner.stop(`Project created successfully! (${result.filesCreated.length} files)`);
      showWarning('Could not initialize git repository. You may need to run "git init" manually.');
    }

    // Show any warnings/errors that occurred during generation
    if (result.errors.length > 0) {
      for (const error of result.errors) {
        showWarning(error);
      }
    }

  } catch (error) {
    spinner.stop('Generation failed');
    throw error;
  }
}

/**
 * Utility function to create a delay
 *
 * @param ms - Milliseconds to delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// CUSTOM OUTRO
// =============================================================================

/**
 * Shows the outro message with proper next steps based on project type
 */
function showCustomOutro(options: ProjectOptions, destPath: string): void {
  const config = convertToProjectConfig(options);
  const isMonorepo = isMonorepoConfig(config);

  showOutro(options.projectName);

  // Show additional instructions for monorepo
  if (isMonorepo) {
    console.log('');
    showInfo('This is a monorepo project with:');
    console.log('    - client/  (Vite + React frontend)');
    console.log('    - server/  (Express.js backend)');
    console.log('');
    showInfo('To install all dependencies:');
    console.log(`    cd ${options.projectName}`);
    console.log('    npm install');
    console.log('    cd client && npm install');
    console.log('    cd ../server && npm install');
    console.log('');
  }

  // Show database setup instructions
  showInfo('Database setup:');
  if (config.database === 'postgresql') {
    console.log('    1. Create a PostgreSQL database');
    console.log('    2. Update DATABASE_URL in .env');
    console.log('    3. Run: npm run db:push');
  } else {
    console.log('    1. Run: npm run db:push');
    console.log('    (SQLite database will be created automatically)');
  }
  console.log('');
}

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

/**
 * Main application entry point
 *
 * Orchestrates the complete workflow:
 * 1. Parses CLI arguments
 * 2. Collects options (interactive or non-interactive based on --yes flag)
 * 3. Generates the project
 * 4. Initializes git repository
 * 5. Shows success message
 *
 * @returns Promise that resolves when generation is complete
 *
 * @example
 * ```bash
 * # Interactive mode
 * npx stackgen
 *
 * # Non-interactive with defaults
 * npx stackgen --yes
 *
 * # With specific options
 * npx stackgen my-app --frontend nextjs --database postgresql
 * ```
 */
export async function main(): Promise<void> {
  try {
    // Parse command-line arguments
    const args = parseArgs();

    let options: ProjectOptions | null;

    // Determine mode based on --yes flag
    if (args.yes) {
      // Non-interactive mode: use defaults for unspecified options
      options = collectOptionsNonInteractive(args);
      showNonInteractiveSummary(options);
    } else {
      // Interactive mode: prompt for missing options
      options = await collectOptions(args);

      // User cancelled
      if (!options) {
        process.exit(0);
      }
    }

    // Determine destination path
    const destPath = path.resolve(process.cwd(), options.projectName);

    // Generate the project
    await runGeneration(options, destPath);

    // Show success message and next steps
    showCustomOutro(options, destPath);

  } catch (error) {
    // Handle unexpected errors gracefully
    if (error instanceof Error) {
      showError(`An error occurred: ${error.message}`);
    } else {
      showError('An unexpected error occurred');
    }
    process.exit(1);
  }
}

// Run the main function when executed directly
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// =============================================================================
// EXPORTS
// =============================================================================

// Re-export types and utilities for programmatic use
export type { ProjectOptions } from './cli/types.js';
export { parseArgs } from './cli/args.js';
export { collectOptions, collectOptionsNonInteractive } from './cli/prompts.js';

// Re-export generator functionality
export { generateProject, isMonorepoConfig } from './generators/index.js';
export type { ProjectConfig, GenerationResult } from './generators/index.js';
