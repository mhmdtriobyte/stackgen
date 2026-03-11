/**
 * Dependency Version Map for stackgen CLI
 *
 * Centralized version management for all packages used in generated projects.
 * This ensures consistency across all templates and makes version updates
 * straightforward.
 *
 * @module utils/deps
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Dependency specification with version and optional peer dependencies
 */
export interface DependencySpec {
  /** Package version (semver) */
  version: string;
  /** Whether this is typically a dev dependency */
  dev?: boolean;
  /** Peer dependencies that should be installed alongside */
  peerDeps?: string[];
  /** Description of the package */
  description?: string;
}

/**
 * Category of dependencies
 */
export type DependencyCategory =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'auth'
  | 'tooling'
  | 'testing'
  | 'styling';

/**
 * Dependency map with all package versions
 */
export type DependencyMap = Record<string, DependencySpec>;

/**
 * Categorized dependencies
 */
export type CategorizedDependencies = Record<DependencyCategory, DependencyMap>;

// =============================================================================
// DEPENDENCY DEFINITIONS
// =============================================================================

/**
 * Frontend framework and library versions
 */
export const FRONTEND_DEPS: DependencyMap = {
  // Next.js ecosystem
  next: {
    version: '^15.1.0',
    description: 'React framework for production',
    peerDeps: ['react', 'react-dom'],
  },
  react: {
    version: '^19.0.0',
    description: 'React library',
  },
  'react-dom': {
    version: '^19.0.0',
    description: 'React DOM renderer',
    peerDeps: ['react'],
  },
  '@types/react': {
    version: '^19.0.0',
    dev: true,
    description: 'TypeScript definitions for React',
  },
  '@types/react-dom': {
    version: '^19.0.0',
    dev: true,
    description: 'TypeScript definitions for React DOM',
  },

  // Vite ecosystem
  vite: {
    version: '^6.0.0',
    dev: true,
    description: 'Next generation frontend tooling',
  },
  '@vitejs/plugin-react': {
    version: '^4.3.0',
    dev: true,
    description: 'Vite plugin for React',
  },
  '@vitejs/plugin-react-swc': {
    version: '^3.7.0',
    dev: true,
    description: 'Vite plugin for React with SWC',
  },
};

/**
 * Backend framework and library versions
 */
export const BACKEND_DEPS: DependencyMap = {
  // Express ecosystem
  express: {
    version: '^5.0.0',
    description: 'Fast, unopinionated web framework',
  },
  '@types/express': {
    version: '^5.0.0',
    dev: true,
    description: 'TypeScript definitions for Express',
  },

  // Node.js types
  '@types/node': {
    version: '^22.0.0',
    dev: true,
    description: 'TypeScript definitions for Node.js',
  },

  // HTTP utilities
  cors: {
    version: '^2.8.5',
    description: 'CORS middleware',
  },
  '@types/cors': {
    version: '^2.8.17',
    dev: true,
    description: 'TypeScript definitions for cors',
  },
  helmet: {
    version: '^8.0.0',
    description: 'Security headers middleware',
  },
  compression: {
    version: '^1.7.4',
    description: 'Compression middleware',
  },
  '@types/compression': {
    version: '^1.7.5',
    dev: true,
    description: 'TypeScript definitions for compression',
  },

  // Logging
  pino: {
    version: '^9.0.0',
    description: 'Fast JSON logger',
  },
  'pino-pretty': {
    version: '^11.0.0',
    dev: true,
    description: 'Pretty print for pino logs',
  },
};

/**
 * Database and ORM versions
 */
export const DATABASE_DEPS: DependencyMap = {
  // Drizzle ORM
  'drizzle-orm': {
    version: '^0.38.0',
    description: 'TypeScript ORM with type-safe queries',
  },
  'drizzle-kit': {
    version: '^0.30.0',
    dev: true,
    description: 'Drizzle CLI for migrations',
  },
  'drizzle-zod': {
    version: '^0.5.1',
    description: 'Drizzle Zod integration for schema validation',
  },

  // PostgreSQL
  postgres: {
    version: '^3.4.0',
    description: 'PostgreSQL client for Node.js',
  },
  '@types/pg': {
    version: '^8.11.0',
    dev: true,
    description: 'TypeScript definitions for pg',
  },

  // SQLite
  'better-sqlite3': {
    version: '^11.0.0',
    description: 'Fast SQLite3 driver for Node.js',
  },
  '@types/better-sqlite3': {
    version: '^7.6.0',
    dev: true,
    description: 'TypeScript definitions for better-sqlite3',
  },

  // MySQL
  'mysql2': {
    version: '^3.11.0',
    description: 'MySQL client for Node.js',
  },
};

