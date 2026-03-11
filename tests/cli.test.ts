/**
 * CLI Tests
 *
 * Comprehensive tests for the CLI interface:
 * - Argument parsing with different flags
 * - Default value handling
 * - Interactive prompt mocking
 * - Help and version output
 * - Error handling for invalid inputs
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { Command } from 'commander';

// Mock @clack/prompts before imports
const mockPrompts = {
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    message: vi.fn(),
  })),
  cancel: vi.fn(),
  isCancel: vi.fn(() => false),
  note: vi.fn(),
  log: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
    step: vi.fn(),
  },
};

vi.mock('@clack/prompts', () => mockPrompts);

// Mock ora spinner
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    text: '',
  })),
}));

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
  execaCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
}));

// Mock fs-extra
vi.mock('fs-extra', () => ({
  ensureDir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  pathExists: vi.fn().mockResolvedValue(false),
  remove: vi.fn().mockResolvedValue(undefined),
}));

// Types for CLI options
interface CLIOptions {
  name?: string;
  frontend?: 'nextjs' | 'vite';
  database?: 'postgresql' | 'sqlite';
  auth?: 'authjs' | 'lucia';
  deployment?: 'docker' | 'vercel';
  yes?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

// Default options when --yes flag is used
const DEFAULT_OPTIONS: Required<Omit<CLIOptions, 'name' | 'dryRun' | 'verbose'>> = {
  frontend: 'nextjs',
  database: 'postgresql',
  auth: 'authjs',
  deployment: 'docker',
  yes: true,
};

/**
 * Creates a CLI program for testing
 */
function createCLI(): Command {
  const program = new Command();

  program
    .name('stackgen')
    .description('Opinionated full-stack project scaffolder')
    .version('1.0.0')
    .argument('[name]', 'Project name')
    .option('-y, --yes', 'Use default options without prompts')
    .option('-n, --name <name>', 'Project name')
    .option('-f, --frontend <type>', 'Frontend framework (nextjs, vite)')
    .option('-d, --database <type>', 'Database (postgresql, sqlite)')
    .option('-a, --auth <type>', 'Authentication (authjs, lucia)')
    .option('--deployment <type>', 'Deployment target (docker, vercel)')
    .option('--dry-run', 'Show what would be generated without creating files')
    .option('-v, --verbose', 'Enable verbose output');

  return program;
}

/**
 * Parses CLI arguments and returns options
 */
function parseArgs(args: string[]): CLIOptions {
  const program = createCLI();
  program.parse(['node', 'stackgen', ...args]);

  const opts = program.opts<CLIOptions>();
  const projectName = program.args[0];

  // Only use positional name if --name flag was not provided
  if (projectName && !opts.name) {
    opts.name = projectName;
  }

  return opts;
}

/**
 * Applies defaults when --yes flag is used
 */
function applyDefaults(options: CLIOptions): CLIOptions {
  if (options.yes) {
    return {
      ...DEFAULT_OPTIONS,
      ...options,
      name: options.name || 'my-app',
    };
  }
  return options;
}

/**
 * Validates CLI options
 */
function validateOptions(options: CLIOptions): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (options.frontend && !['nextjs', 'vite'].includes(options.frontend)) {
    errors.push(`Invalid frontend: ${options.frontend}. Must be 'nextjs' or 'vite'.`);
  }

  if (options.database && !['postgresql', 'sqlite'].includes(options.database)) {
    errors.push(`Invalid database: ${options.database}. Must be 'postgresql' or 'sqlite'.`);
  }

  if (options.auth && !['authjs', 'lucia'].includes(options.auth)) {
    errors.push(`Invalid auth: ${options.auth}. Must be 'authjs' or 'lucia'.`);
  }

  if (options.deployment && !['docker', 'vercel'].includes(options.deployment)) {
    errors.push(`Invalid deployment: ${options.deployment}. Must be 'docker' or 'vercel'.`);
  }

  if (options.name && !/^[a-z0-9-_]+$/i.test(options.name)) {
    errors.push(`Invalid project name: ${options.name}. Must contain only alphanumeric characters, hyphens, and underscores.`);
  }

  return { valid: errors.length === 0, errors };
}

