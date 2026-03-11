/**
 * Utility Module Exports for stackgen CLI
 *
 * Central export point for all utility functions and types.
 *
 * @module utils
 */

// =============================================================================
// FILE SYSTEM UTILITIES
// =============================================================================

export {
  // Functions
  writeFile,
  copyTemplate,
  ensureDir,
  fileExists,
  readTemplate,
  copyDir,
  remove,
  readJson,
  writeJson,
  // Types
  type FSResult,
  type FSSuccess,
  type FSFailure,
  type TemplateData,
  type WriteFileOptions,
  type CopyTemplateOptions,
} from './fs.js';

// =============================================================================
// GIT UTILITIES
// =============================================================================

export {
  // Functions
  isGitInstalled,
  initGit,
  createInitialCommit,
  initGitWithCommit,
  isGitRepository,
  addGitignore,
  getCurrentBranch,
  // Types
  type GitResult,
  type GitSuccess,
  type GitFailure,
  type GitInitOptions,
  type CommitOptions,
  type GitCommandResult,
} from './git.js';

// =============================================================================
// DEPENDENCY UTILITIES
// =============================================================================

export {
  // Dependency maps
  DEPENDENCIES,
  ALL_DEPS,
  FRONTEND_DEPS,
  BACKEND_DEPS,
  DATABASE_DEPS,
  AUTH_DEPS,
  TOOLING_DEPS,
  TESTING_DEPS,
  STYLING_DEPS,
  // Helper functions
  getDep,
  getDepVersion,
  getDevDep,
  getDepsByCategory,
  getDepsObject,
  getProdDepsObject,
  getDevDepsObject,
  separateDeps,
  getPeerDeps,
  getWithPeers,
  // Preset stacks
  NEXTJS_STACK,
  VITE_REACT_STACK,
  EXPRESS_API_STACK,
  DRIZZLE_POSTGRES_STACK,
  DRIZZLE_SQLITE_STACK,
  AUTHJS_STACK,
  LUCIA_STACK,
  TESTING_STACK,
  GIT_HOOKS_STACK,
  // Types
  type DependencySpec,
  type DependencyCategory,
  type DependencyMap,
  type CategorizedDependencies,
} from './deps.js';
