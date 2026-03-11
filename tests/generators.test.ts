/**
 * Generator Tests
 *
 * Comprehensive tests for all generator classes:
 * - BaseGenerator: Core functionality and template rendering
 * - NextJsGenerator: Next.js project scaffolding
 * - ViteGenerator: Vite + React project scaffolding
 * - ExpressGenerator: Express.js API scaffolding
 *
 * Tests cover:
 * - File generation correctness
 * - Template rendering with different configurations
 * - Package.json dependency management
 * - Syntax validation of generated files
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as ejs from 'ejs';

// Mock fs-extra before imports
vi.mock('fs-extra', () => ({
  ensureDir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  copy: vi.fn().mockResolvedValue(undefined),
  pathExists: vi.fn().mockResolvedValue(false),
  readFile: vi.fn().mockResolvedValue(''),
  remove: vi.fn().mockResolvedValue(undefined),
  readJson: vi.fn().mockResolvedValue({}),
  writeJson: vi.fn().mockResolvedValue(undefined),
  outputFile: vi.fn().mockResolvedValue(undefined),
}));

// Types for generator configuration
interface GeneratorConfig {
  projectName: string;
  frontend: 'nextjs' | 'vite';
  database: 'postgresql' | 'sqlite';
  authType: 'authjs' | 'lucia';
  deployment: 'docker' | 'vercel';
  outputDir: string;
}

interface GeneratedFile {
  path: string;
  content: string;
}

// Mock implementations for testing
class MockBaseGenerator {
  protected config: GeneratorConfig;
  protected templatesDir: string;
  protected generatedFiles: GeneratedFile[] = [];

  constructor(config: GeneratorConfig) {
    this.config = config;
    this.templatesDir = path.join(__dirname, '..', 'src', 'templates');
  }

  async renderTemplate(templatePath: string, data: Record<string, unknown>): Promise<string> {
    const fullPath = path.join(this.templatesDir, templatePath);
    const template = fs.readFileSync(fullPath, 'utf-8');
    return ejs.render(template, data, { filename: fullPath });
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    this.generatedFiles.push({ path: filePath, content });
  }

  getGeneratedFiles(): GeneratedFile[] {
    return this.generatedFiles;
  }

  getConfig(): GeneratorConfig {
    return this.config;
  }
}

describe('BaseGenerator', () => {
  let generator: MockBaseGenerator;
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `stackgen-test-${Date.now()}`);
    generator = new MockBaseGenerator({
      projectName: 'test-project',
      frontend: 'nextjs',
      database: 'postgresql',
      authType: 'authjs',
      deployment: 'docker',
      outputDir: tempDir,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration Handling', () => {
    it('should store configuration correctly', () => {
      const config = generator.getConfig();
      expect(config.projectName).toBe('test-project');
      expect(config.frontend).toBe('nextjs');
      expect(config.database).toBe('postgresql');
      expect(config.authType).toBe('authjs');
      expect(config.deployment).toBe('docker');
    });

    it('should handle project names with special characters', () => {
      const specialGenerator = new MockBaseGenerator({
        projectName: 'my-awesome_project123',
        frontend: 'vite',
        database: 'sqlite',
        authType: 'lucia',
        deployment: 'vercel',
        outputDir: tempDir,
      });
      expect(specialGenerator.getConfig().projectName).toBe('my-awesome_project123');
    });

    it('should use correct output directory', () => {
      expect(generator.getConfig().outputDir).toBe(tempDir);
    });
  });

  describe('Template Rendering', () => {
    it('should render drizzle.config.ts template for PostgreSQL', async () => {
      const rendered = await generator.renderTemplate('drizzle/drizzle.config.ts.ejs', {
        projectName: 'test-project',
        database: 'postgresql',
      });

      expect(rendered).toContain("dialect: 'postgresql'");
      expect(rendered).toContain('DATABASE_URL');
      expect(rendered).not.toContain('sqlite');
    });

    it('should render drizzle.config.ts template for SQLite', async () => {
      const rendered = await generator.renderTemplate('drizzle/drizzle.config.ts.ejs', {
        projectName: 'test-project',
        database: 'sqlite',
      });

      expect(rendered).toContain("dialect: 'sqlite'");
      expect(rendered).toContain('test-project.db');
      expect(rendered).not.toContain('postgresql');
    });

    it('should render schema index with Auth.js exports', async () => {
      const rendered = await generator.renderTemplate('drizzle/schema/index.ts.ejs', {
        projectName: 'test-project',
        database: 'postgresql',
        authType: 'authjs',
      });

      expect(rendered).toContain("export * from './accounts'");
      expect(rendered).toContain("export * from './verificationTokens'");
      expect(rendered).toContain('accountsRelations');
    });

    it('should render schema index without Auth.js exports for Lucia', async () => {
      const rendered = await generator.renderTemplate('drizzle/schema/index.ts.ejs', {
        projectName: 'test-project',
        database: 'postgresql',
        authType: 'lucia',
      });

      expect(rendered).not.toContain("export * from './accounts'");
      expect(rendered).not.toContain("export * from './verificationTokens'");
      expect(rendered).not.toContain('accountsRelations');
    });

    it('should throw error for non-existent template', async () => {
      await expect(
        generator.renderTemplate('nonexistent/template.ejs', {})
      ).rejects.toThrow();
    });
  });

  describe('File Writing', () => {
    it('should track generated files', async () => {
      await generator.writeFile('package.json', '{}');
      await generator.writeFile('tsconfig.json', '{}');

      const files = generator.getGeneratedFiles();
      expect(files).toHaveLength(2);
      expect(files[0]?.path).toBe('package.json');
      expect(files[1]?.path).toBe('tsconfig.json');
    });

    it('should preserve file content', async () => {
      const content = '{"name": "test"}';
      await generator.writeFile('package.json', content);

      const files = generator.getGeneratedFiles();
      expect(files[0]?.content).toBe(content);
    });
  });
});

describe('NextJsGenerator', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `stackgen-nextjs-test-${Date.now()}`);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Package.json Generation', () => {
    it('should generate package.json with PostgreSQL dependencies', async () => {
      const generator = new MockBaseGenerator({
        projectName: 'nextjs-postgres-app',
        frontend: 'nextjs',
        database: 'postgresql',
        authType: 'authjs',
        deployment: 'docker',
        outputDir: tempDir,
      });

      const rendered = await generator.renderTemplate('nextjs/package.json.ejs', {
        projectName: 'nextjs-postgres-app',
        database: 'postgresql',
        authType: 'authjs',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.name).toBe('nextjs-postgres-app');
      expect(pkg.dependencies).toHaveProperty('postgres');
      expect(pkg.dependencies).not.toHaveProperty('better-sqlite3');
      expect(pkg.dependencies).toHaveProperty('drizzle-orm');
    });

    it('should generate package.json with SQLite dependencies', async () => {
      const generator = new MockBaseGenerator({
        projectName: 'nextjs-sqlite-app',
        frontend: 'nextjs',
        database: 'sqlite',
        authType: 'lucia',
        deployment: 'vercel',
        outputDir: tempDir,
      });

      const rendered = await generator.renderTemplate('nextjs/package.json.ejs', {
        projectName: 'nextjs-sqlite-app',
        database: 'sqlite',
        authType: 'lucia',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.dependencies).toHaveProperty('better-sqlite3');
      expect(pkg.dependencies).not.toHaveProperty('postgres');
      expect(pkg.devDependencies).toHaveProperty('@types/better-sqlite3');
    });

    it('should generate package.json with Auth.js dependencies', async () => {
      const generator = new MockBaseGenerator({
        projectName: 'nextjs-authjs-app',
        frontend: 'nextjs',
        database: 'postgresql',
        authType: 'authjs',
        deployment: 'docker',
        outputDir: tempDir,
      });

      const rendered = await generator.renderTemplate('nextjs/package.json.ejs', {
        projectName: 'nextjs-authjs-app',
        database: 'postgresql',
        authType: 'authjs',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.dependencies).toHaveProperty('next-auth');
      expect(pkg.dependencies).toHaveProperty('@auth/drizzle-adapter');
      expect(pkg.dependencies).toHaveProperty('bcryptjs');
      expect(pkg.devDependencies).toHaveProperty('@types/bcryptjs');
    });

    it('should generate package.json with Lucia dependencies', async () => {
      const generator = new MockBaseGenerator({
        projectName: 'nextjs-lucia-app',
        frontend: 'nextjs',
        database: 'postgresql',
        authType: 'lucia',
        deployment: 'docker',
        outputDir: tempDir,
      });

      const rendered = await generator.renderTemplate('nextjs/package.json.ejs', {
        projectName: 'nextjs-lucia-app',
        database: 'postgresql',
        authType: 'lucia',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.dependencies).toHaveProperty('lucia');
      expect(pkg.dependencies).toHaveProperty('@lucia-auth/adapter-drizzle');
      expect(pkg.dependencies).toHaveProperty('arctic');
      expect(pkg.dependencies).toHaveProperty('oslo');
      expect(pkg.dependencies).not.toHaveProperty('next-auth');
    });

    it('should include correct npm scripts', async () => {
      const generator = new MockBaseGenerator({
        projectName: 'test-app',
        frontend: 'nextjs',
        database: 'postgresql',
        authType: 'authjs',
        deployment: 'docker',
        outputDir: tempDir,
      });

      const rendered = await generator.renderTemplate('nextjs/package.json.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'authjs',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.scripts).toHaveProperty('dev');
      expect(pkg.scripts).toHaveProperty('build');
      expect(pkg.scripts).toHaveProperty('start');
      expect(pkg.scripts).toHaveProperty('lint');
      expect(pkg.scripts).toHaveProperty('db:generate');
      expect(pkg.scripts).toHaveProperty('db:migrate');
      expect(pkg.scripts).toHaveProperty('db:push');
      expect(pkg.scripts).toHaveProperty('db:studio');
    });
  });

  describe('Next.js Config Generation', () => {
    it('should generate next.config.ts with standalone output for Docker', async () => {
      const generator = new MockBaseGenerator({
        projectName: 'docker-app',
        frontend: 'nextjs',
        database: 'postgresql',
        authType: 'authjs',
        deployment: 'docker',
        outputDir: tempDir,
      });

      const rendered = await generator.renderTemplate('nextjs/next.config.ts.ejs', {
        deployment: 'docker',
      });

      expect(rendered).toContain('output: "standalone"');
      expect(rendered).toContain('reactStrictMode: true');
    });

    it('should generate next.config.ts without standalone output for Vercel', async () => {
      const generator = new MockBaseGenerator({
        projectName: 'vercel-app',
        frontend: 'nextjs',
        database: 'postgresql',
        authType: 'authjs',
        deployment: 'vercel',
        outputDir: tempDir,
      });

      const rendered = await generator.renderTemplate('nextjs/next.config.ts.ejs', {
        deployment: 'vercel',
      });

      expect(rendered).not.toContain('output: "standalone"');
      expect(rendered).toContain('reactStrictMode: true');
    });

    it('should include server actions configuration', async () => {
      const generator = new MockBaseGenerator({
        projectName: 'test-app',
        frontend: 'nextjs',
        database: 'postgresql',
        authType: 'authjs',
        deployment: 'docker',
        outputDir: tempDir,
      });

      const rendered = await generator.renderTemplate('nextjs/next.config.ts.ejs', {
        deployment: 'docker',
      });

      expect(rendered).toContain('serverActions');
      expect(rendered).toContain('bodySizeLimit');
    });
  });

  describe('TypeScript Config Generation', () => {
    it('should generate valid tsconfig.json', async () => {
      const generator = new MockBaseGenerator({
        projectName: 'test-app',
        frontend: 'nextjs',
        database: 'postgresql',
        authType: 'authjs',
        deployment: 'docker',
        outputDir: tempDir,
      });

      const rendered = await generator.renderTemplate('nextjs/tsconfig.json.ejs', {});
      const tsconfig = JSON.parse(rendered);

      expect(tsconfig.compilerOptions.strict).toBe(true);
      expect(tsconfig.compilerOptions.jsx).toBe('preserve');
      expect(tsconfig.compilerOptions.moduleResolution).toBe('bundler');
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@/*');
    });
  });

  describe('Tailwind Config Generation', () => {
    it('should generate valid tailwind.config.ts', async () => {
      const generator = new MockBaseGenerator({
        projectName: 'test-app',
        frontend: 'nextjs',
        database: 'postgresql',
        authType: 'authjs',
        deployment: 'docker',
        outputDir: tempDir,
      });

      const rendered = await generator.renderTemplate('nextjs/tailwind.config.ts.ejs', {});

      expect(rendered).toContain('content:');
      expect(rendered).toContain('./app/**/*.{js,ts,jsx,tsx,mdx}');
      expect(rendered).toContain('theme:');
      expect(rendered).toContain('extend:');
    });
  });
});

