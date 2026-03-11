/**
 * Base Generator Module
 *
 * Provides shared interfaces, types, and utility functions used by all generators.
 * This module defines the core abstractions for project generation including:
 * - ProjectConfig interface for all configuration options
 * - BaseGenerator class with common generation logic
 * - Helper functions for file operations and template rendering
 */

import ejs from 'ejs';
import path from 'path';
import fs from 'fs-extra';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Frontend framework options
 */
export type FrontendType = 'nextjs' | 'vite';

/**
 * Backend framework options (only relevant for vite frontend)
 */
export type BackendType = 'express' | 'none';

/**
 * Database type options
 */
export type DatabaseType = 'postgresql' | 'sqlite';

/**
 * Authentication provider options
 */
export type AuthType = 'authjs' | 'lucia';

/**
 * Deployment target options
 */
export type DeploymentType = 'docker' | 'vercel' | 'none';

/**
 * Extra features that can be enabled
 */
export interface ExtrasConfig {
  /** Include ESLint configuration */
  eslint: boolean;
  /** Include Prettier configuration */
  prettier: boolean;
  /** Include Husky git hooks */
  husky: boolean;
  /** Include Docker configuration */
  docker: boolean;
  /** Include GitHub Actions CI/CD */
  githubActions: boolean;
  /** Include environment validation with zod */
  envValidation: boolean;
}

/**
 * Complete project configuration
 * Contains all options selected during CLI prompts
 */
export interface ProjectConfig {
  /** Project name (used for package.json name and directory) */
  name: string;
  /** Selected frontend framework */
  frontend: FrontendType;
  /** Selected backend framework (for vite frontend) */
  backend: BackendType;
  /** Selected database type */
  database: DatabaseType;
  /** Selected authentication provider */
  auth: AuthType;
  /** Selected deployment target */
  deployment: DeploymentType;
  /** Extra features to include */
  extras: ExtrasConfig;
}

/**
 * Template data passed to EJS templates
 * Extends ProjectConfig with computed properties
 */
export interface TemplateData extends ProjectConfig {
  /** Alias for name, used in some templates */
  projectName: string;
  /** Alias for auth, used in some templates */
  authType: AuthType;
  /** Whether the project includes a backend */
  hasBackend: boolean;
  /** Whether using monorepo structure (vite + express) */
  isMonorepo: boolean;
  /** Current year for license/copyright */
  year: number;
}

/**
 * Result of a generation operation
 */
export interface GenerationResult {
  success: boolean;
  message: string;
  filesCreated: string[];
  errors: string[];
}

// =============================================================================
// DEPENDENCY VERSIONS
// =============================================================================

/**
 * Centralized dependency versions
 * All generators should use these versions for consistency
 */
