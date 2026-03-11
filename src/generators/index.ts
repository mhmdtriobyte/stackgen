/**
 * Generators Index Module
 *
 * Central export point for all project generators.
 * Provides the main generateProject function that orchestrates
 * project generation based on configuration.
 */

import path from 'path';
import fs from 'fs-extra';
import { NextJsGenerator } from './nextjs.js';
import { ViteGenerator } from './vite.js';
import { ExpressGenerator } from './express.js';
import type { ProjectConfig, GenerationResult } from './base.js';

// =============================================================================
// EXPORTS
// =============================================================================

// Export generators
export { NextJsGenerator } from './nextjs.js';
export { ViteGenerator } from './vite.js';
export { ExpressGenerator } from './express.js';

// Export types and utilities from base
export type {
  ProjectConfig,
  GenerationResult,
  TemplateData,
  FrontendType,
  BackendType,
  DatabaseType,
  AuthType,
  DeploymentType,
  ExtrasConfig,
} from './base.js';

export {
  BaseGenerator,
  createTemplateData,
  renderTemplate,
  renderTemplateFile,
  copyTemplates,
  writeFile,
  writeJsonFile,
  DEPENDENCY_VERSIONS,
} from './base.js';

// =============================================================================
// COMBINED GENERATION RESULT
// =============================================================================

/**
 * Combines multiple generation results into a single result
 */
function combineResults(results: GenerationResult[]): GenerationResult {
  const allSuccess = results.every((r) => r.success);
  const allFiles = results.flatMap((r) => r.filesCreated);
  const allErrors = results.flatMap((r) => r.errors);

  const messages = results.map((r) => r.message).join('; ');

  return {
    success: allSuccess,
    message: allSuccess ? 'Project generated successfully' : messages,
    filesCreated: allFiles,
    errors: allErrors,
  };
}

// =============================================================================
// MONOREPO GENERATION
// =============================================================================

/**
 * Generates a monorepo package.json for Vite + Express projects
 */
function generateMonorepoPackageJson(name: string): Record<string, unknown> {
  return {
    name,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'concurrently "npm run dev:server" "npm run dev:client"',
      'dev:client': 'cd client && npm run dev',
      'dev:server': 'cd server && npm run dev',
      build: 'npm run build:server && npm run build:client',
      'build:client': 'cd client && npm run build',
      'build:server': 'cd server && npm run build',
      start: 'cd server && npm start',
      lint: 'npm run lint:client && npm run lint:server',
      'lint:client': 'cd client && npm run lint',
      'lint:server': 'cd server && npm run lint',
      'db:generate': 'cd server && npm run db:generate',
      'db:migrate': 'cd server && npm run db:migrate',
      'db:push': 'cd server && npm run db:push',
      'db:studio': 'cd server && npm run db:studio',
    },
    devDependencies: {
      concurrently: '^8.2.2',
    },
  };
}

/**
 * Generates a monorepo README
 */
function generateMonorepoReadme(name: string): string {
  return `# ${name}

A full-stack TypeScript application with Vite + React frontend and Express backend.

## Project Structure

\`\`\`
${name}/
  client/     # Vite + React frontend
  server/     # Express.js backend
\`\`\`

## Getting Started

### Install Dependencies

\`\`\`bash
# Install root dependencies (concurrently)
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
\`\`\`

### Development

Start both frontend and backend in development mode:

\`\`\`bash
npm run dev
\`\`\`

Or start them separately:

\`\`\`bash
# Terminal 1 - Backend (port 3000)
npm run dev:server

# Terminal 2 - Frontend (port 5173)
npm run dev:client
\`\`\`

### Database Setup

\`\`\`bash
# Generate migrations
npm run db:generate

# Push schema to database
npm run db:push

# Open Drizzle Studio
npm run db:studio
\`\`\`

### Build

\`\`\`bash
npm run build
\`\`\`

## Environment Variables

### Server (.env in /server)

See \`server/.env.example\` for required environment variables.

### Client (.env in /client)

See \`client/.env.example\` for optional environment variables.

## License

MIT
`;
}

/**
 * Generates monorepo .gitignore
 */
function generateMonorepoGitignore(): string {
  return `# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
.next/
out/

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Testing
coverage/
.nyc_output/

# TypeScript
*.tsbuildinfo

# Drizzle
drizzle/

# SQLite
data/
*.db
*.db-journal
`;
}