/**
 * Authentication library versions
 */
export const AUTH_DEPS: DependencyMap = {
  // Auth.js (NextAuth v5)
  'next-auth': {
    version: '^5.0.0-beta.25',
    description: 'Authentication for Next.js',
  },
  '@auth/core': {
    version: '^0.37.0',
    description: 'Auth.js core',
  },
  '@auth/drizzle-adapter': {
    version: '^1.7.0',
    description: 'Drizzle adapter for Auth.js',
  },

  // Lucia Auth
  lucia: {
    version: '^3.2.0',
    description: 'Simple and flexible authentication library',
  },
  '@lucia-auth/adapter-drizzle': {
    version: '^1.1.0',
    description: 'Drizzle adapter for Lucia',
  },
  'arctic': {
    version: '^2.0.0',
    description: 'OAuth 2.0 client library for Lucia',
  },

  // Password hashing
  '@node-rs/argon2': {
    version: '^2.0.0',
    description: 'Argon2 password hashing',
  },
  bcryptjs: {
    version: '^2.4.3',
    description: 'bcrypt password hashing',
  },
  '@types/bcryptjs': {
    version: '^2.4.6',
    dev: true,
    description: 'TypeScript definitions for bcryptjs',
  },

  // Session management
  'oslo': {
    version: '^1.2.0',
    description: 'Authentication utilities for Lucia',
  },
};

/**
 * Development tooling versions
 */
export const TOOLING_DEPS: DependencyMap = {
  // TypeScript
  typescript: {
    version: '^5.7.0',
    dev: true,
    description: 'TypeScript compiler',
  },
  'ts-node': {
    version: '^10.9.0',
    dev: true,
    description: 'TypeScript execution for Node.js',
  },
  tsx: {
    version: '^4.19.0',
    dev: true,
    description: 'TypeScript execute and watch',
  },
  '@tsconfig/node22': {
    version: '^22.0.0',
    dev: true,
    description: 'TypeScript config base for Node 22',
  },
  '@tsconfig/strictest': {
    version: '^2.0.0',
    dev: true,
    description: 'Strictest TypeScript config base',
  },

  // ESLint (flat config)
  eslint: {
    version: '^9.15.0',
    dev: true,
    description: 'Pluggable linting utility',
  },
  '@eslint/js': {
    version: '^9.15.0',
    dev: true,
    description: 'ESLint JavaScript plugin',
  },
  'typescript-eslint': {
    version: '^8.15.0',
    dev: true,
    description: 'TypeScript ESLint integration',
  },
  'eslint-plugin-react': {
    version: '^7.37.0',
    dev: true,
    description: 'React linting rules',
  },
  'eslint-plugin-react-hooks': {
    version: '^5.0.0',
    dev: true,
    description: 'React Hooks linting rules',
  },
  'eslint-plugin-jsx-a11y': {
    version: '^6.10.0',
    dev: true,
    description: 'Accessibility linting rules',
  },
  'eslint-config-next': {
    version: '^15.1.0',
    dev: true,
    description: 'ESLint config for Next.js',
  },
  globals: {
    version: '^15.12.0',
    dev: true,
    description: 'Global variables for ESLint',
  },

  // Prettier
  prettier: {
    version: '^3.4.0',
    dev: true,
    description: 'Code formatter',
  },
  'prettier-plugin-tailwindcss': {
    version: '^0.6.0',
    dev: true,
    description: 'Prettier plugin for Tailwind CSS class sorting',
  },
  'eslint-config-prettier': {
    version: '^9.1.0',
    dev: true,
    description: 'Disable ESLint rules that conflict with Prettier',
  },
  'eslint-plugin-prettier': {
    version: '^5.2.0',
    dev: true,
    description: 'Run Prettier as ESLint rule',
  },

  // Git hooks
  husky: {
    version: '^9.1.0',
    dev: true,
    description: 'Git hooks made easy',
  },
  'lint-staged': {
    version: '^15.2.0',
    dev: true,
    description: 'Run linters on staged files',
  },
  commitlint: {
    version: '^19.5.0',
    dev: true,
    description: 'Lint commit messages',
  },
  '@commitlint/cli': {
    version: '^19.5.0',
    dev: true,
    description: 'Commitlint CLI',
  },
  '@commitlint/config-conventional': {
    version: '^19.5.0',
    dev: true,
    description: 'Conventional commit config for commitlint',
  },

  // Validation
  zod: {
    version: '^3.23.0',
    description: 'TypeScript-first schema validation',
  },
};

