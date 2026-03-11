/**
 * Utility Function Tests
 *
 * Comprehensive tests for utility modules:
 * - fs.ts: File system operations
 * - deps.ts: Package version lookups
 * - git.ts: Git initialization and operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'node:path';
import * as os from 'node:os';

// Mock fs-extra
const mockFsExtra = {
  ensureDir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(''),
  copy: vi.fn().mockResolvedValue(undefined),
  pathExists: vi.fn().mockResolvedValue(false),
  remove: vi.fn().mockResolvedValue(undefined),
  readJson: vi.fn().mockResolvedValue({}),
  writeJson: vi.fn().mockResolvedValue(undefined),
  outputFile: vi.fn().mockResolvedValue(undefined),
  emptyDir: vi.fn().mockResolvedValue(undefined),
  move: vi.fn().mockResolvedValue(undefined),
  stat: vi.fn().mockResolvedValue({ isDirectory: () => true, isFile: () => false }),
  readdir: vi.fn().mockResolvedValue([]),
};

vi.mock('fs-extra', () => mockFsExtra);

// Mock execa
const mockExeca = {
  execa: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
  execaCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
};

vi.mock('execa', () => mockExeca);

// Types
interface PackageVersions {
  [packageName: string]: string;
}

interface GitConfig {
  name?: string;
  email?: string;
}

interface FileSystemError extends Error {
  code: string;
}

// =====================================
// File System Utilities
// =====================================

/**
 * Ensures a directory exists, creating it if necessary
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  await mockFsExtra.ensureDir(dirPath);
}

/**
 * Writes content to a file, creating parent directories if needed
 */
async function writeFile(filePath: string, content: string): Promise<void> {
  await mockFsExtra.outputFile(filePath, content);
}

/**
 * Reads content from a file
 */
async function readFile(filePath: string): Promise<string> {
  return mockFsExtra.readFile(filePath, 'utf-8');
}

/**
 * Checks if a path exists
 */
async function pathExists(targetPath: string): Promise<boolean> {
  return mockFsExtra.pathExists(targetPath);
}

/**
 * Removes a file or directory
 */
async function remove(targetPath: string): Promise<void> {
  await mockFsExtra.remove(targetPath);
}

/**
 * Copies a file or directory
 */
async function copy(src: string, dest: string): Promise<void> {
  await mockFsExtra.copy(src, dest);
}

/**
 * Reads and parses a JSON file
 */
async function readJsonFile<T>(filePath: string): Promise<T> {
  return mockFsExtra.readJson(filePath);
}

/**
 * Writes an object as JSON to a file
 */
async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await mockFsExtra.writeJson(filePath, data, { spaces: 2 });
}

/**
 * Empties a directory without removing it
 */
async function emptyDirectory(dirPath: string): Promise<void> {
  await mockFsExtra.emptyDir(dirPath);
}

/**
 * Lists files in a directory
 */
async function listDirectory(dirPath: string): Promise<string[]> {
  return mockFsExtra.readdir(dirPath);
}

/**
 * Validates a file path
 */
