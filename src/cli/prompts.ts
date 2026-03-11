/**
 * Interactive Prompts Module
 *
 * This module provides a beautiful interactive CLI experience using @clack/prompts.
 * It handles all user input collection with validation, cancellation handling,
 * and a polished visual presentation.
 */

import * as p from '@clack/prompts';
import chalk from 'chalk';
import type {
  CLIArgs,
  ProjectOptions,
  FrontendFramework,
  DatabaseOption,
  AuthOption,
  DeploymentTarget,
  ExtrasConfig,
} from './types.js';
import { DEFAULT_OPTIONS, validateProjectName, deriveBackend } from './types.js';

/**
 * ASCII art logo for the CLI intro
 */
const LOGO = `
  ███████╗████████╗ █████╗  ██████╗██╗  ██╗ ██████╗ ███████╗███╗   ██╗
  ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝██╔════╝ ██╔════╝████╗  ██║
  ███████╗   ██║   ███████║██║     █████╔╝ ██║  ███╗█████╗  ██╔██╗ ██║
  ╚════██║   ██║   ██╔══██║██║     ██╔═██╗ ██║   ██║██╔══╝  ██║╚██╗██║
  ███████║   ██║   ██║  ██║╚██████╗██║  ██╗╚██████╔╝███████╗██║ ╚████║
  ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝
`;

/**
 * Checks if the user cancelled the prompt
 * Exits gracefully with a friendly message
 *
 * @param value - The value returned from a prompt
 */
function handleCancel(value: unknown): asserts value is Exclude<typeof value, symbol> {
  if (p.isCancel(value)) {
    p.cancel('Operation cancelled. Goodbye!');
    process.exit(0);
  }
}

/**
 * Displays the intro banner with styled logo and welcome message
 */
export function showIntro(): void {
  console.log(chalk.cyan(LOGO));
  p.intro(chalk.bgCyan.black(' Welcome to stackgen - Full-Stack TypeScript Generator '));
}

/**
 * Displays the outro message after successful generation
 *
 * @param projectName - Name of the generated project
 */
export function showOutro(projectName: string): void {
  p.outro(chalk.green(`Project "${projectName}" created successfully!`));

  console.log();
  console.log(chalk.dim('  Next steps:'));
  console.log();
  console.log(`    ${chalk.cyan('cd')} ${projectName}`);
  console.log(`    ${chalk.cyan('npm')} install`);
  console.log(`    ${chalk.cyan('npm')} run dev`);
  console.log();
  console.log(chalk.dim('  Documentation: https://github.com/stackgen/stackgen'));
  console.log();
}

/**
 * Prompts for the project name with validation
 *
 * @param defaultValue - Optional default value
 * @returns Validated project name
 */
async function promptProjectName(defaultValue?: string): Promise<string> {
  const textOptions: Parameters<typeof p.text>[0] = {
    message: 'What is your project name?',
    placeholder: 'my-awesome-app',
    validate: (value) => {
      const result = validateProjectName(value);
      if (!result.valid) {
        return result.message;
      }
      return undefined;
    },
  };

  if (defaultValue !== undefined) {
    textOptions.defaultValue = defaultValue;
  }

  const name = await p.text(textOptions);

  handleCancel(name);
  return name as string;
}

/**
 * Prompts for frontend framework selection
 *
 * @param defaultValue - Optional default value
 * @returns Selected frontend framework
 */
async function promptFrontend(defaultValue?: FrontendFramework): Promise<FrontendFramework> {
  const frontend = await p.select({
    message: 'Which frontend framework would you like to use?',
    initialValue: defaultValue ?? 'nextjs',
    options: [
      {
        value: 'nextjs',
        label: 'Next.js 15',
        hint: 'Full-stack React framework with App Router',
      },
      {
        value: 'vite',
        label: 'Vite + React',
        hint: 'Lightning-fast frontend with Express backend',
      },
    ],
  });

  handleCancel(frontend);
  return frontend as FrontendFramework;
}

/**
 * Prompts for database selection
 *
 * @param defaultValue - Optional default value
 * @returns Selected database option
 */
async function promptDatabase(defaultValue?: DatabaseOption): Promise<DatabaseOption> {
  const database = await p.select({
    message: 'Which database would you like to use?',
    initialValue: defaultValue ?? 'postgresql',
    options: [
      {
        value: 'postgresql',
        label: 'PostgreSQL',
        hint: 'Powerful, production-ready relational database',
      },
      {
        value: 'sqlite',
        label: 'SQLite',
        hint: 'Simple, file-based database for development',
      },
    ],
  });

  handleCancel(database);
  return database as DatabaseOption;
}