/**
 * Testing library versions
 */
export const TESTING_DEPS: DependencyMap = {
  // Vitest
  vitest: {
    version: '^2.1.0',
    dev: true,
    description: 'Vite-native testing framework',
  },
  '@vitest/coverage-v8': {
    version: '^2.1.0',
    dev: true,
    description: 'V8 coverage provider for Vitest',
  },
  '@vitest/ui': {
    version: '^2.1.0',
    dev: true,
    description: 'UI for Vitest',
  },

  // Testing Library
  '@testing-library/react': {
    version: '^16.0.0',
    dev: true,
    description: 'React testing utilities',
  },
  '@testing-library/jest-dom': {
    version: '^6.6.0',
    dev: true,
    description: 'Jest DOM matchers',
  },
  '@testing-library/user-event': {
    version: '^14.5.0',
    dev: true,
    description: 'User event simulation',
  },

  // Playwright
  '@playwright/test': {
    version: '^1.49.0',
    dev: true,
    description: 'End-to-end testing framework',
  },

  // MSW (Mock Service Worker)
  msw: {
    version: '^2.6.0',
    dev: true,
    description: 'API mocking library',
  },

  // Happy DOM
  'happy-dom': {
    version: '^15.11.0',
    dev: true,
    description: 'Fast DOM implementation for testing',
  },
  jsdom: {
    version: '^25.0.0',
    dev: true,
    description: 'DOM implementation for Node.js',
  },
};

/**
 * Styling library versions
 */
export const STYLING_DEPS: DependencyMap = {
  // Tailwind CSS v4
  tailwindcss: {
    version: '^4.0.0',
    dev: true,
    description: 'Utility-first CSS framework',
  },
  '@tailwindcss/postcss': {
    version: '^4.0.0',
    dev: true,
    description: 'PostCSS plugin for Tailwind CSS v4',
  },
  '@tailwindcss/vite': {
    version: '^4.0.0',
    dev: true,
    description: 'Vite plugin for Tailwind CSS v4',
  },
  '@tailwindcss/cli': {
    version: '^4.0.0',
    dev: true,
    description: 'Tailwind CSS CLI',
  },

  // PostCSS
  postcss: {
    version: '^8.4.0',
    dev: true,
    description: 'CSS processor',
  },
  autoprefixer: {
    version: '^10.4.0',
    dev: true,
    description: 'PostCSS autoprefixer plugin',
  },

  // CSS-in-JS alternatives (if needed)
  'class-variance-authority': {
    version: '^0.7.0',
    description: 'Variant API for styling',
  },
  clsx: {
    version: '^2.1.0',
    description: 'Utility for constructing className strings',
  },
  'tailwind-merge': {
    version: '^2.5.0',
    description: 'Merge Tailwind CSS classes without conflicts',
  },
};

// =============================================================================
// COMBINED DEPENDENCIES
// =============================================================================

/**
 * All dependencies organized by category
 */
export const DEPENDENCIES: CategorizedDependencies = {
  frontend: FRONTEND_DEPS,
  backend: BACKEND_DEPS,
  database: DATABASE_DEPS,
  auth: AUTH_DEPS,
  tooling: TOOLING_DEPS,
  testing: TESTING_DEPS,
  styling: STYLING_DEPS,
};

/**
 * Flat map of all dependencies (for quick lookup)
 */