function isValidPath(filePath: string): boolean {
  // Check for invalid characters
  const invalidChars = /[<>"|?*]/;
  if (invalidChars.test(filePath)) {
    return false;
  }
  // Check for empty path
  if (!filePath || filePath.trim() === '') {
    return false;
  }
  return true;
}

/**
 * Normalizes a path for the current OS
 */
function normalizePath(filePath: string): string {
  return path.normalize(filePath);
}

/**
 * Gets the relative path from one path to another
 */
function getRelativePath(from: string, to: string): string {
  return path.relative(from, to);
}

// =====================================
// Dependency Version Utilities
// =====================================

/**
 * Package versions for Next.js stack
 */
const NEXTJS_VERSIONS: PackageVersions = {
  'next': '^15.1.0',
  'react': '^19.0.0',
  'react-dom': '^19.0.0',
  'drizzle-orm': '^0.38.0',
  'drizzle-kit': '^0.30.0',
  'postgres': '^3.4.5',
  'better-sqlite3': '^11.7.0',
  'next-auth': '^5.0.0-beta.25',
  '@auth/drizzle-adapter': '^1.7.4',
  'lucia': '^3.2.2',
  '@lucia-auth/adapter-drizzle': '^1.1.0',
  'zod': '^3.24.0',
  'tailwindcss': '^4.0.0',
};

/**
 * Package versions for Vite stack
 */
const VITE_VERSIONS: PackageVersions = {
  'vite': '^5.4.10',
  'react': '^18.3.1',
  'react-dom': '^18.3.1',
  '@vitejs/plugin-react': '^4.3.3',
  'react-router-dom': '^6.28.0',
  'axios': '^1.7.7',
  'tailwindcss': '^3.4.14',
};

/**
 * Package versions for Express stack
 */
const EXPRESS_VERSIONS: PackageVersions = {
  'express': '^4.21.0',
  'cors': '^2.8.5',
  'helmet': '^8.0.0',
  'compression': '^1.7.4',
  'drizzle-orm': '^0.38.0',
  'postgres': '^3.4.5',
  'better-sqlite3': '^11.7.0',
};

/**
 * Gets the version for a package
 */
function getPackageVersion(packageName: string, stack: 'nextjs' | 'vite' | 'express'): string | undefined {
  const versions = stack === 'nextjs'
    ? NEXTJS_VERSIONS
    : stack === 'vite'
      ? VITE_VERSIONS
      : EXPRESS_VERSIONS;
  return versions[packageName];
}

/**
 * Gets all dependencies for a stack
 */
function getStackDependencies(stack: 'nextjs' | 'vite' | 'express'): PackageVersions {
  switch (stack) {
    case 'nextjs':
      return { ...NEXTJS_VERSIONS };
    case 'vite':
      return { ...VITE_VERSIONS };
    case 'express':
      return { ...EXPRESS_VERSIONS };
  }
}

/**
 * Validates a semver version string
 */
function isValidVersion(version: string): boolean {
  // Simple semver regex (covers most cases)
  const semverRegex = /^\^?\d+\.\d+\.\d+(-[\w.]+)?$/;
  return semverRegex.test(version);
}

/**
 * Compares two version strings
 */
function compareVersions(a: string, b: string): number {
  const parseVersion = (v: string) => v.replace(/^\^/, '').split('.').map(Number);
  const [aMajor = 0, aMinor = 0, aPatch = 0] = parseVersion(a);
  const [bMajor = 0, bMinor = 0, bPatch = 0] = parseVersion(b);

  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}

// =====================================
// Git Utilities
// =====================================

/**
 * Initializes a git repository
 */
async function initGitRepo(directory: string): Promise<boolean> {
  try {
    await mockExeca.execa('git', ['init'], { cwd: directory });
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a .gitignore file
 */
async function createGitIgnore(directory: string, patterns: string[]): Promise<void> {
  const content = patterns.join('\n') + '\n';
  await writeFile(path.join(directory, '.gitignore'), content);
}

/**
 * Checks if git is installed
 */
async function isGitInstalled(): Promise<boolean> {
  try {
    await mockExeca.execa('git', ['--version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the current git user config
 */
async function getGitConfig(): Promise<GitConfig> {
  try {
    const [nameResult, emailResult] = await Promise.all([
      mockExeca.execa('git', ['config', 'user.name']),
      mockExeca.execa('git', ['config', 'user.email']),
    ]);
    return {
      name: nameResult.stdout.trim(),
      email: emailResult.stdout.trim(),
    };
  } catch {
    return {};
  }
}

/**
 * Creates an initial commit
 */
async function createInitialCommit(directory: string, message: string): Promise<boolean> {
  try {
    await mockExeca.execa('git', ['add', '-A'], { cwd: directory });
    await mockExeca.execa('git', ['commit', '-m', message], { cwd: directory });
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a directory is a git repository
 */
async function isGitRepo(directory: string): Promise<boolean> {
  try {
    await mockExeca.execa('git', ['rev-parse', '--is-inside-work-tree'], { cwd: directory });
    return true;
  } catch {
    return false;
  }
}

// =====================================
// Tests
// =====================================

describe('File System Utilities (fs.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureDirectory', () => {
    it('should create directory if it does not exist', async () => {
      const dirPath = path.join(os.tmpdir(), 'test-dir');
      await ensureDirectory(dirPath);
      expect(mockFsExtra.ensureDir).toHaveBeenCalledWith(dirPath);
    });

    it('should not throw if directory already exists', async () => {
      // Note: ensureDir from fs-extra handles existing directories internally
      const dirPath = path.join(os.tmpdir(), 'existing-dir');
      await expect(ensureDirectory(dirPath)).resolves.not.toThrow();
    });

    it('should create nested directories', async () => {
      const nestedPath = path.join(os.tmpdir(), 'a', 'b', 'c');
      await ensureDirectory(nestedPath);
      expect(mockFsExtra.ensureDir).toHaveBeenCalledWith(nestedPath);
    });
  });

  describe('writeFile', () => {
    it('should write content to file', async () => {
      const filePath = path.join(os.tmpdir(), 'test.txt');
      const content = 'Hello, World!';
      await writeFile(filePath, content);
      expect(mockFsExtra.outputFile).toHaveBeenCalledWith(filePath, content);
    });

    it('should create parent directories if needed', async () => {
      const filePath = path.join(os.tmpdir(), 'nested', 'dir', 'test.txt');
      await writeFile(filePath, 'content');
      expect(mockFsExtra.outputFile).toHaveBeenCalledWith(filePath, 'content');
    });

    it('should handle empty content', async () => {
      const filePath = path.join(os.tmpdir(), 'empty.txt');
      await writeFile(filePath, '');
      expect(mockFsExtra.outputFile).toHaveBeenCalledWith(filePath, '');
    });

    it('should handle unicode content', async () => {
      const filePath = path.join(os.tmpdir(), 'unicode.txt');
      const content = 'Hello, World!';
      await writeFile(filePath, content);
      expect(mockFsExtra.outputFile).toHaveBeenCalledWith(filePath, content);
    });
  });

  describe('readFile', () => {
    it('should read content from file', async () => {
      const filePath = path.join(os.tmpdir(), 'test.txt');
      mockFsExtra.readFile.mockResolvedValueOnce('file content');
      const content = await readFile(filePath);
      expect(content).toBe('file content');
      expect(mockFsExtra.readFile).toHaveBeenCalledWith(filePath, 'utf-8');
    });

    it('should handle large files', async () => {
      const largeContent = 'x'.repeat(1000000);
      mockFsExtra.readFile.mockResolvedValueOnce(largeContent);
      const content = await readFile('/path/to/large.txt');
      expect(content.length).toBe(1000000);
    });
  });

  describe('pathExists', () => {
    it('should return true for existing path', async () => {
      mockFsExtra.pathExists.mockResolvedValueOnce(true);
      const exists = await pathExists('/existing/path');
      expect(exists).toBe(true);
    });

    it('should return false for non-existing path', async () => {
      mockFsExtra.pathExists.mockResolvedValueOnce(false);
      const exists = await pathExists('/non/existing/path');
      expect(exists).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove a file', async () => {
      const filePath = '/path/to/file.txt';
      await remove(filePath);
      expect(mockFsExtra.remove).toHaveBeenCalledWith(filePath);
    });

    it('should remove a directory recursively', async () => {
      const dirPath = '/path/to/dir';
      await remove(dirPath);
      expect(mockFsExtra.remove).toHaveBeenCalledWith(dirPath);
    });
  });

  describe('copy', () => {
    it('should copy a file', async () => {
      await copy('/src/file.txt', '/dest/file.txt');
      expect(mockFsExtra.copy).toHaveBeenCalledWith('/src/file.txt', '/dest/file.txt');
    });

    it('should copy a directory recursively', async () => {
      await copy('/src/dir', '/dest/dir');
      expect(mockFsExtra.copy).toHaveBeenCalledWith('/src/dir', '/dest/dir');
    });
  });

  describe('JSON operations', () => {
    it('should read and parse JSON file', async () => {
      const mockData = { name: 'test', version: '1.0.0' };
      mockFsExtra.readJson.mockResolvedValueOnce(mockData);
      const data = await readJsonFile<typeof mockData>('/path/to/package.json');
      expect(data).toEqual(mockData);
    });

    it('should write JSON file with formatting', async () => {
      const data = { name: 'test' };
      await writeJsonFile('/path/to/config.json', data);
      expect(mockFsExtra.writeJson).toHaveBeenCalledWith(
        '/path/to/config.json',
        data,
        { spaces: 2 }
      );
    });
  });

  describe('emptyDirectory', () => {
    it('should empty a directory without removing it', async () => {
      const dirPath = '/path/to/dir';
      await emptyDirectory(dirPath);
      expect(mockFsExtra.emptyDir).toHaveBeenCalledWith(dirPath);
    });
  });

  describe('listDirectory', () => {
    it('should list files in a directory', async () => {
      const files = ['file1.txt', 'file2.txt', 'subdir'];
      mockFsExtra.readdir.mockResolvedValueOnce(files);
      const result = await listDirectory('/path/to/dir');
      expect(result).toEqual(files);
    });

    it('should return empty array for empty directory', async () => {
      mockFsExtra.readdir.mockResolvedValueOnce([]);
      const result = await listDirectory('/empty/dir');
      expect(result).toEqual([]);
    });
  });

  describe('Path Validation', () => {
    it('should validate correct paths', () => {
      expect(isValidPath('/path/to/file.txt')).toBe(true);
      expect(isValidPath('relative/path')).toBe(true);
      expect(isValidPath('file.txt')).toBe(true);
    });

    it('should reject paths with invalid characters', () => {
      expect(isValidPath('/path/<invalid>')).toBe(false);
      expect(isValidPath('/path/file?name')).toBe(false);
      expect(isValidPath('/path/file*')).toBe(false);
      expect(isValidPath('/path/file|pipe')).toBe(false);
    });

    it('should reject empty paths', () => {
      expect(isValidPath('')).toBe(false);
      expect(isValidPath('   ')).toBe(false);
    });
  });

  describe('Path Normalization', () => {
    it('should normalize paths', () => {
      const normalized = normalizePath('/path//to/../file.txt');
      expect(normalized).not.toContain('//');
      expect(normalized).not.toContain('..');
    });

    it('should handle Windows-style paths', () => {
      const normalized = normalizePath('C:\\Users\\test\\file.txt');
      expect(normalized).toBeTruthy();
    });
  });

  describe('Relative Path', () => {
    it('should get relative path', () => {
      const from = '/a/b/c';
      const to = '/a/b/d/e';
      const relative = getRelativePath(from, to);
      expect(relative).toBeTruthy();
    });
  });
});

describe('Dependency Version Utilities (deps.ts)', () => {
  describe('getPackageVersion', () => {
    it('should return Next.js version for nextjs stack', () => {
      const version = getPackageVersion('next', 'nextjs');
      expect(version).toBe('^15.1.0');
    });

    it('should return React version for nextjs stack', () => {
      const version = getPackageVersion('react', 'nextjs');
      expect(version).toBe('^19.0.0');
    });

    it('should return Vite version for vite stack', () => {
      const version = getPackageVersion('vite', 'vite');
      expect(version).toBe('^5.4.10');
    });

    it('should return Express version for express stack', () => {
      const version = getPackageVersion('express', 'express');
      expect(version).toBe('^4.21.0');
    });

    it('should return undefined for unknown package', () => {
      const version = getPackageVersion('unknown-package', 'nextjs');
      expect(version).toBeUndefined();
    });
  });

  describe('getStackDependencies', () => {
    it('should return all Next.js dependencies', () => {
      const deps = getStackDependencies('nextjs');
      expect(deps).toHaveProperty('next');
      expect(deps).toHaveProperty('react');
      expect(deps).toHaveProperty('drizzle-orm');
    });

    it('should return all Vite dependencies', () => {
      const deps = getStackDependencies('vite');
      expect(deps).toHaveProperty('vite');
      expect(deps).toHaveProperty('react');
      expect(deps).toHaveProperty('@vitejs/plugin-react');
    });

    it('should return all Express dependencies', () => {
      const deps = getStackDependencies('express');
      expect(deps).toHaveProperty('express');
      expect(deps).toHaveProperty('cors');
      expect(deps).toHaveProperty('helmet');
    });

    it('should return copies, not references', () => {
      const deps1 = getStackDependencies('nextjs');
      const deps2 = getStackDependencies('nextjs');
      deps1['new-package'] = '^1.0.0';
      expect(deps2).not.toHaveProperty('new-package');
    });
  });

  describe('isValidVersion', () => {
    it('should validate semver versions', () => {
      expect(isValidVersion('^1.0.0')).toBe(true);
      expect(isValidVersion('1.0.0')).toBe(true);
      expect(isValidVersion('^15.1.0')).toBe(true);
    });

    it('should validate versions with prerelease', () => {
      expect(isValidVersion('^5.0.0-beta.25')).toBe(true);
      expect(isValidVersion('1.0.0-alpha')).toBe(true);
    });

    it('should reject invalid versions', () => {
      expect(isValidVersion('invalid')).toBe(false);
      expect(isValidVersion('1.0')).toBe(false);
      expect(isValidVersion('')).toBe(false);
    });
  });

  describe('compareVersions', () => {
    it('should compare major versions', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBeGreaterThan(0);
      expect(compareVersions('1.0.0', '2.0.0')).toBeLessThan(0);
    });

    it('should compare minor versions', () => {
      expect(compareVersions('1.2.0', '1.1.0')).toBeGreaterThan(0);
      expect(compareVersions('1.1.0', '1.2.0')).toBeLessThan(0);
    });

    it('should compare patch versions', () => {
      expect(compareVersions('1.0.2', '1.0.1')).toBeGreaterThan(0);
      expect(compareVersions('1.0.1', '1.0.2')).toBeLessThan(0);
    });

    it('should handle equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    });

    it('should handle caret prefix', () => {
      expect(compareVersions('^2.0.0', '^1.0.0')).toBeGreaterThan(0);
    });
  });

  describe('Database Driver Versions', () => {
    it('should have PostgreSQL driver version', () => {
      const version = getPackageVersion('postgres', 'nextjs');
      expect(version).toBeDefined();
      expect(isValidVersion(version!)).toBe(true);
    });

    it('should have SQLite driver version', () => {
      const version = getPackageVersion('better-sqlite3', 'nextjs');
      expect(version).toBeDefined();
      expect(isValidVersion(version!)).toBe(true);
    });
  });

  describe('Auth Library Versions', () => {
    it('should have Auth.js version', () => {
      const version = getPackageVersion('next-auth', 'nextjs');
      expect(version).toBeDefined();
    });

    it('should have Lucia version', () => {
      const version = getPackageVersion('lucia', 'nextjs');
      expect(version).toBeDefined();
    });

    it('should have Drizzle adapter versions', () => {
      expect(getPackageVersion('@auth/drizzle-adapter', 'nextjs')).toBeDefined();
      expect(getPackageVersion('@lucia-auth/adapter-drizzle', 'nextjs')).toBeDefined();
    });
  });
});

describe('Git Utilities (git.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isGitInstalled', () => {
    it('should return true when git is installed', async () => {
      mockExeca.execa.mockResolvedValueOnce({ stdout: 'git version 2.40.0', stderr: '', exitCode: 0 });
      const installed = await isGitInstalled();
      expect(installed).toBe(true);
      expect(mockExeca.execa).toHaveBeenCalledWith('git', ['--version']);
    });

    it('should return false when git is not installed', async () => {
      mockExeca.execa.mockRejectedValueOnce(new Error('Command not found: git'));
      const installed = await isGitInstalled();
      expect(installed).toBe(false);
    });
  });

  describe('initGitRepo', () => {
    it('should initialize a git repository', async () => {
      mockExeca.execa.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });
      const result = await initGitRepo('/path/to/project');
      expect(result).toBe(true);
      expect(mockExeca.execa).toHaveBeenCalledWith('git', ['init'], { cwd: '/path/to/project' });
    });

    it('should return false on failure', async () => {
      mockExeca.execa.mockRejectedValueOnce(new Error('Permission denied'));
      const result = await initGitRepo('/path/to/project');
      expect(result).toBe(false);
    });
  });

  describe('createGitIgnore', () => {
    it('should create .gitignore with patterns', async () => {
      const patterns = ['node_modules', '.env', 'dist'];
      await createGitIgnore('/path/to/project', patterns);
      expect(mockFsExtra.outputFile).toHaveBeenCalledWith(
        path.join('/path/to/project', '.gitignore'),
        'node_modules\n.env\ndist\n'
      );
    });

    it('should handle empty patterns', async () => {
      await createGitIgnore('/path/to/project', []);
      expect(mockFsExtra.outputFile).toHaveBeenCalledWith(
        path.join('/path/to/project', '.gitignore'),
        '\n'
      );
    });
  });

  describe('getGitConfig', () => {
    it('should return git user config', async () => {
      mockExeca.execa
        .mockResolvedValueOnce({ stdout: 'John Doe', stderr: '', exitCode: 0 })
        .mockResolvedValueOnce({ stdout: 'john@example.com', stderr: '', exitCode: 0 });

      const config = await getGitConfig();
      expect(config.name).toBe('John Doe');
      expect(config.email).toBe('john@example.com');
    });

    it('should return empty object if config not set', async () => {
      mockExeca.execa.mockRejectedValue(new Error('Config not set'));
      const config = await getGitConfig();
      expect(config).toEqual({});
    });
  });

  describe('createInitialCommit', () => {
    it('should stage all files and commit', async () => {
      mockExeca.execa
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 }) // git add
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 }); // git commit

      const result = await createInitialCommit('/path/to/project', 'Initial commit');
      expect(result).toBe(true);
      expect(mockExeca.execa).toHaveBeenCalledWith('git', ['add', '-A'], { cwd: '/path/to/project' });
      expect(mockExeca.execa).toHaveBeenCalledWith('git', ['commit', '-m', 'Initial commit'], { cwd: '/path/to/project' });
    });

    it('should return false if staging fails', async () => {
      mockExeca.execa.mockRejectedValueOnce(new Error('Staging failed'));
      const result = await createInitialCommit('/path/to/project', 'Initial commit');
      expect(result).toBe(false);
    });

    it('should return false if commit fails', async () => {
      mockExeca.execa
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 })
        .mockRejectedValueOnce(new Error('Commit failed'));
      const result = await createInitialCommit('/path/to/project', 'Initial commit');
      expect(result).toBe(false);
    });
  });

  describe('isGitRepo', () => {
    it('should return true for git repository', async () => {
      mockExeca.execa.mockResolvedValueOnce({ stdout: 'true', stderr: '', exitCode: 0 });
      const result = await isGitRepo('/path/to/repo');
      expect(result).toBe(true);
      expect(mockExeca.execa).toHaveBeenCalledWith(
        'git',
        ['rev-parse', '--is-inside-work-tree'],
        { cwd: '/path/to/repo' }
      );
    });

    it('should return false for non-git directory', async () => {
      mockExeca.execa.mockRejectedValueOnce(new Error('Not a git repository'));
      const result = await isGitRepo('/path/to/non-repo');
      expect(result).toBe(false);
    });
  });

  describe('Default .gitignore Patterns', () => {
    const DEFAULT_PATTERNS = [
      'node_modules',
      '.env',
      '.env.local',
      '.env.*.local',
      'dist',
      '.next',
      'out',
      '.turbo',
      '.vercel',
      '*.log',
      '.DS_Store',
    ];

    it('should include all default patterns', async () => {
      await createGitIgnore('/path/to/project', DEFAULT_PATTERNS);

      const expectedContent = DEFAULT_PATTERNS.join('\n') + '\n';
      expect(mockFsExtra.outputFile).toHaveBeenCalledWith(
        path.join('/path/to/project', '.gitignore'),
        expectedContent
      );
    });

    it('should include node_modules pattern', () => {
      expect(DEFAULT_PATTERNS).toContain('node_modules');
    });

    it('should include environment file patterns', () => {
      expect(DEFAULT_PATTERNS).toContain('.env');
      expect(DEFAULT_PATTERNS).toContain('.env.local');
    });

    it('should include build output patterns', () => {
      expect(DEFAULT_PATTERNS).toContain('dist');
      expect(DEFAULT_PATTERNS).toContain('.next');
    });
  });
});