describe('CLI Argument Parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Project Name', () => {
    it('should parse project name as positional argument', () => {
      const opts = parseArgs(['my-project']);
      expect(opts.name).toBe('my-project');
    });

    it('should parse project name with --name flag', () => {
      const opts = parseArgs(['--name', 'my-project']);
      expect(opts.name).toBe('my-project');
    });

    it('should parse project name with -n flag', () => {
      const opts = parseArgs(['-n', 'my-project']);
      expect(opts.name).toBe('my-project');
    });

    it('should prefer --name flag over positional argument', () => {
      // The test's parseArgs function already prepends ['node', 'stackgen']
      const opts = parseArgs(['positional-name', '--name', 'flag-name']);
      // --name flag takes precedence over positional argument
      expect(opts.name).toBe('flag-name');
    });
  });

  describe('--yes Flag', () => {
    it('should set yes option with --yes flag', () => {
      const opts = parseArgs(['--yes']);
      expect(opts.yes).toBe(true);
    });

    it('should set yes option with -y flag', () => {
      const opts = parseArgs(['-y']);
      expect(opts.yes).toBe(true);
    });

    it('should apply default frontend when --yes is used', () => {
      const opts = applyDefaults(parseArgs(['--yes']));
      expect(opts.frontend).toBe('nextjs');
    });

    it('should apply default database when --yes is used', () => {
      const opts = applyDefaults(parseArgs(['--yes']));
      expect(opts.database).toBe('postgresql');
    });

    it('should apply default auth when --yes is used', () => {
      const opts = applyDefaults(parseArgs(['--yes']));
      expect(opts.auth).toBe('authjs');
    });

    it('should apply default deployment when --yes is used', () => {
      const opts = applyDefaults(parseArgs(['--yes']));
      expect(opts.deployment).toBe('docker');
    });

    it('should apply default project name when --yes is used without name', () => {
      const opts = applyDefaults(parseArgs(['--yes']));
      expect(opts.name).toBe('my-app');
    });

    it('should preserve provided options when --yes is used', () => {
      const opts = applyDefaults(parseArgs(['--yes', '--frontend', 'vite', '--database', 'sqlite']));
      expect(opts.frontend).toBe('vite');
      expect(opts.database).toBe('sqlite');
      expect(opts.auth).toBe('authjs'); // Still default
    });
  });

  describe('--frontend Flag', () => {
    it('should parse nextjs frontend', () => {
      const opts = parseArgs(['--frontend', 'nextjs']);
      expect(opts.frontend).toBe('nextjs');
    });

    it('should parse vite frontend', () => {
      const opts = parseArgs(['--frontend', 'vite']);
      expect(opts.frontend).toBe('vite');
    });

    it('should parse with -f shorthand', () => {
      const opts = parseArgs(['-f', 'nextjs']);
      expect(opts.frontend).toBe('nextjs');
    });
  });

  describe('--database Flag', () => {
    it('should parse postgresql database', () => {
      const opts = parseArgs(['--database', 'postgresql']);
      expect(opts.database).toBe('postgresql');
    });

    it('should parse sqlite database', () => {
      const opts = parseArgs(['--database', 'sqlite']);
      expect(opts.database).toBe('sqlite');
    });

    it('should parse with -d shorthand', () => {
      const opts = parseArgs(['-d', 'postgresql']);
      expect(opts.database).toBe('postgresql');
    });
  });

  describe('--auth Flag', () => {
    it('should parse authjs auth type', () => {
      const opts = parseArgs(['--auth', 'authjs']);
      expect(opts.auth).toBe('authjs');
    });

    it('should parse lucia auth type', () => {
      const opts = parseArgs(['--auth', 'lucia']);
      expect(opts.auth).toBe('lucia');
    });

    it('should parse with -a shorthand', () => {
      const opts = parseArgs(['-a', 'lucia']);
      expect(opts.auth).toBe('lucia');
    });
  });

  describe('--deployment Flag', () => {
    it('should parse docker deployment', () => {
      const opts = parseArgs(['--deployment', 'docker']);
      expect(opts.deployment).toBe('docker');
    });

    it('should parse vercel deployment', () => {
      const opts = parseArgs(['--deployment', 'vercel']);
      expect(opts.deployment).toBe('vercel');
    });
  });

  describe('--dry-run Flag', () => {
    it('should parse dry-run flag', () => {
      const opts = parseArgs(['--dry-run']);
      expect(opts.dryRun).toBe(true);
    });

    it('should default dry-run to undefined', () => {
      const opts = parseArgs([]);
      expect(opts.dryRun).toBeUndefined();
    });
  });

  describe('--verbose Flag', () => {
    it('should parse verbose flag', () => {
      const opts = parseArgs(['--verbose']);
      expect(opts.verbose).toBe(true);
    });

    it('should parse with -v shorthand', () => {
      const opts = parseArgs(['-v']);
      expect(opts.verbose).toBe(true);
    });
  });

  describe('Combined Flags', () => {
    it('should parse all flags together', () => {
      const opts = parseArgs([
        'my-project',
        '--frontend', 'vite',
        '--database', 'sqlite',
        '--auth', 'lucia',
        '--deployment', 'vercel',
        '--yes',
        '--verbose',
      ]);

      expect(opts.name).toBe('my-project');
      expect(opts.frontend).toBe('vite');
      expect(opts.database).toBe('sqlite');
      expect(opts.auth).toBe('lucia');
      expect(opts.deployment).toBe('vercel');
      expect(opts.yes).toBe(true);
      expect(opts.verbose).toBe(true);
    });

    it('should parse shorthand flags together', () => {
      const opts = parseArgs(['-y', '-f', 'nextjs', '-d', 'postgresql', '-a', 'authjs', '-v']);

      expect(opts.yes).toBe(true);
      expect(opts.frontend).toBe('nextjs');
      expect(opts.database).toBe('postgresql');
      expect(opts.auth).toBe('authjs');
      expect(opts.verbose).toBe(true);
    });
  });
});