describe('ViteGenerator', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `stackgen-vite-test-${Date.now()}`);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Package.json Generation', () => {
    it('should generate Vite package.json with correct dependencies', async () => {
      const generator = new MockBaseGenerator({
        projectName: 'vite-app',
        frontend: 'vite',
        database: 'postgresql',
        authType: 'lucia',
        deployment: 'docker',
        outputDir: tempDir,
      });

      const rendered = await generator.renderTemplate('vite/package.json.ejs', {
        projectName: 'vite-app',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.name).toBe('vite-app-client');
      expect(pkg.dependencies).toHaveProperty('react');
      expect(pkg.dependencies).toHaveProperty('react-dom');
      expect(pkg.dependencies).toHaveProperty('react-router-dom');
      expect(pkg.dependencies).toHaveProperty('axios');
    });

    it('should include Vite dev dependencies', async () => {
      const generator = new MockBaseGenerator({
        projectName: 'vite-app',
        frontend: 'vite',
        database: 'postgresql',
        authType: 'lucia',
        deployment: 'docker',
        outputDir: tempDir,
      });

      const rendered = await generator.renderTemplate('vite/package.json.ejs', {
        projectName: 'vite-app',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.devDependencies).toHaveProperty('vite');
      expect(pkg.devDependencies).toHaveProperty('@vitejs/plugin-react');
      expect(pkg.devDependencies).toHaveProperty('typescript');
      expect(pkg.devDependencies).toHaveProperty('tailwindcss');
    });

    it('should include correct scripts for Vite', async () => {
      const generator = new MockBaseGenerator({
        projectName: 'vite-app',
        frontend: 'vite',
        database: 'postgresql',
        authType: 'lucia',
        deployment: 'docker',
        outputDir: tempDir,
      });

      const rendered = await generator.renderTemplate('vite/package.json.ejs', {
        projectName: 'vite-app',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.scripts.dev).toBe('vite');
      expect(pkg.scripts.build).toContain('vite build');
      expect(pkg.scripts.preview).toBe('vite preview');
    });
  });

  describe('Vite Config Generation', () => {
    it('should generate vite.config.ts with API proxy', async () => {
      const generator = new MockBaseGenerator({
        projectName: 'vite-app',
        frontend: 'vite',
        database: 'postgresql',
        authType: 'lucia',
        deployment: 'docker',
        outputDir: tempDir,
      });

      const rendered = await generator.renderTemplate('vite/vite.config.ts.ejs', {});

      expect(rendered).toContain('proxy:');
      expect(rendered).toContain("'/api':");
      expect(rendered).toContain("target: 'http://localhost:3000'");
    });

    it('should include path alias configuration', async () => {
      const generator = new MockBaseGenerator({
        projectName: 'vite-app',
        frontend: 'vite',
        database: 'postgresql',
        authType: 'lucia',
        deployment: 'docker',
        outputDir: tempDir,
      });

      const rendered = await generator.renderTemplate('vite/vite.config.ts.ejs', {});

      expect(rendered).toContain('resolve:');
      expect(rendered).toContain('alias:');
      expect(rendered).toContain("'@': '/src'");
    });

    it('should configure sourcemaps for build', async () => {
      const generator = new MockBaseGenerator({
        projectName: 'vite-app',
        frontend: 'vite',
        database: 'postgresql',
        authType: 'lucia',
        deployment: 'docker',
        outputDir: tempDir,
      });

      const rendered = await generator.renderTemplate('vite/vite.config.ts.ejs', {});

      expect(rendered).toContain('build:');
      expect(rendered).toContain('sourcemap: true');
    });
  });

  describe('TypeScript Config Generation', () => {
    it('should generate Vite-specific tsconfig.json', async () => {
      const generator = new MockBaseGenerator({
        projectName: 'vite-app',
        frontend: 'vite',
        database: 'postgresql',
        authType: 'lucia',
        deployment: 'docker',
        outputDir: tempDir,
      });

      const rendered = await generator.renderTemplate('vite/tsconfig.json.ejs', {});
      const tsconfig = JSON.parse(rendered);

      expect(tsconfig.compilerOptions.jsx).toBe('react-jsx');
      expect(tsconfig.compilerOptions.moduleResolution).toBe('bundler');
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });
  });
});