export const DEPENDENCY_VERSIONS = {
  // Core frameworks
  next: '^15.1.0',
  react: '^19.0.0',
  reactDom: '^19.0.0',
  reactRouter: '^6.28.0',
  express: '^5.0.0',
  vite: '^5.4.10',

  // Database
  drizzleOrm: '^0.38.0',
  drizzleKit: '^0.30.0',
  postgres: '^3.4.5',
  betterSqlite3: '^11.7.0',

  // Auth
  nextAuth: '^5.0.0-beta.25',
  authDrizzleAdapter: '^1.7.4',
  lucia: '^3.2.2',
  luciaAdapterDrizzle: '^1.1.0',
  arctic: '^2.2.2',
  oslo: '^1.2.1',
  bcryptjs: '^2.4.3',

  // Utilities
  zod: '^3.24.0',
  clsx: '^2.1.1',
  tailwindMerge: '^2.6.0',
  axios: '^1.7.7',
  dotenv: '^16.4.5',
  cors: '^2.8.5',
  helmet: '^8.0.0',
  compression: '^1.7.4',
  cookieParser: '^1.4.7',

  // Styling
  tailwindcss: '^4.0.0',
  tailwindcssPostcss: '^4.0.0',
  postcss: '^8.4.49',
  autoprefixer: '^10.4.20',

  // Development
  typescript: '^5.7.0',
  typesNode: '^22.10.0',
  typesReact: '^19.0.0',
  typesReactDom: '^19.0.0',
  typesBetterSqlite3: '^7.6.12',
  typesBcryptjs: '^2.4.6',
  typesExpress: '^5.0.0',
  typesCors: '^2.8.17',
  typesCompression: '^1.7.5',
  typesCookieParser: '^1.4.8',
  eslint: '^9.17.0',
  eslintConfigNext: '^15.1.0',
  eslintJs: '^9.13.0',
  eslintPluginReactHooks: '^5.0.0',
  eslintPluginReactRefresh: '^0.4.14',
  typescriptEslint: '^8.11.0',
  globals: '^15.11.0',
  prettier: '^3.4.0',
  husky: '^9.1.7',
  lintStaged: '^15.2.10',
  tsx: '^4.19.2',
  nodemon: '^3.1.7',
  vitejsPluginReact: '^4.3.3',
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Creates template data from project config
 * Adds computed properties needed by templates
 */
export function createTemplateData(config: ProjectConfig): TemplateData {
  return {
    ...config,
    projectName: config.name,
    authType: config.auth,
    hasBackend: config.frontend === 'vite' && config.backend === 'express',
    isMonorepo: config.frontend === 'vite' && config.backend === 'express',
    year: new Date().getFullYear(),
  };
}

/**
 * Renders an EJS template string with data
 * @param template - The EJS template string
 * @param data - Template data to inject
 * @returns Rendered string
 */
export function renderTemplate(template: string, data: TemplateData): string {
  return ejs.render(template, data, {
    // Use <%- for unescaped output (default)
    // Use <%= for escaped output
    rmWhitespace: false,
  });
}

/**
 * Reads a template file and renders it with data
 * @param templatePath - Absolute path to template file
 * @param data - Template data to inject
 * @returns Rendered string
 */
export async function renderTemplateFile(
  templatePath: string,
  data: TemplateData
): Promise<string> {
  const template = await fs.readFile(templatePath, 'utf-8');
  return renderTemplate(template, data);
}

/**
 * Copies and renders a template file to destination
 * @param templatePath - Source template path
 * @param destPath - Destination file path (without .ejs extension)
 * @param data - Template data
 */
export async function copyAndRenderTemplate(
  templatePath: string,
  destPath: string,
  data: TemplateData
): Promise<void> {
  const content = await renderTemplateFile(templatePath, data);
  await fs.ensureDir(path.dirname(destPath));
  await fs.writeFile(destPath, content, 'utf-8');
}

/**
 * Copies all templates from a directory, rendering EJS files
 * @param templateDir - Source template directory
 * @param destDir - Destination directory
 * @param data - Template data
 * @returns List of created files
 */
export async function copyTemplates(
  templateDir: string,
  destDir: string,
  data: TemplateData
): Promise<string[]> {
  const createdFiles: string[] = [];

  // Check if source directory exists
  if (!(await fs.pathExists(templateDir))) {
    return createdFiles;
  }

  const files = await fs.readdir(templateDir, { withFileTypes: true });

  for (const file of files) {
    const srcPath = path.join(templateDir, file.name);

    // Skip .gitkeep files
    if (file.name === '.gitkeep') {
      continue;
    }

    if (file.isDirectory()) {
      // Recursively process subdirectories
      const subDestDir = path.join(destDir, file.name);
      const subFiles = await copyTemplates(srcPath, subDestDir, data);
      createdFiles.push(...subFiles);
    } else if (file.name.endsWith('.ejs')) {
      // Render EJS templates
      const destFileName = file.name.replace(/\.ejs$/, '');
      const destPath = path.join(destDir, destFileName);
      await copyAndRenderTemplate(srcPath, destPath, data);
      createdFiles.push(destPath);
    } else {
      // Copy non-template files as-is
      const destPath = path.join(destDir, file.name);
      await fs.ensureDir(path.dirname(destPath));
      await fs.copy(srcPath, destPath);
      createdFiles.push(destPath);
    }
  }

  return createdFiles;
}

/**
 * Writes a file with content, ensuring parent directories exist
 */
export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Writes a JSON file with proper formatting
 */
export async function writeJsonFile(
  filePath: string,
  data: Record<string, unknown>
): Promise<void> {
  await writeFile(filePath, JSON.stringify(data, null, 2) + '\n');
}

// =============================================================================
// PACKAGE.JSON GENERATION
// =============================================================================

/**
 * Generates package.json content for Next.js projects
 */
export function generateNextJsPackageJson(config: ProjectConfig): Record<string, unknown> {
  const deps: Record<string, string> = {
    next: DEPENDENCY_VERSIONS.next,
    react: DEPENDENCY_VERSIONS.react,
    'react-dom': DEPENDENCY_VERSIONS.reactDom,
    'drizzle-orm': DEPENDENCY_VERSIONS.drizzleOrm,
    zod: DEPENDENCY_VERSIONS.zod,
    clsx: DEPENDENCY_VERSIONS.clsx,
    'tailwind-merge': DEPENDENCY_VERSIONS.tailwindMerge,
  };

  const devDeps: Record<string, string> = {
    '@types/node': DEPENDENCY_VERSIONS.typesNode,
    '@types/react': DEPENDENCY_VERSIONS.typesReact,
    '@types/react-dom': DEPENDENCY_VERSIONS.typesReactDom,
    typescript: DEPENDENCY_VERSIONS.typescript,
    'drizzle-kit': DEPENDENCY_VERSIONS.drizzleKit,
    tailwindcss: DEPENDENCY_VERSIONS.tailwindcss,
    '@tailwindcss/postcss': DEPENDENCY_VERSIONS.tailwindcssPostcss,
    postcss: DEPENDENCY_VERSIONS.postcss,
    eslint: DEPENDENCY_VERSIONS.eslint,
    'eslint-config-next': DEPENDENCY_VERSIONS.eslintConfigNext,
    '@eslint/eslintrc': '^3.2.0',
  };

  // Database dependencies
  if (config.database === 'postgresql') {
    deps.postgres = DEPENDENCY_VERSIONS.postgres;
  } else {
    deps['better-sqlite3'] = DEPENDENCY_VERSIONS.betterSqlite3;
    devDeps['@types/better-sqlite3'] = DEPENDENCY_VERSIONS.typesBetterSqlite3;
  }

  // Auth dependencies
  if (config.auth === 'authjs') {
    deps['next-auth'] = DEPENDENCY_VERSIONS.nextAuth;
    deps['@auth/drizzle-adapter'] = DEPENDENCY_VERSIONS.authDrizzleAdapter;
    deps.bcryptjs = DEPENDENCY_VERSIONS.bcryptjs;
    devDeps['@types/bcryptjs'] = DEPENDENCY_VERSIONS.typesBcryptjs;
  } else {
    deps.lucia = DEPENDENCY_VERSIONS.lucia;
    deps['@lucia-auth/adapter-drizzle'] = DEPENDENCY_VERSIONS.luciaAdapterDrizzle;
    deps.arctic = DEPENDENCY_VERSIONS.arctic;
    deps.oslo = DEPENDENCY_VERSIONS.oslo;
    deps.bcryptjs = DEPENDENCY_VERSIONS.bcryptjs;
    devDeps['@types/bcryptjs'] = DEPENDENCY_VERSIONS.typesBcryptjs;
  }

  // Extra dependencies
  if (config.extras.prettier) {
    devDeps.prettier = DEPENDENCY_VERSIONS.prettier;
  }
  if (config.extras.husky) {
    devDeps.husky = DEPENDENCY_VERSIONS.husky;
    devDeps['lint-staged'] = DEPENDENCY_VERSIONS.lintStaged;
  }

  const scripts: Record<string, string> = {
    dev: 'next dev --turbopack',
    build: 'next build',
    start: 'next start',
    lint: 'next lint',
    'db:generate': 'drizzle-kit generate',
    'db:migrate': 'drizzle-kit migrate',
    'db:push': 'drizzle-kit push',
    'db:studio': 'drizzle-kit studio',
  };

  if (config.extras.prettier) {
    scripts.format = 'prettier --write "**/*.{ts,tsx,js,jsx,json,md}"';
    scripts['format:check'] = 'prettier --check "**/*.{ts,tsx,js,jsx,json,md}"';
  }

  const packageJson: Record<string, unknown> = {
    name: config.name,
    version: '0.1.0',
    private: true,
    scripts,
    dependencies: sortObject(deps),
    devDependencies: sortObject(devDeps),
  };

  if (config.extras.husky) {
    packageJson['lint-staged'] = {
      '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
      '*.{json,md}': ['prettier --write'],
    };
  }

  return packageJson;
}

/**
 * Generates package.json content for Vite + React projects
 */
export function generateVitePackageJson(config: ProjectConfig): Record<string, unknown> {
  const deps: Record<string, string> = {
    react: '^18.3.1',
    'react-dom': '^18.3.1',
    'react-router-dom': DEPENDENCY_VERSIONS.reactRouter,
    axios: DEPENDENCY_VERSIONS.axios,
  };

  const devDeps: Record<string, string> = {
    '@eslint/js': DEPENDENCY_VERSIONS.eslintJs,
    '@types/react': '^18.3.12',
    '@types/react-dom': '^18.3.1',
    '@vitejs/plugin-react': DEPENDENCY_VERSIONS.vitejsPluginReact,
    autoprefixer: DEPENDENCY_VERSIONS.autoprefixer,
    eslint: '^9.13.0',
    'eslint-plugin-react-hooks': DEPENDENCY_VERSIONS.eslintPluginReactHooks,
    'eslint-plugin-react-refresh': DEPENDENCY_VERSIONS.eslintPluginReactRefresh,
    globals: DEPENDENCY_VERSIONS.globals,
    postcss: '^8.4.47',
    tailwindcss: '^3.4.14',
    typescript: '~5.6.2',
    'typescript-eslint': DEPENDENCY_VERSIONS.typescriptEslint,
    vite: DEPENDENCY_VERSIONS.vite,
  };

  if (config.extras.prettier) {
    devDeps.prettier = DEPENDENCY_VERSIONS.prettier;
  }
  if (config.extras.husky) {
    devDeps.husky = DEPENDENCY_VERSIONS.husky;
    devDeps['lint-staged'] = DEPENDENCY_VERSIONS.lintStaged;
  }

  const scripts: Record<string, string> = {
    dev: 'vite',
    build: 'tsc -b && vite build',
    lint: 'eslint .',
    preview: 'vite preview',
  };

  if (config.extras.prettier) {
    scripts.format = 'prettier --write "src/**/*.{ts,tsx,css}"';
  }

  const packageJson: Record<string, unknown> = {
    name: `${config.name}-client`,
    private: true,
    version: '0.0.1',
    type: 'module',
    scripts,
    dependencies: sortObject(deps),
    devDependencies: sortObject(devDeps),
  };

  return packageJson;
}

/**
 * Generates package.json content for Express backend projects
 */
export function generateExpressPackageJson(config: ProjectConfig): Record<string, unknown> {
  const deps: Record<string, string> = {
    express: DEPENDENCY_VERSIONS.express,
    'drizzle-orm': DEPENDENCY_VERSIONS.drizzleOrm,
    zod: DEPENDENCY_VERSIONS.zod,
    dotenv: DEPENDENCY_VERSIONS.dotenv,
    cors: DEPENDENCY_VERSIONS.cors,
    helmet: DEPENDENCY_VERSIONS.helmet,
    compression: DEPENDENCY_VERSIONS.compression,
    'cookie-parser': DEPENDENCY_VERSIONS.cookieParser,
  };

  const devDeps: Record<string, string> = {
    '@types/node': DEPENDENCY_VERSIONS.typesNode,
    '@types/express': DEPENDENCY_VERSIONS.typesExpress,
    '@types/cors': DEPENDENCY_VERSIONS.typesCors,
    '@types/compression': DEPENDENCY_VERSIONS.typesCompression,
    '@types/cookie-parser': DEPENDENCY_VERSIONS.typesCookieParser,
    typescript: DEPENDENCY_VERSIONS.typescript,
    'drizzle-kit': DEPENDENCY_VERSIONS.drizzleKit,
    tsx: DEPENDENCY_VERSIONS.tsx,
    nodemon: DEPENDENCY_VERSIONS.nodemon,
  };

  // Database dependencies
  if (config.database === 'postgresql') {
    deps.postgres = DEPENDENCY_VERSIONS.postgres;
  } else {
    deps['better-sqlite3'] = DEPENDENCY_VERSIONS.betterSqlite3;
    devDeps['@types/better-sqlite3'] = DEPENDENCY_VERSIONS.typesBetterSqlite3;
  }

  // Auth dependencies
  if (config.auth === 'lucia') {
    deps.lucia = DEPENDENCY_VERSIONS.lucia;
    deps['@lucia-auth/adapter-drizzle'] = DEPENDENCY_VERSIONS.luciaAdapterDrizzle;
    deps.oslo = DEPENDENCY_VERSIONS.oslo;
    deps.bcryptjs = DEPENDENCY_VERSIONS.bcryptjs;
    devDeps['@types/bcryptjs'] = DEPENDENCY_VERSIONS.typesBcryptjs;
  }

  if (config.extras.prettier) {
    devDeps.prettier = DEPENDENCY_VERSIONS.prettier;
  }
  if (config.extras.eslint) {
    devDeps.eslint = DEPENDENCY_VERSIONS.eslint;
    devDeps['@typescript-eslint/eslint-plugin'] = '^8.11.0';
    devDeps['@typescript-eslint/parser'] = '^8.11.0';
  }
  if (config.extras.husky) {
    devDeps.husky = DEPENDENCY_VERSIONS.husky;
    devDeps['lint-staged'] = DEPENDENCY_VERSIONS.lintStaged;
  }

  const scripts: Record<string, string> = {
    dev: 'nodemon --exec tsx src/index.ts',
    build: 'tsc',
    start: 'node dist/index.js',
    'db:generate': 'drizzle-kit generate',
    'db:migrate': 'drizzle-kit migrate',
    'db:push': 'drizzle-kit push',
    'db:studio': 'drizzle-kit studio',
  };

  if (config.extras.eslint) {
    scripts.lint = 'eslint src --ext .ts';
  }
  if (config.extras.prettier) {
    scripts.format = 'prettier --write "src/**/*.ts"';
  }

  const packageJson: Record<string, unknown> = {
    name: `${config.name}-server`,
    private: true,
    version: '0.0.1',
    type: 'module',
    scripts,
    dependencies: sortObject(deps),
    devDependencies: sortObject(devDeps),
  };

  return packageJson;
}

// =============================================================================
// TSCONFIG GENERATION
// =============================================================================

/**
 * Generates tsconfig.json for Next.js projects
 */
export function generateNextJsTsConfig(): Record<string, unknown> {
  return {
    compilerOptions: {
      target: 'ES2017',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: {
        '@/*': ['./*'],
      },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  };
}

/**
 * Generates tsconfig.json for Vite projects
 */
export function generateViteTsConfig(): Record<string, unknown> {
  return {
    compilerOptions: {
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      isolatedModules: true,
      moduleDetection: 'force',
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
      noUncheckedSideEffectImports: true,
      baseUrl: '.',
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['src'],
    references: [{ path: './tsconfig.node.json' }],
  };
}

/**
 * Generates tsconfig.json for Express projects
 */
export function generateExpressTsConfig(): Record<string, unknown> {
  return {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      lib: ['ES2022'],
      outDir: 'dist',
      rootDir: 'src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      noUncheckedIndexedAccess: true,
      noImplicitOverride: true,
      isolatedModules: true,
    },
    include: ['src/**/*.ts'],
    exclude: ['node_modules', 'dist'],
  };
}

// =============================================================================
// SHARED FILE GENERATION
// =============================================================================

/**
 * Generates .gitignore content
 */
export function generateGitignore(config: ProjectConfig): string {
  const lines = [
    '# Dependencies',
    'node_modules/',
    '.pnpm-store/',
    '',
    '# Build outputs',
    'dist/',
    '.next/',
    'out/',
    '',
    '# Environment files',
    '.env',
    '.env.local',
    '.env.*.local',
    '',
    '# IDE',
    '.vscode/',
    '.idea/',
    '*.swp',
    '*.swo',
    '',
    '# OS',
    '.DS_Store',
    'Thumbs.db',
    '',
    '# Logs',
    '*.log',
    'npm-debug.log*',
    '',
    '# Testing',
    'coverage/',
    '.nyc_output/',
    '',
    '# TypeScript',
    '*.tsbuildinfo',
    '',
    '# Drizzle',
    'drizzle/',
  ];

  if (config.database === 'sqlite') {
    lines.push('', '# SQLite', 'data/', '*.db', '*.db-journal');
  }

  if (config.extras.husky) {
    lines.push('', '# Husky', '.husky/_/');
  }

  return lines.join('\n') + '\n';
}

/**
 * Generates .prettierrc content
 */
export function generatePrettierConfig(): Record<string, unknown> {
  return {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'es5',
    printWidth: 100,
    bracketSpacing: true,
    arrowParens: 'always',
    endOfLine: 'lf',
  };
}

/**
 * Generates .prettierignore content
 */
export function generatePrettierIgnore(): string {
  return [
    'node_modules/',
    'dist/',
    '.next/',
    'coverage/',
    'drizzle/',
    'pnpm-lock.yaml',
    'package-lock.json',
    '',
  ].join('\n');
}

/**
 * Generates basic ESLint config for Express projects
 */
export function generateExpressEslintConfig(): Record<string, unknown> {
  return {
    root: true,
    env: {
      node: true,
      es2022: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
    ignorePatterns: ['dist/', 'node_modules/'],
  };
}

/**
 * Generates Dockerfile content
 */
export function generateDockerfile(config: ProjectConfig): string {
  if (config.frontend === 'nextjs') {
    return generateNextJsDockerfile(config);
  }
  return generateExpressDockerfile(config);
}

function generateNextJsDockerfile(config: ProjectConfig): string {
  return `# syntax=docker/dockerfile:1

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

${config.database === 'sqlite' ? '# Create data directory for SQLite\nRUN mkdir -p data\n' : ''}
# Build the application
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
${config.database === 'sqlite' ? 'COPY --from=builder --chown=nextjs:nodejs /app/data ./data\n' : ''}
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
`;
}

function generateExpressDockerfile(config: ProjectConfig): string {
  return `# syntax=docker/dockerfile:1

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/dist ./dist
COPY --from=builder /app/package.json ./
${config.database === 'sqlite' ? '\n# Create data directory for SQLite\nRUN mkdir -p data && chown expressjs:nodejs data\n' : ''}
USER expressjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "dist/index.js"]
`;
}

/**
 * Generates docker-compose.yml content
 */
export function generateDockerCompose(config: ProjectConfig): string {
  if (config.database === 'postgresql') {
    return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/${config.name}
      - NODE_ENV=production
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ${config.name}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
`;
  }

  return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_PATH=/app/data/${config.name}.db
      - NODE_ENV=production
    volumes:
      - sqlite_data:/app/data

volumes:
  sqlite_data:
`;
}

/**
 * Generates .dockerignore content
 */
export function generateDockerIgnore(): string {
  return [
    'node_modules',
    '.next',
    'dist',
    '.git',
    '.gitignore',
    '.env',
    '.env.local',
    '.env.*.local',
    'README.md',
    'Dockerfile',
    '.dockerignore',
    'docker-compose.yml',
    '*.log',
    '.DS_Store',
    'coverage',
    '.nyc_output',
    '',
  ].join('\n');
}

/**
 * Generates GitHub Actions CI workflow
 */
export function generateGitHubActionsCI(config: ProjectConfig): string {
  const testJob = config.database === 'postgresql' ? `
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        run: npm run db:push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test` : `
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test`;

  return `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint
${testJob}

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
`;
}

/**
 * Generates environment validation schema
 */
export function generateEnvValidation(config: ProjectConfig): string {
  const dbEnvField = config.database === 'postgresql'
    ? `  DATABASE_URL: z
    .string()
    .url()
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'DATABASE_URL must be a valid PostgreSQL connection string'
    ),`
    : `  DATABASE_PATH: z
    .string()
    .min(1, 'DATABASE_PATH is required')
    .default('./data/${config.name}.db'),`;

  const authEnvFields = config.auth === 'authjs'
    ? `  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  AUTH_URL: z.string().url().optional(),
  // OAuth providers (optional)
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),`
    : `  // Lucia doesn't require specific env vars, but you might want:
  SESSION_SECRET: z.string().min(32).optional(),`;

  return `/**
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
${dbEnvField}
${authEnvFields}
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
`;
}

/**
 * Generates .env.example file
 */
export function generateEnvExample(config: ProjectConfig): string {
  const lines = ['# Environment Variables', '# Copy this file to .env and fill in the values', ''];

  lines.push('# Node environment');
  lines.push('NODE_ENV=development');
  lines.push('');

  // Database
  lines.push('# Database');
  if (config.database === 'postgresql') {
    lines.push('DATABASE_URL=postgresql://user:password@localhost:5432/dbname');
  } else {
    lines.push(`DATABASE_PATH=./data/${config.name}.db`);
  }
  lines.push('');

  // Auth
  lines.push('# Authentication');
  if (config.auth === 'authjs') {
    lines.push('# Generate with: openssl rand -base64 32');
    lines.push('AUTH_SECRET=your-secret-key-min-32-chars-here');
    lines.push('AUTH_URL=http://localhost:3000');
    lines.push('');
    lines.push('# OAuth Providers (optional)');
    lines.push('AUTH_GITHUB_ID=');
    lines.push('AUTH_GITHUB_SECRET=');
    lines.push('AUTH_GOOGLE_ID=');
    lines.push('AUTH_GOOGLE_SECRET=');
  } else {
    lines.push('# Optional session secret for Lucia');
    lines.push('SESSION_SECRET=your-secret-key-here');
  }
  lines.push('');

  return lines.join('\n');
}

// =============================================================================
// DRIZZLE FILES GENERATION
// =============================================================================

/**
 * Generates Drizzle configuration file content
 */
export function generateDrizzleConfig(config: ProjectConfig): string {
  const data = createTemplateData(config);

  if (config.database === 'postgresql') {
    return `/**
 * Drizzle Kit Configuration
 *
 * This file configures Drizzle Kit for database migrations and schema management.
 * Generated for: ${data.projectName}
 * Database: ${config.database}
 */

import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// PostgreSQL Configuration
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Enable verbose logging during development
  verbose: true,
  // Enable strict mode for better type safety
  strict: true,
} satisfies Config;
`;
  }

  return `/**
 * Drizzle Kit Configuration
 *
 * This file configures Drizzle Kit for database migrations and schema management.
 * Generated for: ${data.projectName}
 * Database: ${config.database}
 */

import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// SQLite Configuration
const dbPath = process.env.DATABASE_PATH || './data/${data.projectName}.db';

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbPath,
  },
  // Enable verbose logging during development
  verbose: true,
  // Enable strict mode for better type safety
  strict: true,
} satisfies Config;
`;
}

/**
 * Generates database client file
 */
export function generateDatabaseClient(config: ProjectConfig): string {
  if (config.database === 'postgresql') {
    return `/**
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
`;
  }

  return `/**
 * Database Client
 *
 * Drizzle ORM client configured for SQLite.
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dbPath = process.env.DATABASE_PATH || './data/app.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create SQLite database connection
const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent access
sqlite.pragma('journal_mode = WAL');

// Create drizzle instance with schema
export const db = drizzle(sqlite, { schema });

// Export types
export type Database = typeof db;
`;
}

/**
 * Generates users schema file
 */
export function generateUsersSchema(config: ProjectConfig): string {
  if (config.database === 'postgresql') {
    return `/**
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
${config.auth === 'authjs' ? "import { accounts } from './accounts';" : ''}

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
${config.auth === 'authjs' ? '  accounts: many(accounts),' : ''}
}));

// Type exports for use throughout the application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
`;
  }

  return `/**
 * Users Table Schema
 *
 * Defines the users table structure for authentication and user management.
 * Database: SQLite
 */

import {
  sqliteTable,
  text,
  integer,
  index,
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { sessions } from './sessions';
${config.auth === 'authjs' ? "import { accounts } from './accounts';" : ''}

/**
 * Users table - stores user account information
 *
 * Fields:
 * - id: Text primary key (UUID stored as text)
 * - email: Unique email address for authentication
 * - emailVerified: Unix timestamp when email was verified
 * - passwordHash: Hashed password (nullable for OAuth-only users)
 * - name: User's display name
 * - image: Profile image URL
 * - createdAt: Account creation timestamp (Unix epoch)
 * - updatedAt: Last update timestamp (Unix epoch)
 */
export const users = sqliteTable(
  'users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull().unique(),
    emailVerified: integer('email_verified', { mode: 'timestamp' }),
    passwordHash: text('password_hash'),
    name: text('name'),
    image: text('image'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql\`(unixepoch())\`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql\`(unixepoch())\`),
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
${config.auth === 'authjs' ? '  accounts: many(accounts),' : ''}
}));

// Type exports for use throughout the application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
`;
}

/**
 * Generates sessions schema file
 */
export function generateSessionsSchema(config: ProjectConfig): string {
  if (config.database === 'postgresql') {
    return `/**
 * Sessions Table Schema
 *
 * Defines the sessions table for user session management.
 * Database: PostgreSQL
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * Sessions table - stores active user sessions
 */
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
  })
);

/**
 * Sessions relations
 */
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// Type exports
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
`;
  }

  return `/**
 * Sessions Table Schema
 *
 * Defines the sessions table for user session management.
 * Database: SQLite
 */

import {
  sqliteTable,
  text,
  integer,
  index,
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';

/**
 * Sessions table - stores active user sessions
 */
export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql\`(unixepoch())\`),
  },
  (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
  })
);

/**
 * Sessions relations
 */
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// Type exports
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
`;
}

/**
 * Generates accounts schema file (for Auth.js OAuth)
 */
export function generateAccountsSchema(config: ProjectConfig): string {
  if (config.database === 'postgresql') {
    return `/**
 * Accounts Table Schema
 *
 * Defines the accounts table for OAuth provider connections.
 * Used by Auth.js for linking OAuth accounts to users.
 * Database: PostgreSQL
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * Accounts table - stores OAuth provider account links
 */
export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
    userIdIdx: index('accounts_user_id_idx').on(table.userId),
  })
);

/**
 * Accounts relations
 */
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

// Type exports
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
`;
  }

  return `/**
 * Accounts Table Schema
 *
 * Defines the accounts table for OAuth provider connections.
 * Used by Auth.js for linking OAuth accounts to users.
 * Database: SQLite
 */

import {
  sqliteTable,
  text,
  integer,
  index,
  primaryKey,
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';

/**
 * Accounts table - stores OAuth provider account links
 */
export const accounts = sqliteTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql\`(unixepoch())\`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
    userIdIdx: index('accounts_user_id_idx').on(table.userId),
  })
);

/**
 * Accounts relations
 */
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

// Type exports
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
`;
}

/**
 * Generates verification tokens schema (for Auth.js)
 */
export function generateVerificationTokensSchema(config: ProjectConfig): string {
  if (config.database === 'postgresql') {
    return `/**
 * Verification Tokens Table Schema
 *
 * Stores email verification and password reset tokens.
 * Used by Auth.js for email verification.
 * Database: PostgreSQL
 */

import {
  pgTable,
  text,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core';

/**
 * Verification tokens table
 */
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token] }),
  })
);

// Type exports
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
`;
  }

  return `/**
 * Verification Tokens Table Schema
 *
 * Stores email verification and password reset tokens.
 * Used by Auth.js for email verification.
 * Database: SQLite
 */

import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from 'drizzle-orm/sqlite-core';

/**
 * Verification tokens table
 */
export const verificationTokens = sqliteTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: integer('expires', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token] }),
  })
);

// Type exports
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
`;
}

/**
 * Generates schema index file
 */
export function generateSchemaIndex(config: ProjectConfig): string {
  return `/**
 * Database Schema Index
 *
 * Central export point for all database schemas.
 */

// Export all table schemas
export * from './users';
export * from './sessions';
${config.auth === 'authjs' ? "export * from './accounts';\nexport * from './verificationTokens';" : ''}

// Re-export relations if needed
export { usersRelations } from './users';
export { sessionsRelations } from './sessions';
${config.auth === 'authjs' ? "export { accountsRelations } from './accounts';" : ''}
`;
}

/**
 * Generates all Drizzle-related files
 */
export async function generateDrizzleFiles(
  config: ProjectConfig,
  destPath: string
): Promise<string[]> {
  const createdFiles: string[] = [];

  // Create drizzle.config.ts
  const drizzleConfigPath = path.join(destPath, 'drizzle.config.ts');
  await writeFile(drizzleConfigPath, generateDrizzleConfig(config));
  createdFiles.push(drizzleConfigPath);

  // Create src/db/index.ts (database client)
  const dbClientPath = path.join(destPath, 'src', 'db', 'index.ts');
  await writeFile(dbClientPath, generateDatabaseClient(config));
  createdFiles.push(dbClientPath);

  // Create schema files
  const schemaDir = path.join(destPath, 'src', 'db', 'schema');

  // users.ts
  const usersPath = path.join(schemaDir, 'users.ts');
  await writeFile(usersPath, generateUsersSchema(config));
  createdFiles.push(usersPath);

  // sessions.ts
  const sessionsPath = path.join(schemaDir, 'sessions.ts');
  await writeFile(sessionsPath, generateSessionsSchema(config));
  createdFiles.push(sessionsPath);

  // Auth.js specific schemas
  if (config.auth === 'authjs') {
    const accountsPath = path.join(schemaDir, 'accounts.ts');
    await writeFile(accountsPath, generateAccountsSchema(config));
    createdFiles.push(accountsPath);

    const verificationTokensPath = path.join(schemaDir, 'verificationTokens.ts');
    await writeFile(verificationTokensPath, generateVerificationTokensSchema(config));
    createdFiles.push(verificationTokensPath);
  }

  // schema/index.ts
  const schemaIndexPath = path.join(schemaDir, 'index.ts');
  await writeFile(schemaIndexPath, generateSchemaIndex(config));
  createdFiles.push(schemaIndexPath);

  // Create drizzle migrations directory
  const migrationsDir = path.join(destPath, 'drizzle', 'migrations');
  await fs.ensureDir(migrationsDir);
  await writeFile(path.join(migrationsDir, '.gitkeep'), '');
  createdFiles.push(path.join(migrationsDir, '.gitkeep'));

  return createdFiles;
}

/**
 * Generates shared files (gitignore, prettier, docker, ci, env validation)
 */
export async function generateSharedFiles(
  config: ProjectConfig,
  destPath: string
): Promise<string[]> {
  const createdFiles: string[] = [];

  // .gitignore
  const gitignorePath = path.join(destPath, '.gitignore');
  await writeFile(gitignorePath, generateGitignore(config));
  createdFiles.push(gitignorePath);

  // .env.example
  const envExamplePath = path.join(destPath, '.env.example');
  await writeFile(envExamplePath, generateEnvExample(config));
  createdFiles.push(envExamplePath);

  // Prettier config
  if (config.extras.prettier) {
    const prettierrcPath = path.join(destPath, '.prettierrc');
    await writeJsonFile(prettierrcPath, generatePrettierConfig());
    createdFiles.push(prettierrcPath);

    const prettierignorePath = path.join(destPath, '.prettierignore');
    await writeFile(prettierignorePath, generatePrettierIgnore());
    createdFiles.push(prettierignorePath);
  }

  // Docker files
  if (config.extras.docker) {
    const dockerfilePath = path.join(destPath, 'Dockerfile');
    await writeFile(dockerfilePath, generateDockerfile(config));
    createdFiles.push(dockerfilePath);

    const dockerComposePath = path.join(destPath, 'docker-compose.yml');
    await writeFile(dockerComposePath, generateDockerCompose(config));
    createdFiles.push(dockerComposePath);

    const dockerignorePath = path.join(destPath, '.dockerignore');
    await writeFile(dockerignorePath, generateDockerIgnore());
    createdFiles.push(dockerignorePath);
  }

  // GitHub Actions CI
  if (config.extras.githubActions) {
    const workflowDir = path.join(destPath, '.github', 'workflows');
    await fs.ensureDir(workflowDir);
    const ciPath = path.join(workflowDir, 'ci.yml');
    await writeFile(ciPath, generateGitHubActionsCI(config));
    createdFiles.push(ciPath);
  }

  // Environment validation
  if (config.extras.envValidation) {
    const envValidationPath = path.join(destPath, 'src', 'lib', 'env.ts');
    await writeFile(envValidationPath, generateEnvValidation(config));
    createdFiles.push(envValidationPath);
  }

  // Husky setup (creates .husky directory structure)
  if (config.extras.husky) {
    const huskyDir = path.join(destPath, '.husky');
    await fs.ensureDir(huskyDir);

    const preCommitPath = path.join(huskyDir, 'pre-commit');
    await writeFile(
      preCommitPath,
      `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
`
    );
    createdFiles.push(preCommitPath);
  }

  return createdFiles;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Sorts object keys alphabetically
 */
function sortObject<T>(obj: Record<string, T>): Record<string, T> {
  const sorted: Record<string, T> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key] as T;
  }
  return sorted;
}

/**
 * Gets the template directory path
 */
export function getTemplateDir(templateName: string): string {
  // In production, templates are in dist/templates
  // In development, they're in src/templates
  const possiblePaths = [
    path.join(__dirname, '..', 'templates', templateName),
    path.join(__dirname, '..', '..', 'src', 'templates', templateName),
    path.join(process.cwd(), 'src', 'templates', templateName),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Default to src/templates for development
  return path.join(process.cwd(), 'src', 'templates', templateName);
}

// =============================================================================
// BASE GENERATOR CLASS
// =============================================================================

/**
 * Abstract base class for all generators
 * Provides common functionality and enforces interface
 */
export abstract class BaseGenerator {
  protected config: ProjectConfig;
  protected destPath: string;
  protected templateData: TemplateData;
  protected createdFiles: string[] = [];
  protected errors: string[] = [];

  constructor(config: ProjectConfig, destPath: string) {
    this.config = config;
    this.destPath = destPath;
    this.templateData = createTemplateData(config);
  }

  /**
   * Main generation method - must be implemented by subclasses
   */
  abstract generate(): Promise<GenerationResult>;

  /**
   * Generates package.json for the project
   */
  protected abstract generatePackageJson(): Promise<void>;

  /**
   * Generates tsconfig.json for the project
   */
  protected abstract generateTsConfig(): Promise<void>;

  /**
   * Copies and renders template files
   */
  protected async copyTemplateFiles(templateDir: string): Promise<void> {
    const files = await copyTemplates(templateDir, this.destPath, this.templateData);
    this.createdFiles.push(...files);
  }

  /**
   * Creates Drizzle ORM files if database is configured
   */
  protected async setupDrizzle(): Promise<void> {
    const files = await generateDrizzleFiles(this.config, this.destPath);
    this.createdFiles.push(...files);
  }

  /**
   * Creates shared configuration files
   */
  protected async setupSharedFiles(): Promise<void> {
    const files = await generateSharedFiles(this.config, this.destPath);
    this.createdFiles.push(...files);
  }

  /**
   * Writes a file and tracks it
   */
  protected async writeProjectFile(relativePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.destPath, relativePath);
    await writeFile(fullPath, content);
    this.createdFiles.push(fullPath);
  }

  /**
   * Writes a JSON file and tracks it
   */
  protected async writeProjectJsonFile(
    relativePath: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const fullPath = path.join(this.destPath, relativePath);
    await writeJsonFile(fullPath, data);
    this.createdFiles.push(fullPath);
  }

  /**
   * Creates the result object
   */
  protected createResult(success: boolean, message: string): GenerationResult {
    return {
      success,
      message,
      filesCreated: this.createdFiles,
      errors: this.errors,
    };
  }
}