/**
 * Prompts for authentication solution selection
 *
 * @param defaultValue - Optional default value
 * @returns Selected auth option
 */
async function promptAuth(defaultValue?: AuthOption): Promise<AuthOption> {
  const auth = await p.select({
    message: 'Which authentication solution would you like to use?',
    initialValue: defaultValue ?? 'authjs',
    options: [
      {
        value: 'authjs',
        label: 'Auth.js (NextAuth)',
        hint: 'Full-featured auth with OAuth providers',
      },
      {
        value: 'lucia',
        label: 'Lucia',
        hint: 'Lightweight, session-based authentication',
      },
    ],
  });

  handleCancel(auth);
  return auth as AuthOption;
}

/**
 * Prompts for deployment target selection
 *
 * @param defaultValue - Optional default value
 * @returns Selected deployment target
 */
async function promptDeployment(defaultValue?: DeploymentTarget): Promise<DeploymentTarget> {
  const deployment = await p.select({
    message: 'Which deployment target would you like to configure?',
    initialValue: defaultValue ?? 'docker',
    options: [
      {
        value: 'docker',
        label: 'Docker',
        hint: 'Containerized deployment with Docker Compose',
      },
      {
        value: 'vercel',
        label: 'Vercel',
        hint: 'Optimized for Vercel serverless deployment',
      },
    ],
  });

  handleCancel(deployment);
  return deployment as DeploymentTarget;
}

/**
 * Prompts for extra tooling configuration
 *
 * @returns Selected extras configuration
 */
async function promptExtras(): Promise<ExtrasConfig> {
  const extras = await p.multiselect({
    message: 'Which additional tools would you like to include?',
    initialValues: ['eslint', 'prettier', 'husky', 'githubActions'],
    options: [
      {
        value: 'eslint',
        label: 'ESLint',
        hint: 'Code linting and style enforcement',
      },
      {
        value: 'prettier',
        label: 'Prettier',
        hint: 'Automatic code formatting',
      },
      {
        value: 'husky',
        label: 'Husky',
        hint: 'Git hooks for pre-commit checks',
      },
      {
        value: 'githubActions',
        label: 'GitHub Actions',
        hint: 'CI/CD workflows for testing and deployment',
      },
    ],
    required: false,
  });

  handleCancel(extras);

  const selected = extras as string[];
  return {
    eslint: selected.includes('eslint'),
    prettier: selected.includes('prettier'),
    husky: selected.includes('husky'),
    githubActions: selected.includes('githubActions'),
  };
}

/**
 * Shows a summary of selected options and confirms before generation
 *
 * @param options - Complete project options
 * @returns True if user confirms, false otherwise
 */
async function confirmOptions(options: ProjectOptions): Promise<boolean> {
  console.log();
  p.note(
    [
      `${chalk.cyan('Project:')}      ${options.projectName}`,
      `${chalk.cyan('Frontend:')}     ${formatOption(options.frontend)}`,
      `${chalk.cyan('Backend:')}      ${formatOption(options.backend)}`,
      `${chalk.cyan('Database:')}     ${formatOption(options.database)}`,
      `${chalk.cyan('Auth:')}         ${formatOption(options.auth)}`,
      `${chalk.cyan('Deployment:')}   ${formatOption(options.deployment)}`,
      '',
      `${chalk.cyan('Extras:')}`,
      `  ESLint:         ${formatBoolean(options.extras.eslint)}`,
      `  Prettier:       ${formatBoolean(options.extras.prettier)}`,
      `  Husky:          ${formatBoolean(options.extras.husky)}`,
      `  GitHub Actions: ${formatBoolean(options.extras.githubActions)}`,
    ].join('\n'),
    'Configuration Summary'
  );

  const confirmed = await p.confirm({
    message: 'Generate project with these settings?',
    initialValue: true,
  });

  handleCancel(confirmed);
  return confirmed as boolean;
}

/**
 * Formats an option value for display
 *
 * @param value - The option value to format
 * @returns Formatted display string
 */
function formatOption(value: string): string {
  const labels: Record<string, string> = {
    nextjs: 'Next.js 15',
    vite: 'Vite + React',
    express: 'Express.js',
    postgresql: 'PostgreSQL',
    sqlite: 'SQLite',
    authjs: 'Auth.js',
    lucia: 'Lucia',
    docker: 'Docker',
    vercel: 'Vercel',
  };
  return labels[value] ?? value;
}

/**
 * Formats a boolean value for display
 *
 * @param value - Boolean value
 * @returns Styled yes/no string
 */
function formatBoolean(value: boolean): string {
  return value ? chalk.green('Yes') : chalk.dim('No');
}