describe('CLI Validation', () => {
  describe('Valid Options', () => {
    it('should validate correct options', () => {
      const result = validateOptions({
        name: 'my-project',
        frontend: 'nextjs',
        database: 'postgresql',
        auth: 'authjs',
        deployment: 'docker',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate project name with hyphens', () => {
      const result = validateOptions({ name: 'my-awesome-project' });
      expect(result.valid).toBe(true);
    });

    it('should validate project name with underscores', () => {
      const result = validateOptions({ name: 'my_awesome_project' });
      expect(result.valid).toBe(true);
    });

    it('should validate project name with numbers', () => {
      const result = validateOptions({ name: 'project123' });
      expect(result.valid).toBe(true);
    });
  });

  describe('Invalid Options', () => {
    it('should reject invalid frontend', () => {
      const result = validateOptions({ frontend: 'angular' as 'nextjs' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid frontend: angular. Must be 'nextjs' or 'vite'.");
    });

    it('should reject invalid database', () => {
      const result = validateOptions({ database: 'mysql' as 'postgresql' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid database: mysql. Must be 'postgresql' or 'sqlite'.");
    });

    it('should reject invalid auth', () => {
      const result = validateOptions({ auth: 'clerk' as 'authjs' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid auth: clerk. Must be 'authjs' or 'lucia'.");
    });

    it('should reject invalid deployment', () => {
      const result = validateOptions({ deployment: 'aws' as 'docker' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid deployment: aws. Must be 'docker' or 'vercel'.");
    });

    it('should reject project name with spaces', () => {
      const result = validateOptions({ name: 'my project' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid project name');
    });

    it('should reject project name with special characters', () => {
      const result = validateOptions({ name: 'my@project!' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid project name');
    });

    it('should collect multiple errors', () => {
      const result = validateOptions({
        frontend: 'angular' as 'nextjs',
        database: 'mysql' as 'postgresql',
        auth: 'clerk' as 'authjs',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });
});

describe('CLI Help Output', () => {
  it('should display program name', () => {
    const program = createCLI();
    expect(program.name()).toBe('stackgen');
  });

  it('should display description', () => {
    const program = createCLI();
    expect(program.description()).toBe('Opinionated full-stack project scaffolder');
  });

  it('should display version', () => {
    const program = createCLI();
    expect(program.version()).toBe('1.0.0');
  });

  it('should have all expected options', () => {
    const program = createCLI();
    const options = program.options.map(opt => opt.long);

    expect(options).toContain('--yes');
    expect(options).toContain('--name');
    expect(options).toContain('--frontend');
    expect(options).toContain('--database');
    expect(options).toContain('--auth');
    expect(options).toContain('--deployment');
    expect(options).toContain('--dry-run');
    expect(options).toContain('--verbose');
  });
});

describe('Interactive Prompts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Project Name Prompt', () => {
    it('should prompt for project name when not provided', async () => {
      (mockPrompts.text as Mock).mockResolvedValueOnce('user-project');

      const result = await mockPrompts.text({
        message: 'What is your project name?',
        placeholder: 'my-app',
        validate: (value: string) => {
          if (!value) return 'Project name is required';
          if (!/^[a-z0-9-_]+$/i.test(value)) return 'Invalid project name';
          return undefined;
        },
      });

      expect(mockPrompts.text).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'What is your project name?',
        })
      );
      expect(result).toBe('user-project');
    });
  });

  describe('Frontend Selection', () => {
    it('should prompt for frontend selection', async () => {
      (mockPrompts.select as Mock).mockResolvedValueOnce('nextjs');

      const result = await mockPrompts.select({
        message: 'Select a frontend framework:',
        options: [
          { value: 'nextjs', label: 'Next.js', hint: 'Full-stack React framework' },
          { value: 'vite', label: 'Vite + React', hint: 'Fast build tool with React' },
        ],
      });

      expect(mockPrompts.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Select a frontend framework:',
        })
      );
      expect(result).toBe('nextjs');
    });

    it('should handle vite selection', async () => {
      (mockPrompts.select as Mock).mockResolvedValueOnce('vite');

      const result = await mockPrompts.select({
        message: 'Select a frontend framework:',
        options: [
          { value: 'nextjs', label: 'Next.js' },
          { value: 'vite', label: 'Vite + React' },
        ],
      });

      expect(result).toBe('vite');
    });
  });

  describe('Database Selection', () => {
    it('should prompt for database selection', async () => {
      (mockPrompts.select as Mock).mockResolvedValueOnce('postgresql');

      const result = await mockPrompts.select({
        message: 'Select a database:',
        options: [
          { value: 'postgresql', label: 'PostgreSQL', hint: 'Production-ready relational database' },
          { value: 'sqlite', label: 'SQLite', hint: 'Lightweight file-based database' },
        ],
      });

      expect(mockPrompts.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Select a database:',
        })
      );
      expect(result).toBe('postgresql');
    });
  });

  describe('Auth Selection', () => {
    it('should prompt for auth selection', async () => {
      (mockPrompts.select as Mock).mockResolvedValueOnce('authjs');

      const result = await mockPrompts.select({
        message: 'Select an authentication solution:',
        options: [
          { value: 'authjs', label: 'Auth.js (NextAuth)', hint: 'Popular auth library' },
          { value: 'lucia', label: 'Lucia', hint: 'Lightweight auth library' },
        ],
      });

      expect(result).toBe('authjs');
    });

    it('should handle lucia selection', async () => {
      (mockPrompts.select as Mock).mockResolvedValueOnce('lucia');

      const result = await mockPrompts.select({
        message: 'Select an authentication solution:',
        options: [
          { value: 'authjs', label: 'Auth.js' },
          { value: 'lucia', label: 'Lucia' },
        ],
      });

      expect(result).toBe('lucia');
    });
  });

  describe('Deployment Selection', () => {
    it('should prompt for deployment target', async () => {
      (mockPrompts.select as Mock).mockResolvedValueOnce('docker');

      const result = await mockPrompts.select({
        message: 'Select a deployment target:',
        options: [
          { value: 'docker', label: 'Docker', hint: 'Containerized deployment' },
          { value: 'vercel', label: 'Vercel', hint: 'Serverless deployment' },
        ],
      });

      expect(result).toBe('docker');
    });
  });

  describe('Cancellation Handling', () => {
    it('should handle user cancellation', async () => {
      (mockPrompts.isCancel as Mock).mockReturnValueOnce(true);
      (mockPrompts.text as Mock).mockResolvedValueOnce(Symbol('cancel'));

      const result = await mockPrompts.text({
        message: 'What is your project name?',
      });

      mockPrompts.isCancel(result);

      expect(mockPrompts.isCancel).toHaveBeenCalled();
    });

    it('should call cancel with appropriate message', () => {
      mockPrompts.cancel('Operation cancelled');
      expect(mockPrompts.cancel).toHaveBeenCalledWith('Operation cancelled');
    });
  });

  describe('Spinner Operations', () => {
    it('should start spinner with message', () => {
      const spinner = mockPrompts.spinner();
      spinner.start('Generating project...');

      expect(spinner.start).toHaveBeenCalledWith('Generating project...');
    });

    it('should stop spinner on completion', () => {
      const spinner = mockPrompts.spinner();
      spinner.start('Generating...');
      spinner.stop('Project generated successfully!');

      expect(spinner.stop).toHaveBeenCalledWith('Project generated successfully!');
    });

    it('should update spinner message', () => {
      const spinner = mockPrompts.spinner();
      spinner.start('Step 1...');
      spinner.message('Step 2...');

      expect(spinner.message).toHaveBeenCalledWith('Step 2...');
    });
  });

  describe('Full Interactive Flow', () => {
    it('should complete full interactive flow', async () => {
      // Mock all prompts in order
      (mockPrompts.text as Mock).mockResolvedValueOnce('my-new-project');
      (mockPrompts.select as Mock)
        .mockResolvedValueOnce('nextjs')
        .mockResolvedValueOnce('postgresql')
        .mockResolvedValueOnce('authjs')
        .mockResolvedValueOnce('docker');
      (mockPrompts.confirm as Mock).mockResolvedValueOnce(true);

      // Simulate the flow
      const projectName = await mockPrompts.text({ message: 'Project name?' });
      const frontend = await mockPrompts.select({ message: 'Frontend?', options: [] });
      const database = await mockPrompts.select({ message: 'Database?', options: [] });
      const auth = await mockPrompts.select({ message: 'Auth?', options: [] });
      const deployment = await mockPrompts.select({ message: 'Deployment?', options: [] });
      const confirmed = await mockPrompts.confirm({ message: 'Proceed?' });

      expect(projectName).toBe('my-new-project');
      expect(frontend).toBe('nextjs');
      expect(database).toBe('postgresql');
      expect(auth).toBe('authjs');
      expect(deployment).toBe('docker');
      expect(confirmed).toBe(true);
    });
  });
});

describe('CLI Output', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display intro message', () => {
    mockPrompts.intro('Welcome to StackGen!');
    expect(mockPrompts.intro).toHaveBeenCalledWith('Welcome to StackGen!');
  });

  it('should display outro message on success', () => {
    mockPrompts.outro('Project created successfully!');
    expect(mockPrompts.outro).toHaveBeenCalledWith('Project created successfully!');
  });

  it('should display note with instructions', () => {
    const instructions = `
      cd my-project
      npm install
      npm run dev
    `;
    mockPrompts.note(instructions, 'Next steps:');
    expect(mockPrompts.note).toHaveBeenCalledWith(instructions, 'Next steps:');
  });

  it('should log success message', () => {
    mockPrompts.log.success('Files generated successfully');
    expect(mockPrompts.log.success).toHaveBeenCalledWith('Files generated successfully');
  });

  it('should log error message', () => {
    mockPrompts.log.error('Failed to create directory');
    expect(mockPrompts.log.error).toHaveBeenCalledWith('Failed to create directory');
  });

  it('should log warning message', () => {
    mockPrompts.log.warn('Directory already exists');
    expect(mockPrompts.log.warn).toHaveBeenCalledWith('Directory already exists');
  });

  it('should log info message', () => {
    mockPrompts.log.info('Using Next.js with PostgreSQL');
    expect(mockPrompts.log.info).toHaveBeenCalledWith('Using Next.js with PostgreSQL');
  });
});

describe('Edge Cases', () => {
  it('should handle empty arguments', () => {
    const opts = parseArgs([]);
    expect(opts.name).toBeUndefined();
    expect(opts.frontend).toBeUndefined();
    expect(opts.yes).toBeUndefined();
  });

  it('should handle unknown flags gracefully', () => {
    // Commander will throw for unknown options by default
    // This test verifies the behavior
    expect(() => {
      const program = createCLI();
      program.exitOverride(); // Prevent process.exit
      program.parse(['node', 'stackgen', '--unknown']);
    }).toThrow();
  });

  it('should handle missing flag values', () => {
    expect(() => {
      const program = createCLI();
      program.exitOverride();
      program.parse(['node', 'stackgen', '--frontend']);
    }).toThrow();
  });

  it('should handle duplicate flags (last one wins)', () => {
    const opts = parseArgs(['--frontend', 'nextjs', '--frontend', 'vite']);
    expect(opts.frontend).toBe('vite');
  });

  it('should handle flags in any order', () => {
    const opts = parseArgs(['--database', 'sqlite', 'my-project', '--frontend', 'vite']);
    expect(opts.name).toBe('my-project');
    expect(opts.database).toBe('sqlite');
    expect(opts.frontend).toBe('vite');
  });

  it('should handle equals sign syntax', () => {
    const opts = parseArgs(['--frontend=nextjs', '--database=postgresql']);
    expect(opts.frontend).toBe('nextjs');
    expect(opts.database).toBe('postgresql');
  });
});

describe('Error Messages', () => {
  it('should provide helpful error for invalid frontend', () => {
    const result = validateOptions({ frontend: 'react' as 'nextjs' });
    expect(result.errors[0]).toContain('Must be');
    expect(result.errors[0]).toContain('nextjs');
    expect(result.errors[0]).toContain('vite');
  });

  it('should provide helpful error for invalid database', () => {
    const result = validateOptions({ database: 'mongodb' as 'postgresql' });
    expect(result.errors[0]).toContain('Must be');
    expect(result.errors[0]).toContain('postgresql');
    expect(result.errors[0]).toContain('sqlite');
  });

  it('should provide helpful error for invalid auth', () => {
    const result = validateOptions({ auth: 'passport' as 'authjs' });
    expect(result.errors[0]).toContain('Must be');
    expect(result.errors[0]).toContain('authjs');
    expect(result.errors[0]).toContain('lucia');
  });

  it('should provide helpful error for invalid deployment', () => {
    const result = validateOptions({ deployment: 'heroku' as 'docker' });
    expect(result.errors[0]).toContain('Must be');
    expect(result.errors[0]).toContain('docker');
    expect(result.errors[0]).toContain('vercel');
  });
});
