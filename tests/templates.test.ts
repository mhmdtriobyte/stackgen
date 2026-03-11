/**
 * Template Tests
 *
 * Comprehensive tests for EJS template rendering:
 * - Template compilation without errors
 * - Correct output for different configurations
 * - Conditional section rendering
 * - TypeScript syntax validation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as ejs from 'ejs';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Template directory
const TEMPLATES_DIR = path.join(__dirname, '..', 'src', 'templates');

// Helper to read template file
function readTemplate(templatePath: string): string {
  const fullPath = path.join(TEMPLATES_DIR, templatePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

// Helper to render template with data
function renderTemplate(templatePath: string, data: Record<string, unknown>): string {
  const template = readTemplate(templatePath);
  const fullPath = path.join(TEMPLATES_DIR, templatePath);
  return ejs.render(template, data, { filename: fullPath });
}

// Helper to check if template file exists
function templateExists(templatePath: string): boolean {
  const fullPath = path.join(TEMPLATES_DIR, templatePath);
  return fs.existsSync(fullPath);
}

// TypeScript basic syntax validation
function isValidTypeScript(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for balanced braces
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
  }

  // Check for balanced parentheses
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
  }

  // Check for balanced brackets
  const openBrackets = (code.match(/\[/g) || []).length;
  const closeBrackets = (code.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    errors.push(`Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close`);
  }

  // Check for unclosed strings
  const singleQuotes = (code.match(/'/g) || []).length;
  const doubleQuotes = (code.match(/"/g) || []).length;
  const backticks = (code.match(/`/g) || []).length;
  if (singleQuotes % 2 !== 0) {
    errors.push('Unclosed single-quoted string');
  }
  if (doubleQuotes % 2 !== 0) {
    errors.push('Unclosed double-quoted string');
  }
  if (backticks % 2 !== 0) {
    errors.push('Unclosed template string');
  }

  // Check for orphaned EJS tags
  if (code.includes('<%') || code.includes('%>')) {
    errors.push('Orphaned EJS tags in rendered output');
  }

  return { valid: errors.length === 0, errors };
}

// JSON validation
function isValidJson(jsonString: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(jsonString);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

describe('Template Existence', () => {
  describe('Next.js Templates', () => {
    it('should have package.json template', () => {
      expect(templateExists('nextjs/package.json.ejs')).toBe(true);
    });

    it('should have next.config.ts template', () => {
      expect(templateExists('nextjs/next.config.ts.ejs')).toBe(true);
    });

    it('should have tsconfig.json template', () => {
      expect(templateExists('nextjs/tsconfig.json.ejs')).toBe(true);
    });

    it('should have tailwind.config.ts template', () => {
      expect(templateExists('nextjs/tailwind.config.ts.ejs')).toBe(true);
    });
  });

  describe('Vite Templates', () => {
    it('should have package.json template', () => {
      expect(templateExists('vite/package.json.ejs')).toBe(true);
    });

    it('should have vite.config.ts template', () => {
      expect(templateExists('vite/vite.config.ts.ejs')).toBe(true);
    });

    it('should have tsconfig.json template', () => {
      expect(templateExists('vite/tsconfig.json.ejs')).toBe(true);
    });
  });

  describe('Drizzle Templates', () => {
    it('should have drizzle.config.ts template', () => {
      expect(templateExists('drizzle/drizzle.config.ts.ejs')).toBe(true);
    });

    it('should have schema index template', () => {
      expect(templateExists('drizzle/schema/index.ts.ejs')).toBe(true);
    });
  });
});

describe('Template Compilation', () => {
  describe('Next.js Templates Compile Without Errors', () => {
    const testData = {
      projectName: 'test-project',
      database: 'postgresql',
      authType: 'authjs',
      deployment: 'docker',
    };

    it('should compile package.json.ejs', () => {
      expect(() => renderTemplate('nextjs/package.json.ejs', testData)).not.toThrow();
    });

    it('should compile next.config.ts.ejs', () => {
      expect(() => renderTemplate('nextjs/next.config.ts.ejs', testData)).not.toThrow();
    });

    it('should compile tsconfig.json.ejs', () => {
      expect(() => renderTemplate('nextjs/tsconfig.json.ejs', testData)).not.toThrow();
    });

    it('should compile tailwind.config.ts.ejs', () => {
      expect(() => renderTemplate('nextjs/tailwind.config.ts.ejs', testData)).not.toThrow();
    });
  });

  describe('Vite Templates Compile Without Errors', () => {
    const testData = {
      projectName: 'test-project',
    };

    it('should compile package.json.ejs', () => {
      expect(() => renderTemplate('vite/package.json.ejs', testData)).not.toThrow();
    });

    it('should compile vite.config.ts.ejs', () => {
      expect(() => renderTemplate('vite/vite.config.ts.ejs', testData)).not.toThrow();
    });

    it('should compile tsconfig.json.ejs', () => {
      expect(() => renderTemplate('vite/tsconfig.json.ejs', testData)).not.toThrow();
    });
  });

  describe('Drizzle Templates Compile Without Errors', () => {
    it('should compile drizzle.config.ts.ejs with PostgreSQL', () => {
      expect(() =>
        renderTemplate('drizzle/drizzle.config.ts.ejs', {
          projectName: 'test-project',
          database: 'postgresql',
        })
      ).not.toThrow();
    });

    it('should compile drizzle.config.ts.ejs with SQLite', () => {
      expect(() =>
        renderTemplate('drizzle/drizzle.config.ts.ejs', {
          projectName: 'test-project',
          database: 'sqlite',
        })
      ).not.toThrow();
    });

    it('should compile schema/index.ts.ejs with Auth.js', () => {
      expect(() =>
        renderTemplate('drizzle/schema/index.ts.ejs', {
          projectName: 'test-project',
          database: 'postgresql',
          authType: 'authjs',
        })
      ).not.toThrow();
    });

    it('should compile schema/index.ts.ejs with Lucia', () => {
      expect(() =>
        renderTemplate('drizzle/schema/index.ts.ejs', {
          projectName: 'test-project',
          database: 'postgresql',
          authType: 'lucia',
        })
      ).not.toThrow();
    });
  });
});

describe('Template Rendering - Next.js Package.json', () => {
  describe('PostgreSQL Configuration', () => {
    it('should include postgres driver', () => {
      const rendered = renderTemplate('nextjs/package.json.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'authjs',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.dependencies).toHaveProperty('postgres');
      expect(pkg.dependencies).not.toHaveProperty('better-sqlite3');
    });

    it('should not include SQLite types', () => {
      const rendered = renderTemplate('nextjs/package.json.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'authjs',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.devDependencies).not.toHaveProperty('@types/better-sqlite3');
    });
  });

  describe('SQLite Configuration', () => {
    it('should include better-sqlite3 driver', () => {
      const rendered = renderTemplate('nextjs/package.json.ejs', {
        projectName: 'test-app',
        database: 'sqlite',
        authType: 'authjs',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.dependencies).toHaveProperty('better-sqlite3');
      expect(pkg.dependencies).not.toHaveProperty('postgres');
    });

    it('should include SQLite types', () => {
      const rendered = renderTemplate('nextjs/package.json.ejs', {
        projectName: 'test-app',
        database: 'sqlite',
        authType: 'authjs',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.devDependencies).toHaveProperty('@types/better-sqlite3');
    });
  });

  describe('Auth.js Configuration', () => {
    it('should include next-auth package', () => {
      const rendered = renderTemplate('nextjs/package.json.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'authjs',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.dependencies).toHaveProperty('next-auth');
      expect(pkg.dependencies).toHaveProperty('@auth/drizzle-adapter');
      expect(pkg.dependencies).toHaveProperty('bcryptjs');
    });

    it('should include bcryptjs types', () => {
      const rendered = renderTemplate('nextjs/package.json.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'authjs',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.devDependencies).toHaveProperty('@types/bcryptjs');
    });

    it('should not include Lucia packages', () => {
      const rendered = renderTemplate('nextjs/package.json.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'authjs',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.dependencies).not.toHaveProperty('lucia');
      expect(pkg.dependencies).not.toHaveProperty('@lucia-auth/adapter-drizzle');
    });
  });

  describe('Lucia Configuration', () => {
    it('should include lucia package', () => {
      const rendered = renderTemplate('nextjs/package.json.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'lucia',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.dependencies).toHaveProperty('lucia');
      expect(pkg.dependencies).toHaveProperty('@lucia-auth/adapter-drizzle');
      expect(pkg.dependencies).toHaveProperty('arctic');
      expect(pkg.dependencies).toHaveProperty('oslo');
    });

    it('should not include next-auth packages', () => {
      const rendered = renderTemplate('nextjs/package.json.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'lucia',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.dependencies).not.toHaveProperty('next-auth');
      expect(pkg.dependencies).not.toHaveProperty('@auth/drizzle-adapter');
    });
  });

  describe('Project Name Interpolation', () => {
    it('should use provided project name', () => {
      const rendered = renderTemplate('nextjs/package.json.ejs', {
        projectName: 'my-awesome-app',
        database: 'postgresql',
        authType: 'authjs',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.name).toBe('my-awesome-app');
    });

    it('should handle project names with hyphens', () => {
      const rendered = renderTemplate('nextjs/package.json.ejs', {
        projectName: 'my-cool-project',
        database: 'postgresql',
        authType: 'authjs',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.name).toBe('my-cool-project');
    });
  });
});

describe('Template Rendering - Next.js Config', () => {
  describe('Docker Deployment', () => {
    it('should include standalone output', () => {
      const rendered = renderTemplate('nextjs/next.config.ts.ejs', {
        deployment: 'docker',
      });

      expect(rendered).toContain('output: "standalone"');
    });
  });

  describe('Vercel Deployment', () => {
    it('should not include standalone output', () => {
      const rendered = renderTemplate('nextjs/next.config.ts.ejs', {
        deployment: 'vercel',
      });

      expect(rendered).not.toContain('output: "standalone"');
    });
  });

  describe('Common Configuration', () => {
    it('should always include reactStrictMode', () => {
      const dockerRendered = renderTemplate('nextjs/next.config.ts.ejs', {
        deployment: 'docker',
      });
      const vercelRendered = renderTemplate('nextjs/next.config.ts.ejs', {
        deployment: 'vercel',
      });

      expect(dockerRendered).toContain('reactStrictMode: true');
      expect(vercelRendered).toContain('reactStrictMode: true');
    });

    it('should always include serverActions config', () => {
      const rendered = renderTemplate('nextjs/next.config.ts.ejs', {
        deployment: 'docker',
      });

      expect(rendered).toContain('serverActions');
      expect(rendered).toContain('bodySizeLimit');
    });
  });
});

describe('Template Rendering - Drizzle Config', () => {
  describe('PostgreSQL Configuration', () => {
    it('should use postgresql dialect', () => {
      const rendered = renderTemplate('drizzle/drizzle.config.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
      });

      expect(rendered).toContain("dialect: 'postgresql'");
      expect(rendered).not.toContain("dialect: 'sqlite'");
    });

    it('should use DATABASE_URL environment variable', () => {
      const rendered = renderTemplate('drizzle/drizzle.config.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
      });

      expect(rendered).toContain('DATABASE_URL');
      expect(rendered).toContain('process.env.DATABASE_URL');
    });
  });

  describe('SQLite Configuration', () => {
    it('should use sqlite dialect', () => {
      const rendered = renderTemplate('drizzle/drizzle.config.ts.ejs', {
        projectName: 'test-app',
        database: 'sqlite',
      });

      expect(rendered).toContain("dialect: 'sqlite'");
      expect(rendered).not.toContain("dialect: 'postgresql'");
    });

    it('should use project name in database path', () => {
      const rendered = renderTemplate('drizzle/drizzle.config.ts.ejs', {
        projectName: 'my-app',
        database: 'sqlite',
      });

      expect(rendered).toContain('my-app.db');
    });
  });

  describe('Common Configuration', () => {
    it('should include schema path', () => {
      const pgRendered = renderTemplate('drizzle/drizzle.config.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
      });
      const sqliteRendered = renderTemplate('drizzle/drizzle.config.ts.ejs', {
        projectName: 'test-app',
        database: 'sqlite',
      });

      expect(pgRendered).toContain('./src/db/schema/index.ts');
      expect(sqliteRendered).toContain('./src/db/schema/index.ts');
    });

    it('should include migrations output path', () => {
      const rendered = renderTemplate('drizzle/drizzle.config.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
      });

      expect(rendered).toContain('./drizzle/migrations');
    });

    it('should enable verbose mode', () => {
      const rendered = renderTemplate('drizzle/drizzle.config.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
      });

      expect(rendered).toContain('verbose: true');
    });

    it('should enable strict mode', () => {
      const rendered = renderTemplate('drizzle/drizzle.config.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
      });

      expect(rendered).toContain('strict: true');
    });
  });
});

describe('Template Rendering - Schema Index', () => {
  describe('Auth.js Schema', () => {
    it('should export accounts schema', () => {
      const rendered = renderTemplate('drizzle/schema/index.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'authjs',
      });

      expect(rendered).toContain("export * from './accounts'");
    });

    it('should export verificationTokens schema', () => {
      const rendered = renderTemplate('drizzle/schema/index.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'authjs',
      });

      expect(rendered).toContain("export * from './verificationTokens'");
    });

    it('should export accountsRelations', () => {
      const rendered = renderTemplate('drizzle/schema/index.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'authjs',
      });

      expect(rendered).toContain('accountsRelations');
    });
  });

  describe('Lucia Schema', () => {
    it('should not export accounts schema', () => {
      const rendered = renderTemplate('drizzle/schema/index.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'lucia',
      });

      expect(rendered).not.toContain("export * from './accounts'");
    });

    it('should not export verificationTokens schema', () => {
      const rendered = renderTemplate('drizzle/schema/index.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'lucia',
      });

      expect(rendered).not.toContain("export * from './verificationTokens'");
    });
  });

  describe('Common Exports', () => {
    it('should always export users schema', () => {
      const authjsRendered = renderTemplate('drizzle/schema/index.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'authjs',
      });
      const luciaRendered = renderTemplate('drizzle/schema/index.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'lucia',
      });

      expect(authjsRendered).toContain("export * from './users'");
      expect(luciaRendered).toContain("export * from './users'");
    });

    it('should always export sessions schema', () => {
      const rendered = renderTemplate('drizzle/schema/index.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'authjs',
      });

      expect(rendered).toContain("export * from './sessions'");
    });

    it('should export usersRelations', () => {
      const rendered = renderTemplate('drizzle/schema/index.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'authjs',
      });

      expect(rendered).toContain('usersRelations');
    });

    it('should export sessionsRelations', () => {
      const rendered = renderTemplate('drizzle/schema/index.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'authjs',
      });

      expect(rendered).toContain('sessionsRelations');
    });
  });
});

describe('Syntax Validation', () => {
  describe('JSON Templates', () => {
    it('should produce valid JSON for Next.js package.json', () => {
      const rendered = renderTemplate('nextjs/package.json.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'authjs',
      });

      const result = isValidJson(rendered);
      expect(result.valid).toBe(true);
    });

    it('should produce valid JSON for Vite package.json', () => {
      const rendered = renderTemplate('vite/package.json.ejs', {
        projectName: 'test-app',
      });

      const result = isValidJson(rendered);
      expect(result.valid).toBe(true);
    });

    it('should produce valid JSON for Next.js tsconfig.json', () => {
      const rendered = renderTemplate('nextjs/tsconfig.json.ejs', {});

      const result = isValidJson(rendered);
      expect(result.valid).toBe(true);
    });

    it('should produce valid JSON for Vite tsconfig.json', () => {
      const rendered = renderTemplate('vite/tsconfig.json.ejs', {});

      const result = isValidJson(rendered);
      expect(result.valid).toBe(true);
    });
  });

  describe('TypeScript Templates', () => {
    it('should produce valid TypeScript for next.config.ts', () => {
      const rendered = renderTemplate('nextjs/next.config.ts.ejs', {
        deployment: 'docker',
      });

      const result = isValidTypeScript(rendered);
      expect(result.valid).toBe(true);
      if (!result.valid) {
        console.log('TypeScript validation errors:', result.errors);
      }
    });

    it('should produce valid TypeScript for vite.config.ts', () => {
      const rendered = renderTemplate('vite/vite.config.ts.ejs', {});

      const result = isValidTypeScript(rendered);
      expect(result.valid).toBe(true);
    });

    it('should produce valid TypeScript for drizzle.config.ts (PostgreSQL)', () => {
      const rendered = renderTemplate('drizzle/drizzle.config.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
      });

      const result = isValidTypeScript(rendered);
      expect(result.valid).toBe(true);
    });

    it('should produce valid TypeScript for drizzle.config.ts (SQLite)', () => {
      const rendered = renderTemplate('drizzle/drizzle.config.ts.ejs', {
        projectName: 'test-app',
        database: 'sqlite',
      });

      const result = isValidTypeScript(rendered);
      expect(result.valid).toBe(true);
    });

    it('should produce valid TypeScript for tailwind.config.ts', () => {
      const rendered = renderTemplate('nextjs/tailwind.config.ts.ejs', {});

      const result = isValidTypeScript(rendered);
      expect(result.valid).toBe(true);
    });

    it('should produce valid TypeScript for schema/index.ts (Auth.js)', () => {
      const rendered = renderTemplate('drizzle/schema/index.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'authjs',
      });

      const result = isValidTypeScript(rendered);
      expect(result.valid).toBe(true);
    });

    it('should produce valid TypeScript for schema/index.ts (Lucia)', () => {
      const rendered = renderTemplate('drizzle/schema/index.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'lucia',
      });

      const result = isValidTypeScript(rendered);
      expect(result.valid).toBe(true);
    });
  });
});

describe('No Orphaned EJS Tags', () => {
  const allTemplates = [
    { path: 'nextjs/package.json.ejs', data: { projectName: 'test', database: 'postgresql', authType: 'authjs' } },
    { path: 'nextjs/next.config.ts.ejs', data: { deployment: 'docker' } },
    { path: 'nextjs/tsconfig.json.ejs', data: {} },
    { path: 'nextjs/tailwind.config.ts.ejs', data: {} },
    { path: 'vite/package.json.ejs', data: { projectName: 'test' } },
    { path: 'vite/vite.config.ts.ejs', data: {} },
    { path: 'vite/tsconfig.json.ejs', data: {} },
    { path: 'drizzle/drizzle.config.ts.ejs', data: { projectName: 'test', database: 'postgresql' } },
    { path: 'drizzle/schema/index.ts.ejs', data: { projectName: 'test', database: 'postgresql', authType: 'authjs' } },
  ];

  allTemplates.forEach(({ path: templatePath, data }) => {
    it(`should not have orphaned EJS tags in ${templatePath}`, () => {
      const rendered = renderTemplate(templatePath, data);

      expect(rendered).not.toContain('<%');
      expect(rendered).not.toContain('%>');
      expect(rendered).not.toContain('<%=');
      expect(rendered).not.toContain('<%-');
    });
  });
});

describe('All Configuration Combinations', () => {
  const databases = ['postgresql', 'sqlite'] as const;
  const authTypes = ['authjs', 'lucia'] as const;
  const deployments = ['docker', 'vercel'] as const;

  databases.forEach((database) => {
    authTypes.forEach((authType) => {
      deployments.forEach((deployment) => {
        const configName = `${database}/${authType}/${deployment}`;

        describe(configName, () => {
          it('should render Next.js package.json correctly', () => {
            const rendered = renderTemplate('nextjs/package.json.ejs', {
              projectName: 'test-app',
              database,
              authType,
            });

            expect(isValidJson(rendered).valid).toBe(true);
          });

          it('should render next.config.ts correctly', () => {
            const rendered = renderTemplate('nextjs/next.config.ts.ejs', {
              deployment,
            });

            expect(isValidTypeScript(rendered).valid).toBe(true);
          });

          it('should render drizzle.config.ts correctly', () => {
            const rendered = renderTemplate('drizzle/drizzle.config.ts.ejs', {
              projectName: 'test-app',
              database,
            });

            expect(isValidTypeScript(rendered).valid).toBe(true);
          });

          it('should render schema/index.ts correctly', () => {
            const rendered = renderTemplate('drizzle/schema/index.ts.ejs', {
              projectName: 'test-app',
              database,
              authType,
            });

            expect(isValidTypeScript(rendered).valid).toBe(true);
          });
        });
      });
    });
  });
});

describe('Edge Cases', () => {
  describe('Special Characters in Project Name', () => {
    it('should handle project names with numbers', () => {
      const rendered = renderTemplate('nextjs/package.json.ejs', {
        projectName: 'project123',
        database: 'postgresql',
        authType: 'authjs',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.name).toBe('project123');
    });

    it('should handle project names with hyphens', () => {
      const rendered = renderTemplate('nextjs/package.json.ejs', {
        projectName: 'my-cool-project',
        database: 'postgresql',
        authType: 'authjs',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.name).toBe('my-cool-project');
    });

    it('should handle project names with underscores', () => {
      const rendered = renderTemplate('nextjs/package.json.ejs', {
        projectName: 'my_cool_project',
        database: 'postgresql',
        authType: 'authjs',
      });

      const pkg = JSON.parse(rendered);
      expect(pkg.name).toBe('my_cool_project');
    });
  });

  describe('Missing Template Data', () => {
    it('should fail gracefully with missing data', () => {
      // This should throw because projectName is required
      expect(() =>
        renderTemplate('nextjs/package.json.ejs', {
          // Missing projectName
          database: 'postgresql',
          authType: 'authjs',
        })
      ).toThrow();
    });
  });

  describe('Template Whitespace Handling', () => {
    it('should not have excessive blank lines in rendered output', () => {
      const rendered = renderTemplate('drizzle/schema/index.ts.ejs', {
        projectName: 'test-app',
        database: 'postgresql',
        authType: 'lucia',
      });

      // Should not have more than 2 consecutive newlines
      expect(rendered).not.toMatch(/\n{4,}/);
    });
  });
});

describe('Template Comments and Documentation', () => {
  it('should include header comment in drizzle.config.ts', () => {
    const rendered = renderTemplate('drizzle/drizzle.config.ts.ejs', {
      projectName: 'test-app',
      database: 'postgresql',
    });

    expect(rendered).toContain('Drizzle Kit Configuration');
  });

  it('should include project name in drizzle.config.ts header', () => {
    const rendered = renderTemplate('drizzle/drizzle.config.ts.ejs', {
      projectName: 'my-awesome-app',
      database: 'postgresql',
    });

    expect(rendered).toContain('my-awesome-app');
  });

  it('should include database type in drizzle.config.ts header', () => {
    const pgRendered = renderTemplate('drizzle/drizzle.config.ts.ejs', {
      projectName: 'test-app',
      database: 'postgresql',
    });
    const sqliteRendered = renderTemplate('drizzle/drizzle.config.ts.ejs', {
      projectName: 'test-app',
      database: 'sqlite',
    });

    expect(pgRendered).toContain('Database: postgresql');
    expect(sqliteRendered).toContain('Database: sqlite');
  });

  it('should include header comment in schema/index.ts', () => {
    const rendered = renderTemplate('drizzle/schema/index.ts.ejs', {
      projectName: 'test-app',
      database: 'postgresql',
      authType: 'authjs',
    });

    expect(rendered).toContain('Database Schema Index');
  });
});