/**
 * Collects all project options through interactive prompts
 *
 * This is the main function for gathering user input. It handles:
 * - Using CLI arguments where provided
 * - Prompting for missing values
 * - Validation and cancellation
 * - Confirmation before proceeding
 *
 * @param cliArgs - Arguments already provided via CLI
 * @returns Complete project options or null if user cancels
 *
 * @example
 * ```ts
 * const args = parseArgs();
 * const options = await collectOptions(args);
 * if (options) {
 *   await generateProject(options);
 * }
 * ```
 */
export async function collectOptions(cliArgs: CLIArgs): Promise<ProjectOptions | null> {
  // Show intro banner
  showIntro();

  // Collect each option, using CLI args if provided
  const projectName = cliArgs.name ?? (await promptProjectName());

  const frontend = cliArgs.frontend ?? (await promptFrontend());

  // Backend is derived from frontend choice
  const backend = deriveBackend(frontend);

  // Show backend selection note for Vite
  if (frontend === 'vite' && !cliArgs.frontend) {
    p.log.info(chalk.dim(`Backend: Express.js (automatically selected for Vite projects)`));
  }

  const database = cliArgs.database ?? (await promptDatabase());

  const auth = cliArgs.auth ?? (await promptAuth());

  const deployment = cliArgs.deployment ?? (await promptDeployment());

  const extras = await promptExtras();

  // Build complete options
  const options: ProjectOptions = {
    projectName,
    frontend,
    backend,
    database,
    auth,
    deployment,
    extras,
  };

  // Confirm before generation
  const confirmed = await confirmOptions(options);

  if (!confirmed) {
    p.cancel('Generation cancelled. Run stackgen again to start over.');
    return null;
  }

  return options;
}

/**
 * Collects options in non-interactive mode using defaults
 *
 * When --yes flag is provided, this function fills in any missing
 * options with default values without prompting.
 *
 * @param cliArgs - Arguments provided via CLI
 * @returns Complete project options with defaults applied
 */
export function collectOptionsNonInteractive(cliArgs: CLIArgs): ProjectOptions {
  const projectName = cliArgs.name ?? 'my-app';
  const frontend = cliArgs.frontend ?? DEFAULT_OPTIONS.frontend;
  const backend = deriveBackend(frontend);
  const database = cliArgs.database ?? DEFAULT_OPTIONS.database;
  const auth = cliArgs.auth ?? DEFAULT_OPTIONS.auth;
  const deployment = cliArgs.deployment ?? DEFAULT_OPTIONS.deployment;

  return {
    projectName,
    frontend,
    backend,
    database,
    auth,
    deployment,
    extras: DEFAULT_OPTIONS.extras,
  };
}

/**
 * Shows non-interactive mode summary
 *
 * @param options - The options being used
 */
export function showNonInteractiveSummary(options: ProjectOptions): void {
  console.log();
  console.log(chalk.cyan.bold('  stackgen - Full-Stack TypeScript Generator'));
  console.log();
  console.log(chalk.dim('  Running in non-interactive mode with:'));
  console.log();
  console.log(`    ${chalk.cyan('Project:')}      ${options.projectName}`);
  console.log(`    ${chalk.cyan('Frontend:')}     ${formatOption(options.frontend)}`);
  console.log(`    ${chalk.cyan('Backend:')}      ${formatOption(options.backend)}`);
  console.log(`    ${chalk.cyan('Database:')}     ${formatOption(options.database)}`);
  console.log(`    ${chalk.cyan('Auth:')}         ${formatOption(options.auth)}`);
  console.log(`    ${chalk.cyan('Deployment:')}   ${formatOption(options.deployment)}`);
  console.log();
}

/**
 * Creates a spinner for long-running operations
 *
 * @returns Spinner control object
 */
export function createSpinner(): ReturnType<typeof p.spinner> {
  return p.spinner();
}

/**
 * Displays an error message and exits
 *
 * @param message - Error message to display
 * @param exitCode - Process exit code (default: 1)
 */
export function showError(message: string, exitCode = 1): never {
  p.cancel(chalk.red(message));
  process.exit(exitCode);
}

/**
 * Displays a warning message
 *
 * @param message - Warning message to display
 */
export function showWarning(message: string): void {
  p.log.warn(chalk.yellow(message));
}

/**
 * Displays a success message
 *
 * @param message - Success message to display
 */
export function showSuccess(message: string): void {
  p.log.success(chalk.green(message));
}

/**
 * Displays an info message
 *
 * @param message - Info message to display
 */
export function showInfo(message: string): void {
  p.log.info(message);
}