export const ALL_DEPS: DependencyMap = {
  ...FRONTEND_DEPS,
  ...BACKEND_DEPS,
  ...DATABASE_DEPS,
  ...AUTH_DEPS,
  ...TOOLING_DEPS,
  ...TESTING_DEPS,
  ...STYLING_DEPS,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Gets a dependency specification by name
 *
 * @param name - Package name
 * @returns Dependency spec or undefined if not found
 *
 * @example
 * ```typescript
 * const react = getDep('react');
 * console.log(react?.version); // '^19.0.0'
 * ```
 */
export function getDep(name: string): DependencySpec | undefined {
  return ALL_DEPS[name];
}

/**
 * Gets a dependency version by name
 *
 * @param name - Package name
 * @returns Version string or undefined if not found
 *
 * @example
 * ```typescript
 * const version = getDepVersion('react');
 * console.log(version); // '^19.0.0'
 * ```
 */
export function getDepVersion(name: string): string | undefined {
  return ALL_DEPS[name]?.version;
}

/**
 * Gets a dev dependency specification
 * Only returns if the dependency is marked as dev: true
 *
 * @param name - Package name
 * @returns Dependency spec or undefined
 *
 * @example
 * ```typescript
 * const eslint = getDevDep('eslint');
 * console.log(eslint?.version); // '^9.15.0'
 * ```
 */
export function getDevDep(name: string): DependencySpec | undefined {
  const dep = ALL_DEPS[name];
  return dep?.dev ? dep : undefined;
}

/**
 * Gets dependencies by category
 *
 * @param category - Dependency category
 * @returns Dependency map for the category
 *
 * @example
 * ```typescript
 * const frontendDeps = getDepsByCategory('frontend');
 * console.log(Object.keys(frontendDeps)); // ['next', 'react', ...]
 * ```
 */
export function getDepsByCategory(category: DependencyCategory): DependencyMap {
  return DEPENDENCIES[category];
}

/**
 * Gets multiple dependencies as a package.json dependencies object
 *
 * @param names - Array of package names
 * @returns Object with package names as keys and versions as values
 *
 * @example
 * ```typescript
 * const deps = getDepsObject(['react', 'react-dom', 'next']);
 * // { react: '^19.0.0', 'react-dom': '^19.0.0', next: '^15.1.0' }
 * ```
 */
export function getDepsObject(names: string[]): Record<string, string> {
  const result: Record<string, string> = {};

  for (const name of names) {
    const dep = ALL_DEPS[name];
    if (dep) {
      result[name] = dep.version;
    }
  }

  return result;
}

/**
 * Gets all dependencies (not dev) as a package.json dependencies object
 *
 * @param names - Array of package names
 * @returns Object with package names as keys and versions as values
 */
export function getProdDepsObject(names: string[]): Record<string, string> {
  const result: Record<string, string> = {};

  for (const name of names) {
    const dep = ALL_DEPS[name];
    if (dep && !dep.dev) {
      result[name] = dep.version;
    }
  }

  return result;
}

/**
 * Gets all dev dependencies as a package.json devDependencies object
 *
 * @param names - Array of package names
 * @returns Object with package names as keys and versions as values
 */
export function getDevDepsObject(names: string[]): Record<string, string> {
  const result: Record<string, string> = {};

  for (const name of names) {
    const dep = ALL_DEPS[name];
    if (dep?.dev) {
      result[name] = dep.version;
    }
  }

  return result;
}

/**
 * Separates an array of package names into prod and dev dependencies
 *
 * @param names - Array of package names
 * @returns Object with dependencies and devDependencies
 *
 * @example
 * ```typescript
 * const { dependencies, devDependencies } = separateDeps([
 *   'react', 'react-dom', 'typescript', 'eslint'
 * ]);
 * // dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' }
 * // devDependencies: { typescript: '^5.7.0', eslint: '^9.15.0' }
 * ```
 */
export function separateDeps(names: string[]): {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};

  for (const name of names) {
    const dep = ALL_DEPS[name];
    if (dep) {
      if (dep.dev) {
        devDependencies[name] = dep.version;
      } else {
        dependencies[name] = dep.version;
      }
    }
  }

  return { dependencies, devDependencies };
}

/**
 * Gets peer dependencies for a package
 *
 * @param name - Package name
 * @returns Array of peer dependency names
 *
 * @example
 * ```typescript
 * const peers = getPeerDeps('next');
 * console.log(peers); // ['react', 'react-dom']
 * ```
 */
export function getPeerDeps(name: string): string[] {
  return ALL_DEPS[name]?.peerDeps ?? [];
}