// =============================================================================
// MAIN GENERATE FUNCTION
// =============================================================================

/**
 * Main project generation function
 *
 * Determines which generators to use based on configuration:
 * - For Next.js frontend: Uses NextJsGenerator only (full-stack)
 * - For Vite frontend with Express backend: Creates monorepo with both generators
 *
 * @param config - Project configuration
 * @param destPath - Destination path for the project
 * @returns Combined generation result
 *
 * @example
 * ```ts
 * const result = await generateProject(
 *   {
 *     name: 'my-app',
 *     frontend: 'nextjs',
 *     backend: 'none',
 *     database: 'postgresql',
 *     auth: 'authjs',
 *     deployment: 'docker',
 *     extras: { eslint: true, prettier: true, husky: true, docker: true, githubActions: true, envValidation: true },
 *   },
 *   '/path/to/projects/my-app'
 * );
 * ```
 */
export async function generateProject(
  config: ProjectConfig,
  destPath: string
): Promise<GenerationResult> {
  const results: GenerationResult[] = [];

  try {
    // Ensure destination directory exists
    await fs.ensureDir(destPath);

    // Check if directory is empty (or doesn't exist)
    const files = await fs.readdir(destPath);
    if (files.length > 0) {
      return {
        success: false,
        message: `Destination directory is not empty: ${destPath}`,
        filesCreated: [],
        errors: ['Directory must be empty to generate project'],
      };
    }

    if (config.frontend === 'nextjs') {
      // Next.js is a full-stack solution, use only NextJsGenerator
      const generator = new NextJsGenerator(config, destPath);
      const result = await generator.generate();
      results.push(result);
    } else if (config.frontend === 'vite' && config.backend === 'express') {
      // Vite + Express creates a monorepo structure
      const clientPath = path.join(destPath, 'client');
      const serverPath = path.join(destPath, 'server');

      // Create monorepo structure
      await fs.ensureDir(clientPath);
      await fs.ensureDir(serverPath);

      // Generate root package.json
      const rootPackageJson = generateMonorepoPackageJson(config.name);
      await fs.writeJson(path.join(destPath, 'package.json'), rootPackageJson, { spaces: 2 });

      // Generate root README
      const readme = generateMonorepoReadme(config.name);
      await fs.writeFile(path.join(destPath, 'README.md'), readme, 'utf-8');

      // Generate root .gitignore
      const gitignore = generateMonorepoGitignore();
      await fs.writeFile(path.join(destPath, '.gitignore'), gitignore, 'utf-8');

      // Generate Vite frontend in client/
      const viteGenerator = new ViteGenerator(config, clientPath);
      const viteResult = await viteGenerator.generate();
      results.push(viteResult);

      // Generate Express backend in server/
      const expressGenerator = new ExpressGenerator(config, serverPath);
      const expressResult = await expressGenerator.generate();
      results.push(expressResult);

      // Add monorepo files to result
      results.push({
        success: true,
        message: 'Monorepo structure created',
        filesCreated: [
          path.join(destPath, 'package.json'),
          path.join(destPath, 'README.md'),
          path.join(destPath, '.gitignore'),
        ],
        errors: [],
      });
    } else if (config.frontend === 'vite') {
      // Vite without Express (frontend only)
      const generator = new ViteGenerator(config, destPath);
      const result = await generator.generate();
      results.push(result);
    } else {
      return {
        success: false,
        message: `Unsupported configuration: frontend=${config.frontend}, backend=${config.backend}`,
        filesCreated: [],
        errors: ['Invalid frontend/backend combination'],
      };
    }

    return combineResults(results);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Failed to generate project: ${errorMessage}`,
      filesCreated: [],
      errors: [errorMessage],
    };
  }
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Gets the appropriate generator for a given configuration
 */
export function getGenerator(config: ProjectConfig, destPath: string): NextJsGenerator | ViteGenerator | ExpressGenerator {
  if (config.frontend === 'nextjs') {
    return new NextJsGenerator(config, destPath);
  } else if (config.frontend === 'vite') {
    return new ViteGenerator(config, destPath);
  } else {
    return new ExpressGenerator(config, destPath);
  }
}

/**
 * Checks if a configuration will create a monorepo
 */
export function isMonorepoConfig(config: ProjectConfig): boolean {
  return config.frontend === 'vite' && config.backend === 'express';
}

export default generateProject;