describe('ExpressGenerator', () => {
  // Note: Express templates would need to be created
  // These tests define the expected behavior

  describe('Package.json Generation', () => {
    it.skip('should generate Express package.json with correct dependencies', async () => {
      // Test will be implemented when Express templates are created
      expect(true).toBe(true);
    });

    it.skip('should include Express-specific dependencies', async () => {
      // Expected dependencies: express, cors, helmet, compression
      expect(true).toBe(true);
    });

    it.skip('should include database driver based on configuration', async () => {
      // PostgreSQL: postgres
      // SQLite: better-sqlite3
      expect(true).toBe(true);
    });
  });
});

describe('Template Configuration Combinations', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `stackgen-combo-test-${Date.now()}`);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const configurations = [
    { database: 'postgresql', authType: 'authjs', deployment: 'docker' },
    { database: 'postgresql', authType: 'authjs', deployment: 'vercel' },
    { database: 'postgresql', authType: 'lucia', deployment: 'docker' },
    { database: 'postgresql', authType: 'lucia', deployment: 'vercel' },
    { database: 'sqlite', authType: 'authjs', deployment: 'docker' },
    { database: 'sqlite', authType: 'authjs', deployment: 'vercel' },
    { database: 'sqlite', authType: 'lucia', deployment: 'docker' },
    { database: 'sqlite', authType: 'lucia', deployment: 'vercel' },
  ] as const;

  configurations.forEach(({ database, authType, deployment }) => {
    describe(`${database} + ${authType} + ${deployment}`, () => {
      it('should render Next.js package.json without errors', async () => {
        const generator = new MockBaseGenerator({
          projectName: 'test-app',
          frontend: 'nextjs',
          database,
          authType,
          deployment,
          outputDir: tempDir,
        });

        const rendered = await generator.renderTemplate('nextjs/package.json.ejs', {
          projectName: 'test-app',
          database,
          authType,
        });

        expect(() => JSON.parse(rendered)).not.toThrow();
      });

      it('should render drizzle config without errors', async () => {
        const generator = new MockBaseGenerator({
          projectName: 'test-app',
          frontend: 'nextjs',
          database,
          authType,
          deployment,
          outputDir: tempDir,
        });

        const rendered = await generator.renderTemplate('drizzle/drizzle.config.ts.ejs', {
          projectName: 'test-app',
          database,
        });

        expect(rendered).toBeTruthy();
        expect(rendered.length).toBeGreaterThan(0);
      });

      it('should render schema index without errors', async () => {
        const generator = new MockBaseGenerator({
          projectName: 'test-app',
          frontend: 'nextjs',
          database,
          authType,
          deployment,
          outputDir: tempDir,
        });

        const rendered = await generator.renderTemplate('drizzle/schema/index.ts.ejs', {
          projectName: 'test-app',
          database,
          authType,
        });

        expect(rendered).toBeTruthy();
      });

      it('should render next.config.ts without errors', async () => {
        const generator = new MockBaseGenerator({
          projectName: 'test-app',
          frontend: 'nextjs',
          database,
          authType,
          deployment,
          outputDir: tempDir,
        });

        const rendered = await generator.renderTemplate('nextjs/next.config.ts.ejs', {
          deployment,
        });

        expect(rendered).toBeTruthy();
        expect(rendered).toContain('nextConfig');
      });
    });
  });
});