/**
 * Gets a package with all its peer dependencies
 *
 * @param name - Package name
 * @returns Object with package and its peer dependencies
 *
 * @example
 * ```typescript
 * const deps = getWithPeers('next');
 * // { next: '^15.1.0', react: '^19.0.0', 'react-dom': '^19.0.0' }
 * ```
 */
export function getWithPeers(name: string): Record<string, string> {
  const result: Record<string, string> = {};
  const dep = ALL_DEPS[name];

  if (!dep) {
    return result;
  }

  result[name] = dep.version;

  if (dep.peerDeps) {
    for (const peerName of dep.peerDeps) {
      const peerDep = ALL_DEPS[peerName];
      if (peerDep) {
        result[peerName] = peerDep.version;
      }
    }
  }

  return result;
}

// =============================================================================
// PRESET DEPENDENCY GROUPS
// =============================================================================

/**
 * Common Next.js full-stack project dependencies
 */
export const NEXTJS_STACK = {
  dependencies: getDepsObject([
    'next',
    'react',
    'react-dom',
    'zod',
  ]),
  devDependencies: getDepsObject([
    '@types/node',
    '@types/react',
    '@types/react-dom',
    'typescript',
    'eslint',
    'eslint-config-next',
    'prettier',
    'tailwindcss',
    '@tailwindcss/postcss',
  ]),
};

/**
 * Common Vite + React project dependencies
 */
export const VITE_REACT_STACK = {
  dependencies: getDepsObject([
    'react',
    'react-dom',
    'zod',
  ]),
  devDependencies: getDepsObject([
    '@types/react',
    '@types/react-dom',
    'vite',
    '@vitejs/plugin-react-swc',
    'typescript',
    'eslint',
    '@eslint/js',
    'typescript-eslint',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    'prettier',
    'tailwindcss',
    '@tailwindcss/vite',
  ]),
};

/**
 * Common Express API project dependencies
 */
export const EXPRESS_API_STACK = {
  dependencies: getDepsObject([
    'express',
    'cors',
    'helmet',
    'compression',
    'pino',
    'zod',
  ]),
  devDependencies: getDepsObject([
    '@types/node',
    '@types/express',
    '@types/cors',
    '@types/compression',
    'typescript',
    'tsx',
    'eslint',
    '@eslint/js',
    'typescript-eslint',
    'prettier',
    'pino-pretty',
  ]),
};

/**
 * Drizzle ORM with PostgreSQL dependencies
 */
export const DRIZZLE_POSTGRES_STACK = {
  dependencies: getDepsObject([
    'drizzle-orm',
    'postgres',
    'drizzle-zod',
    'zod',
  ]),
  devDependencies: getDepsObject([
    'drizzle-kit',
    '@types/pg',
  ]),
};

/**
 * Drizzle ORM with SQLite dependencies
 */
export const DRIZZLE_SQLITE_STACK = {
  dependencies: getDepsObject([
    'drizzle-orm',
    'better-sqlite3',
    'drizzle-zod',
    'zod',
  ]),
  devDependencies: getDepsObject([
    'drizzle-kit',
    '@types/better-sqlite3',
  ]),
};

/**
 * Auth.js (NextAuth v5) dependencies
 */
export const AUTHJS_STACK = {
  dependencies: getDepsObject([
    'next-auth',
    '@auth/core',
    '@auth/drizzle-adapter',
  ]),
  devDependencies: {},
};

/**
 * Lucia Auth dependencies
 */
export const LUCIA_STACK = {
  dependencies: getDepsObject([
    'lucia',
    '@lucia-auth/adapter-drizzle',
    'oslo',
    '@node-rs/argon2',
    'arctic',
  ]),
  devDependencies: {},
};

/**
 * Testing dependencies (Vitest + Testing Library)
 */
export const TESTING_STACK = {
  dependencies: {},
  devDependencies: getDepsObject([
    'vitest',
    '@vitest/coverage-v8',
    '@vitest/ui',
    '@testing-library/react',
    '@testing-library/jest-dom',
    '@testing-library/user-event',
    'happy-dom',
  ]),
};

/**
 * Git hooks and commit linting dependencies
 */
export const GIT_HOOKS_STACK = {
  dependencies: {},
  devDependencies: getDepsObject([
    'husky',
    'lint-staged',
    '@commitlint/cli',
    '@commitlint/config-conventional',
  ]),
};
