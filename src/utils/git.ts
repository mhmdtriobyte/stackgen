/**
 * Git Initialization Utilities for stackgen CLI
 *
 * Provides git operations for initializing repositories
 * in generated projects. Handles graceful fallback when
 * git is not installed.
 *
 * @module utils/git
 */

import { execa, type ExecaError } from 'execa';
import path from 'node:path';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result type for git operations
 * Provides explicit success/failure handling
 */
export type GitResult<T> = GitSuccess<T> | GitFailure;

export interface GitSuccess<T> {
  success: true;
  data: T;
}

export interface GitFailure {
  success: false;
  error: string;
  code?: string;
  /** Indicates git is not installed */
  gitNotInstalled?: boolean;
}

/**
 * Options for git initialization
 */
export interface GitInitOptions {
  /** Initial branch name (default: 'main') */
  defaultBranch?: string;
  /** Skip creating initial commit */
  skipCommit?: boolean;
}

/**
 * Options for creating a commit
 */
export interface CommitOptions {
  /** Commit message */
  message?: string;
  /** Author name (uses git config if not provided) */
  authorName?: string;
  /** Author email (uses git config if not provided) */
  authorEmail?: string;
}

/**
 * Result of a git command execution
 */
export interface GitCommandResult {
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Exit code */
  exitCode: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_BRANCH = 'main';
const DEFAULT_COMMIT_MESSAGE = 'Initial commit from stackgen';
const GIT_NOT_FOUND_CODES = ['ENOENT', 'EACCES'];

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Normalizes the project path for cross-platform compatibility
 */
function normalizePath(projectPath: string): string {
  return path.resolve(projectPath.replace(/\\/g, '/'));
}

/**
 * Creates a success result
 */
function success<T>(data: T): GitSuccess<T> {
  return { success: true, data };
}

/**
 * Creates a failure result from an error
 */
function failure(error: unknown, gitNotInstalled = false): GitFailure {
  if (error instanceof Error) {
    const execaError = error as ExecaError;
    return {
      success: false,
      error: error.message,
      code: execaError.code,
      gitNotInstalled,
    };
  }
  return {
    success: false,
    error: String(error),
    gitNotInstalled,
  };
}

/**
 * Checks if an error indicates git is not installed
 */
function isGitNotInstalledError(error: unknown): boolean {
  if (error instanceof Error) {
    const execaError = error as ExecaError;

    // Check for common "command not found" error codes
    if (execaError.code && GIT_NOT_FOUND_CODES.includes(execaError.code)) {
      return true;
    }

    // Check error message for common patterns
    const message = error.message.toLowerCase();
    if (
      message.includes('not found') ||
      message.includes('not recognized') ||
      message.includes('enoent')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Runs a git command in the specified directory
 */
async function runGitCommand(
  args: string[],
  cwd: string
): Promise<GitResult<GitCommandResult>> {
  try {
    const result = await execa('git', args, {
      cwd,
      // Don't throw on non-zero exit codes
      reject: false,
      // Capture output
      stdout: 'pipe',
      stderr: 'pipe',
    });

    if (result.exitCode !== 0) {
      return failure(
        new Error(`Git command failed: git ${args.join(' ')}\n${result.stderr}`)
      );
    }

    return success({
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    });
  } catch (error) {
    const gitNotInstalled = isGitNotInstalledError(error);
    return failure(error, gitNotInstalled);
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Checks if git is installed and available
 *
 * @returns Result indicating if git is available
 *
 * @example
 * ```typescript
 * const result = await isGitInstalled();
 * if (result.success && result.data.installed) {
 *   console.log(`Git version: ${result.data.version}`);
 * }
 * ```
 */
export async function isGitInstalled(): Promise<
  GitResult<{ installed: boolean; version?: string }>
> {
  try {
    const result = await execa('git', ['--version'], {
      reject: false,
      stdout: 'pipe',
      stderr: 'pipe',
    });

    if (result.exitCode === 0) {
      // Parse version from output like "git version 2.39.0"
      const versionMatch = result.stdout.match(/git version ([\d.]+)/);
      return success({
        installed: true,
        version: versionMatch ? versionMatch[1] : undefined,
      });
    }

    return success({ installed: false });
  } catch (error) {
    if (isGitNotInstalledError(error)) {
      return success({ installed: false });
    }
    return failure(error);
  }
}

/**
 * Initializes a new git repository in the specified directory
 *
 * @param projectPath - Path to the project directory
 * @param options - Initialization options
 * @returns Result indicating success or failure
 *
 * @example
 * ```typescript
 * const result = await initGit('/path/to/project');
 * if (result.success) {
 *   console.log('Git repository initialized');
 * } else if (result.gitNotInstalled) {
 *   console.log('Git is not installed, skipping initialization');
 * }
 * ```
 */
export async function initGit(
  projectPath: string,
  options: GitInitOptions = {}
): Promise<GitResult<{ path: string; branch: string }>> {
  const { defaultBranch = DEFAULT_BRANCH, skipCommit = false } = options;

  const normalizedPath = normalizePath(projectPath);

  // Check if git is installed first
  const gitCheck = await isGitInstalled();
  if (!gitCheck.success) {
    return gitCheck;
  }
  if (!gitCheck.data.installed) {
    return {
      success: false,
      error: 'Git is not installed. Please install git to initialize a repository.',
      gitNotInstalled: true,
    };
  }

  // Initialize the repository with the specified default branch
  const initResult = await runGitCommand(
    ['init', '--initial-branch', defaultBranch],
    normalizedPath
  );

  if (!initResult.success) {
    // Try without --initial-branch for older git versions
    const fallbackResult = await runGitCommand(['init'], normalizedPath);
    if (!fallbackResult.success) {
      return fallbackResult;
    }

    // Try to rename branch to the default branch name
    await runGitCommand(
      ['branch', '-m', defaultBranch],
      normalizedPath
    );
  }

  // If skipCommit is not set, we just return the init success
  // The caller should use createInitialCommit separately
  if (!skipCommit) {
    return success({ path: normalizedPath, branch: defaultBranch });
  }

  return success({ path: normalizedPath, branch: defaultBranch });
}

/**
 * Creates an initial commit with all files in the repository
 *
 * @param projectPath - Path to the project directory
 * @param options - Commit options
 * @returns Result indicating success or failure
 *
 * @example
 * ```typescript
 * const result = await createInitialCommit('/path/to/project', {
 *   message: 'Initial commit from stackgen'
 * });
 * if (result.success) {
 *   console.log(`Created commit: ${result.data.commitHash}`);
 * }
 * ```
 */
export async function createInitialCommit(
  projectPath: string,
  options: CommitOptions = {}
): Promise<GitResult<{ commitHash: string; message: string }>> {
  const { message = DEFAULT_COMMIT_MESSAGE, authorName, authorEmail } = options;

  const normalizedPath = normalizePath(projectPath);

  // Check if git is installed
  const gitCheck = await isGitInstalled();
  if (!gitCheck.success) {
    return gitCheck;
  }
  if (!gitCheck.data.installed) {
    return {
      success: false,
      error: 'Git is not installed. Please install git to create commits.',
      gitNotInstalled: true,
    };
  }

  // Stage all files
  const addResult = await runGitCommand(['add', '-A'], normalizedPath);
  if (!addResult.success) {
    return addResult;
  }

  // Check if there are any changes to commit
  const statusResult = await runGitCommand(
    ['status', '--porcelain'],
    normalizedPath
  );
  if (!statusResult.success) {
    return statusResult;
  }

  if (!statusResult.data.stdout.trim()) {
    return failure(new Error('No changes to commit'));
  }

  // Build commit arguments
  const commitArgs = ['commit', '-m', message];

  // Add author if specified
  if (authorName && authorEmail) {
    commitArgs.push('--author', `${authorName} <${authorEmail}>`);
  }

  // Create the commit
  const commitResult = await runGitCommand(commitArgs, normalizedPath);
  if (!commitResult.success) {
    return commitResult;
  }

  // Get the commit hash
  const hashResult = await runGitCommand(
    ['rev-parse', '--short', 'HEAD'],
    normalizedPath
  );

  const commitHash = hashResult.success
    ? hashResult.data.stdout.trim()
    : 'unknown';

  return success({ commitHash, message });
}

/**
 * Initializes git and creates an initial commit in one operation
 *
 * @param projectPath - Path to the project directory
 * @param options - Combined init and commit options
 * @returns Result indicating success or failure
 *
 * @example
 * ```typescript
 * const result = await initGitWithCommit('/path/to/project');
 * if (result.success) {
 *   console.log(`Repository initialized with commit ${result.data.commitHash}`);
 * } else if (result.gitNotInstalled) {
 *   console.log('Skipped git initialization (git not installed)');
 * }
 * ```
 */
export async function initGitWithCommit(
  projectPath: string,
  options: GitInitOptions & CommitOptions = {}
): Promise<
  GitResult<{ path: string; branch: string; commitHash: string; message: string }>
> {
  const { defaultBranch, skipCommit, ...commitOptions } = options;

  // Initialize repository
  const initResult = await initGit(projectPath, {
    defaultBranch,
    skipCommit: true,
  });

  if (!initResult.success) {
    return initResult;
  }

  // Create initial commit
  const commitResult = await createInitialCommit(projectPath, commitOptions);

  if (!commitResult.success) {
    // Return partial success - repo is initialized but commit failed
    if (commitResult.gitNotInstalled) {
      return commitResult;
    }
    return {
      success: false,
      error: `Repository initialized but commit failed: ${commitResult.error}`,
      code: commitResult.code,
    };
  }

  return success({
    path: initResult.data.path,
    branch: initResult.data.branch,
    commitHash: commitResult.data.commitHash,
    message: commitResult.data.message,
  });
}

/**
 * Checks if a directory is already a git repository
 *
 * @param dirPath - Directory path to check
 * @returns Result indicating if directory is a git repo
 */
export async function isGitRepository(
  dirPath: string
): Promise<GitResult<{ isRepo: boolean; rootPath?: string }>> {
  const normalizedPath = normalizePath(dirPath);

  const result = await runGitCommand(
    ['rev-parse', '--show-toplevel'],
    normalizedPath
  );

  if (!result.success) {
    // Not a git repository
    if (result.gitNotInstalled) {
      return result;
    }
    return success({ isRepo: false });
  }

  return success({
    isRepo: true,
    rootPath: result.data.stdout.trim(),
  });
}

/**
 * Adds a .gitignore file to the repository
 *
 * @param projectPath - Path to the project directory
 * @param patterns - Patterns to add to .gitignore
 * @returns Result indicating success or failure
 */
export async function addGitignore(
  projectPath: string,
  patterns: string[]
): Promise<GitResult<{ path: string }>> {
  const normalizedPath = normalizePath(projectPath);
  const gitignorePath = path.join(normalizedPath, '.gitignore');

  try {
    const { writeFile } = await import('node:fs/promises');
    const content = patterns.join('\n') + '\n';
    await writeFile(gitignorePath, content, 'utf-8');
    return success({ path: gitignorePath });
  } catch (error) {
    return failure(error);
  }
}

/**
 * Gets the current branch name
 *
 * @param projectPath - Path to the project directory
 * @returns Result with current branch name
 */
export async function getCurrentBranch(
  projectPath: string
): Promise<GitResult<{ branch: string }>> {
  const normalizedPath = normalizePath(projectPath);

  const result = await runGitCommand(
    ['rev-parse', '--abbrev-ref', 'HEAD'],
    normalizedPath
  );

  if (!result.success) {
    return result;
  }

  return success({ branch: result.data.stdout.trim() });
}