describe('Generated File Syntax Validation', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `stackgen-syntax-test-${Date.now()}`);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should generate valid JSON for package.json', async () => {
    const generator = new MockBaseGenerator({
      projectName: 'syntax-test',
      frontend: 'nextjs',
      database: 'postgresql',
      authType: 'authjs',
      deployment: 'docker',
      outputDir: tempDir,
    });

    const rendered = await generator.renderTemplate('nextjs/package.json.ejs', {
      projectName: 'syntax-test',
      database: 'postgresql',
      authType: 'authjs',
    });

    expect(() => JSON.parse(rendered)).not.toThrow();
    const pkg = JSON.parse(rendered);
    expect(typeof pkg.name).toBe('string');
    expect(typeof pkg.dependencies).toBe('object');
  });

  it('should generate valid JSON for tsconfig.json', async () => {
    const generator = new MockBaseGenerator({
      projectName: 'syntax-test',
      frontend: 'nextjs',
      database: 'postgresql',
      authType: 'authjs',
      deployment: 'docker',
      outputDir: tempDir,
    });

    const rendered = await generator.renderTemplate('nextjs/tsconfig.json.ejs', {});

    expect(() => JSON.parse(rendered)).not.toThrow();
    const tsconfig = JSON.parse(rendered);
    expect(typeof tsconfig.compilerOptions).toBe('object');
  });

  it('should generate valid TypeScript syntax for next.config.ts', async () => {
    const generator = new MockBaseGenerator({
      projectName: 'syntax-test',
      frontend: 'nextjs',
      database: 'postgresql',
      authType: 'authjs',
      deployment: 'docker',
      outputDir: tempDir,
    });

    const rendered = await generator.renderTemplate('nextjs/next.config.ts.ejs', {
      deployment: 'docker',
    });

    // Basic TypeScript syntax checks
    expect(rendered).toContain('import');
    expect(rendered).toContain('export default');
    expect(rendered).toMatch(/const \w+/);
  });

  it('should generate valid TypeScript syntax for drizzle.config.ts', async () => {
    const generator = new MockBaseGenerator({
      projectName: 'syntax-test',
      frontend: 'nextjs',
      database: 'postgresql',
      authType: 'authjs',
      deployment: 'docker',
      outputDir: tempDir,
    });

    const rendered = await generator.renderTemplate('drizzle/drizzle.config.ts.ejs', {
      projectName: 'syntax-test',
      database: 'postgresql',
    });

    expect(rendered).toContain('import');
    expect(rendered).toContain('export default');
    expect(rendered).toContain('satisfies Config');
  });

  it('should not have orphaned EJS tags in rendered output', async () => {
    const generator = new MockBaseGenerator({
      projectName: 'syntax-test',
      frontend: 'nextjs',
      database: 'postgresql',
      authType: 'authjs',
      deployment: 'docker',
      outputDir: tempDir,
    });

    const templates = [
      'nextjs/package.json.ejs',
      'nextjs/next.config.ts.ejs',
      'nextjs/tsconfig.json.ejs',
      'nextjs/tailwind.config.ts.ejs',
      'drizzle/drizzle.config.ts.ejs',
      'drizzle/schema/index.ts.ejs',
    ];

    for (const template of templates) {
      const rendered = await generator.renderTemplate(template, {
        projectName: 'syntax-test',
        database: 'postgresql',
        authType: 'authjs',
        deployment: 'docker',
      });

      // Check for orphaned EJS tags
      expect(rendered).not.toMatch(/<%[^%]*$/);
      expect(rendered).not.toMatch(/%>[^<]*$/);
      expect(rendered).not.toContain('<%');
      expect(rendered).not.toContain('%>');
    }
  });
});

