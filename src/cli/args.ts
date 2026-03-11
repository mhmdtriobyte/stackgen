/**
 * CLI Argument Parsing Module
 *
 * This module handles command-line argument parsing using Commander.js.
 * It defines all available flags and options for the stackgen CLI.
 */

import { Command } from 'commander';
import type { CLIArgs, FrontendFramework, DatabaseOption, AuthOption, DeploymentTarget } from './types.js';

/**
 * Package version - should be imported from package.json in production
 * For now, we define it here and it will be updated during build
 */
const VERSION = '0.1.0';

/**
 * CLI description text
 */
const DESCRIPTION = `
stackgen - Full-Stack TypeScript Project Generator

Generate production-ready full-stack TypeScript applications with:
  - Next.js 15 or Vite + React frontend
  - Drizzle ORM with PostgreSQL or SQLite
  - Auth.js or Lucia authentication
  - Docker or Vercel deployment
  - ESLint, Prettier, Husky, and GitHub Actions

Examples:
  $ stackgen                          # Interactive mode
  $ stackgen --yes                    # Use all defaults
  $ stackgen -n my-app --frontend nextjs --database postgresql
  $ stackgen my-app -y                # Quick start with defaults
`.trim();

/**
 * Valid frontend framework values
 */
const VALID_FRONTENDS: FrontendFramework[] = ['nextjs', 'vite'];

/**
 * Valid database values
 */
const VALID_DATABASES: DatabaseOption[] = ['postgresql', 'sqlite'];

/**
 * Valid auth values
 */
const VALID_AUTHS: AuthOption[] = ['authjs', 'lucia'];

/**
 * Valid deployment values
 */
const VALID_DEPLOYMENTS: DeploymentTarget[] = ['docker', 'vercel'];

/**
 * Creates a validation function for enum-like options
 *
 * @param validValues - Array of valid string values
 * @param optionName - Name of the option for error messages
 * @returns Validation function for commander
 */
function createEnumValidator<T extends string>(
  validValues: T[],
  optionName: string
): (value: string) => T {
  return (value: string): T => {
    const lowercased = value.toLowerCase() as T;
    if (!validValues.includes(lowercased)) {
      throw new Error(
        `Invalid ${optionName}: "${value}". Valid options: ${validValues.join(', ')}`
      );
    }
    return lowercased;
  };
}

/**
 * Parses command-line arguments and returns structured CLI options
 *
 * @param argv - Command line arguments (defaults to process.argv)
 * @returns Parsed CLI arguments
 *
 * @example
 * ```ts
 * const args = parseArgs();
 * if (args.yes) {
 *   // Use defaults for missing options
 * }
 * ```
 */
export function parseArgs(argv: string[] = process.argv): CLIArgs {
  const program = new Command();

  program
    .name('stackgen')
    .description(DESCRIPTION)
    .version(VERSION, '-v, --version', 'Display version number')
    .argument('[project-name]', 'Name of the project to create')
    .option('-y, --yes', 'Use default options for all prompts', false)
    .option(
      '-n, --name <name>',
      'Project name (alternative to positional argument)'
    )
    .option(
      '--frontend <framework>',
      'Frontend framework (nextjs | vite)',
      createEnumValidator(VALID_FRONTENDS, 'frontend')
    )
    .option(
      '--database <database>',
      'Database type (postgresql | sqlite)',
      createEnumValidator(VALID_DATABASES, 'database')
    )
    .option(
      '--auth <auth>',
      'Authentication solution (authjs | lucia)',
      createEnumValidator(VALID_AUTHS, 'auth')
    )
    .option(
      '--deployment <target>',
      'Deployment target (docker | vercel)',
      createEnumValidator(VALID_DEPLOYMENTS, 'deployment')
    )
    .helpOption('-h, --help', 'Display help information')
    .addHelpText(
      'after',
      `
Notes:
  - When using --yes flag, any unspecified options will use defaults
  - Default stack: Next.js 15 + PostgreSQL + Auth.js + Docker
  - Project name can be specified as first argument or with --name flag
`
    );

  // Parse arguments
  program.parse(argv);

  const options = program.opts();
  const positionalName = program.args[0];

  // Build CLI args object
  const cliArgs: CLIArgs = {
    yes: options.yes ?? false,
    name: options.name ?? positionalName,
    frontend: options.frontend,
    database: options.database,
    auth: options.auth,
    deployment: options.deployment,
  };

  return cliArgs;
}

/**
 * Checks if any project configuration options were provided via CLI
 *
 * @param args - Parsed CLI arguments
 * @returns True if at least one configuration option was provided
 */
export function hasProvidedOptions(args: CLIArgs): boolean {
  return !!(
    args.name ||
    args.frontend ||
    args.database ||
    args.auth ||
    args.deployment
  );
}

/**
 * Gets a human-readable summary of provided CLI options
 *
 * @param args - Parsed CLI arguments
 * @returns Array of option descriptions
 */
export function getProvidedOptionsSummary(args: CLIArgs): string[] {
  const summary: string[] = [];

  if (args.name) summary.push(`Project: ${args.name}`);
  if (args.frontend) summary.push(`Frontend: ${args.frontend}`);
  if (args.database) summary.push(`Database: ${args.database}`);
  if (args.auth) summary.push(`Auth: ${args.auth}`);
  if (args.deployment) summary.push(`Deployment: ${args.deployment}`);

  return summary;
}
