/**
 * Test Setup File
 *
 * This file runs before all tests and sets up the test environment.
 * It configures mocks, global utilities, and cleanup routines.
 */

import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';

// =====================================
// Global Test Configuration
// =====================================

/**
 * Test timeout for slow operations
 */
export const TEST_TIMEOUT = 30000;

/**
 * Base directory for test fixtures
 */
export const FIXTURES_DIR = path.join(__dirname, 'fixtures');

/**
 * Templates directory
 */
export const TEMPLATES_DIR = path.join(__dirname, '..', 'src', 'templates');

/**
 * Temporary directory for test outputs
 */
export const TEMP_DIR = path.join(os.tmpdir(), 'stackgen-tests');

// =====================================
// Global Setup
// =====================================

beforeAll(() => {
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Silence console during tests (optional, can be removed for debugging)
  // vi.spyOn(console, 'log').mockImplementation(() => {});
  // vi.spyOn(console, 'error').mockImplementation(() => {});
  // vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  // Clean up temp directory after all tests
  try {
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  } catch {
    // Ignore cleanup errors
  }
});

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks();
});

// =====================================
// Global Test Utilities
// =====================================

/**
 * Creates a unique temporary directory for a test
 */
export function createTempDir(testName: string): string {
  const uniqueName = `${testName}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const dirPath = path.join(TEMP_DIR, uniqueName);
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

/**
 * Cleans up a temporary directory
 */
export function cleanupTempDir(dirPath: string): void {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Reads a file from the test fixtures directory
 */
export function readFixture(fixturePath: string): string {
  const fullPath = path.join(FIXTURES_DIR, fixturePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Checks if a fixture file exists
 */
export function fixtureExists(fixturePath: string): boolean {
  const fullPath = path.join(FIXTURES_DIR, fixturePath);
  return fs.existsSync(fullPath);
}

/**
 * Waits for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normalizes line endings for cross-platform comparison
 */
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

/**
 * Removes whitespace-only lines for comparison
 */
export function removeEmptyLines(text: string): string {
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .join('\n');
}

// =====================================
// Mock Factories
// =====================================

/**
 * Creates a mock file system for testing
 */
export function createMockFileSystem(): Record<string, string> {
  return {};
}

/**
 * Creates a mock logger for testing
 */
export function createMockLogger() {
  return {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

/**
 * Creates a mock spinner for testing
 */
export function createMockSpinner() {
  return {
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    text: '',
    message: vi.fn().mockReturnThis(),
  };
}

/**
 * Creates a mock for @clack/prompts
 */
export function createMockPrompts() {
  return {
    intro: vi.fn(),
    outro: vi.fn(),
    text: vi.fn(),
    select: vi.fn(),
    confirm: vi.fn(),
    spinner: vi.fn(() => createMockSpinner()),
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
}

// =====================================
// Test Data Factories
// =====================================

/**
 * Default configuration for Next.js projects
 */
export const DEFAULT_NEXTJS_CONFIG = {
  projectName: 'test-project',
  frontend: 'nextjs' as const,
  database: 'postgresql' as const,
  authType: 'authjs' as const,
  deployment: 'docker' as const,
};

/**
 * Default configuration for Vite projects
 */
export const DEFAULT_VITE_CONFIG = {
  projectName: 'test-project',
  frontend: 'vite' as const,
  database: 'postgresql' as const,
  authType: 'lucia' as const,
  deployment: 'docker' as const,
};

/**
 * All possible configuration combinations
 */
export const ALL_CONFIGURATIONS = [
  { database: 'postgresql', authType: 'authjs', deployment: 'docker' },
  { database: 'postgresql', authType: 'authjs', deployment: 'vercel' },
  { database: 'postgresql', authType: 'lucia', deployment: 'docker' },
  { database: 'postgresql', authType: 'lucia', deployment: 'vercel' },
  { database: 'sqlite', authType: 'authjs', deployment: 'docker' },
  { database: 'sqlite', authType: 'authjs', deployment: 'vercel' },
  { database: 'sqlite', authType: 'lucia', deployment: 'docker' },
  { database: 'sqlite', authType: 'lucia', deployment: 'vercel' },
] as const;

// =====================================
// Assertion Helpers
// =====================================

/**
 * Checks if a string is valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if code has balanced braces
 */
export function hasBalancedBraces(code: string): boolean {
  const open = (code.match(/\{/g) || []).length;
  const close = (code.match(/\}/g) || []).length;
  return open === close;
}

/**
 * Checks if code has balanced parentheses
 */
export function hasBalancedParens(code: string): boolean {
  const open = (code.match(/\(/g) || []).length;
  const close = (code.match(/\)/g) || []).length;
  return open === close;
}

/**
 * Checks if code has no orphaned EJS tags
 */
export function hasNoOrphanedEjsTags(code: string): boolean {
  return !code.includes('<%') && !code.includes('%>');
}

// =====================================
// TypeScript Declaration
// =====================================

// Declare vitest global types
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Vi {
    interface JestAssertion<T = unknown> {
      toBeValidJson(): T;
      toHaveBalancedBraces(): T;
      toHaveNoOrphanedEjsTags(): T;
    }
  }
}

// =====================================
// Export Everything
// =====================================

export { vi } from 'vitest';
