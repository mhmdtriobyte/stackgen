/**
 * CLI Module Exports
 *
 * This module re-exports all CLI-related functionality for convenient imports.
 */

// Argument parsing
export { parseArgs, hasProvidedOptions, getProvidedOptionsSummary } from './args.js';

// Interactive prompts
export {
  collectOptions,
  collectOptionsNonInteractive,
  showIntro,
  showOutro,
  showError,
  showWarning,
  showSuccess,
  showInfo,
  showNonInteractiveSummary,
  createSpinner,
} from './prompts.js';

// Types
export type {
  CLIArgs,
  ProjectOptions,
  FrontendFramework,
  BackendFramework,
  DatabaseOption,
  AuthOption,
  DeploymentTarget,
  ExtrasConfig,
  ValidationResult,
} from './types.js';

// Utilities
export { DEFAULT_OPTIONS, validateProjectName, deriveBackend } from './types.js';