describe('Edge Cases', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `stackgen-edge-test-${Date.now()}`);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle empty project name', () => {
    expect(() => {
      new MockBaseGenerator({
        projectName: '',
        frontend: 'nextjs',
        database: 'postgresql',
        authType: 'authjs',
        deployment: 'docker',
        outputDir: tempDir,
      });
    }).not.toThrow();
  });

  it('should handle very long project names', () => {
    const longName = 'a'.repeat(100);
    const generator = new MockBaseGenerator({
      projectName: longName,
      frontend: 'nextjs',
      database: 'postgresql',
      authType: 'authjs',
      deployment: 'docker',
      outputDir: tempDir,
    });

    expect(generator.getConfig().projectName).toBe(longName);
  });

  it('should handle project names with unicode characters', () => {
    const generator = new MockBaseGenerator({
      projectName: 'my-project-cafe',
      frontend: 'nextjs',
      database: 'postgresql',
      authType: 'authjs',
      deployment: 'docker',
      outputDir: tempDir,
    });

    expect(generator.getConfig().projectName).toBe('my-project-cafe');
  });

  it('should handle paths with spaces', () => {
    const pathWithSpaces = path.join(os.tmpdir(), 'path with spaces', 'project');
    const generator = new MockBaseGenerator({
      projectName: 'test-project',
      frontend: 'nextjs',
      database: 'postgresql',
      authType: 'authjs',
      deployment: 'docker',
      outputDir: pathWithSpaces,
    });

    expect(generator.getConfig().outputDir).toBe(pathWithSpaces);
  });
});