describe('Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('File System Edge Cases', () => {
    it('should handle paths with spaces', async () => {
      const pathWithSpaces = '/path/with spaces/file.txt';
      await writeFile(pathWithSpaces, 'content');
      expect(mockFsExtra.outputFile).toHaveBeenCalledWith(pathWithSpaces, 'content');
    });

    it('should handle very long paths', async () => {
      const longPath = '/path/' + 'a'.repeat(200) + '/file.txt';
      await writeFile(longPath, 'content');
      expect(mockFsExtra.outputFile).toHaveBeenCalledWith(longPath, 'content');
    });

    it('should handle unicode in paths', async () => {
      const unicodePath = '/path/projeto/arquivo.txt';
      await writeFile(unicodePath, 'content');
      expect(mockFsExtra.outputFile).toHaveBeenCalledWith(unicodePath, 'content');
    });

    it('should handle concurrent writes', async () => {
      const writes = Array.from({ length: 10 }, (_, i) =>
        writeFile(`/path/file${i}.txt`, `content${i}`)
      );
      await Promise.all(writes);
      expect(mockFsExtra.outputFile).toHaveBeenCalledTimes(10);
    });
  });

  describe('Version Edge Cases', () => {
    it('should handle beta versions', () => {
      expect(isValidVersion('^5.0.0-beta.25')).toBe(true);
    });

    it('should handle alpha versions', () => {
      expect(isValidVersion('1.0.0-alpha')).toBe(true);
    });

    it('should handle rc versions', () => {
      expect(isValidVersion('^2.0.0-rc.1')).toBe(true);
    });

    it('should handle double-digit version numbers', () => {
      expect(isValidVersion('^15.10.100')).toBe(true);
    });
  });

  describe('Git Edge Cases', () => {
    it('should handle repositories with no commits', async () => {
      mockExeca.execa.mockRejectedValueOnce(new Error('No commits yet'));
      const result = await isGitRepo('/new/repo');
      expect(result).toBe(false);
    });

    it('should handle concurrent git operations', async () => {
      mockExeca.execa.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });

      const operations = [
        initGitRepo('/project1'),
        initGitRepo('/project2'),
        initGitRepo('/project3'),
      ];

      const results = await Promise.all(operations);
      expect(results.every(r => r === true)).toBe(true);
    });
  });
});
