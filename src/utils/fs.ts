/**
 * File System Utilities for stackgen CLI
 *
 * Provides cross-platform file system operations including:
 * - File writing with automatic directory creation
 * - EJS template rendering and copying
 * - Directory management
 * - File existence checking
 *
 * @module utils/fs
 */

import fs from 'fs-extra';
import path from 'node:path';
import ejs from 'ejs';
import { fileURLToPath } from 'node:url';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result type for file system operations
 * Provides explicit success/failure handling without exceptions
 */
export type FSResult<T> = FSSuccess<T> | FSFailure;

export interface FSSuccess<T> {
  success: true;
  data: T;
}

export interface FSFailure {
  success: false;
  error: string;
  code?: string;
}

/**
 * Template data that can be passed to EJS templates
 */
export type TemplateData = Record<string, unknown>;

/**
 * Options for file writing operations
 */
export interface WriteFileOptions {
  /** File encoding, defaults to 'utf-8' */
  encoding?: BufferEncoding;
  /** File mode (permissions), defaults to 0o644 */
  mode?: number;
  /** Overwrite existing files, defaults to true */
  overwrite?: boolean;
}

/**
 * Options for template copying operations
 */
export interface CopyTemplateOptions extends WriteFileOptions {
  /** EJS rendering options */
  ejsOptions?: ejs.Options;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_ENCODING: BufferEncoding = 'utf-8';
const DEFAULT_FILE_MODE = 0o644;
const DEFAULT_DIR_MODE = 0o755;

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Normalizes file paths for cross-platform compatibility
 * Converts backslashes to forward slashes and resolves relative paths
 *
 * @param filePath - The path to normalize
 * @returns Normalized absolute path
 */
function normalizePath(filePath: string): string {
  // Convert Windows backslashes to forward slashes for consistency
  const normalized = filePath.replace(/\\/g, '/');
  // Resolve to absolute path
  return path.resolve(normalized);
}

/**
 * Gets the templates directory path
 * Resolves relative to this module's location
 *
 * @returns Absolute path to templates directory
 */
function getTemplatesDir(): string {
  // Handle both ESM and CommonJS module resolution
  try {
    // ESM approach
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return path.resolve(__dirname, '..', '..', 'templates');
  } catch {
    // CommonJS fallback
    return path.resolve(__dirname, '..', '..', 'templates');
  }
}

/**
 * Creates a success result
 */
function success<T>(data: T): FSSuccess<T> {
  return { success: true, data };
}

/**
 * Creates a failure result from an error
 */
function failure(error: unknown): FSFailure {
  if (error instanceof Error) {
    const nodeError = error as NodeJS.ErrnoException;
    return {
      success: false,
      error: error.message,
      code: nodeError.code,
    };
  }
  return {
    success: false,
    error: String(error),
  };
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Writes content to a file, creating parent directories if needed
 *
 * @param filePath - Destination file path (absolute or relative)
 * @param content - Content to write (string or Buffer)
 * @param options - Write options
 * @returns Result indicating success or failure
 *
 * @example
 * ```typescript
 * const result = await writeFile('src/config.ts', 'export default {}');
 * if (result.success) {
 *   console.log(`Wrote ${result.data.bytesWritten} bytes to ${result.data.path}`);
 * }
 * ```
 */
export async function writeFile(
  filePath: string,
  content: string | Buffer,
  options: WriteFileOptions = {}
): Promise<FSResult<{ path: string; bytesWritten: number }>> {
  const {
    encoding = DEFAULT_ENCODING,
    mode = DEFAULT_FILE_MODE,
    overwrite = true,
  } = options;

  try {
    const normalizedPath = normalizePath(filePath);
    const dirPath = path.dirname(normalizedPath);

    // Check if file exists and overwrite is disabled
    if (!overwrite) {
      const exists = await fs.pathExists(normalizedPath);
      if (exists) {
        return failure(
          new Error(`File already exists and overwrite is disabled: ${normalizedPath}`)
        );
      }
    }

    // Ensure parent directory exists
    await fs.ensureDir(dirPath, { mode: DEFAULT_DIR_MODE });

    // Write the file
    await fs.writeFile(normalizedPath, content, { encoding, mode });

    const bytesWritten = Buffer.isBuffer(content)
      ? content.length
      : Buffer.byteLength(content, encoding);

    return success({ path: normalizedPath, bytesWritten });
  } catch (error) {
    return failure(error);
  }
}

/**
 * Renders an EJS template and writes the result to a destination file
 *
 * @param templatePath - Path to the EJS template file
 * @param destPath - Destination file path
 * @param data - Data to pass to the EJS template
 * @param options - Copy and rendering options
 * @returns Result indicating success or failure
 *
 * @example
 * ```typescript
 * const result = await copyTemplate(
 *   'templates/package.json.ejs',
 *   'my-app/package.json',
 *   { projectName: 'my-app', version: '1.0.0' }
 * );
 * ```
 */
export async function copyTemplate(
  templatePath: string,
  destPath: string,
  data: TemplateData = {},
  options: CopyTemplateOptions = {}
): Promise<FSResult<{ path: string; bytesWritten: number }>> {
  const { ejsOptions = {}, ...writeOptions } = options;

  try {
    const normalizedTemplatePath = normalizePath(templatePath);
    const normalizedDestPath = normalizePath(destPath);

    // Check if template exists
    const templateExists = await fs.pathExists(normalizedTemplatePath);
    if (!templateExists) {
      return failure(new Error(`Template not found: ${normalizedTemplatePath}`));
    }

    // Read the template
    const templateContent = await fs.readFile(normalizedTemplatePath, 'utf-8');

    // Render the template with EJS
    const renderedContent = ejs.render(templateContent, data, {
      filename: normalizedTemplatePath, // For includes resolution
      async: false,
      ...ejsOptions,
    }) as string;

    // Write the rendered content
    return writeFile(normalizedDestPath, renderedContent, writeOptions);
  } catch (error) {
    return failure(error);
  }
}

/**
 * Ensures a directory exists, creating it recursively if needed
 *
 * @param dirPath - Directory path to ensure exists
 * @param mode - Directory permissions mode (default: 0o755)
 * @returns Result indicating success or failure
 *
 * @example
 * ```typescript
 * const result = await ensureDir('src/components/ui');
 * if (result.success) {
 *   console.log(`Directory ready: ${result.data.path}`);
 * }
 * ```
 */
export async function ensureDir(
  dirPath: string,
  mode: number = DEFAULT_DIR_MODE
): Promise<FSResult<{ path: string; created: boolean }>> {
  try {
    const normalizedPath = normalizePath(dirPath);

    // Check if directory already exists
    const exists = await fs.pathExists(normalizedPath);

    // Create directory if it doesn't exist
    await fs.ensureDir(normalizedPath, { mode });

    return success({ path: normalizedPath, created: !exists });
  } catch (error) {
    return failure(error);
  }
}

/**
 * Checks if a file or directory exists at the given path
 *
 * @param filePath - Path to check
 * @returns Result with boolean indicating existence
 *
 * @example
 * ```typescript
 * const result = await fileExists('package.json');
 * if (result.success && result.data.exists) {
 *   console.log('package.json found');
 * }
 * ```
 */
export async function fileExists(
  filePath: string
): Promise<FSResult<{ exists: boolean; path: string; isDirectory?: boolean }>> {
  try {
    const normalizedPath = normalizePath(filePath);
    const exists = await fs.pathExists(normalizedPath);

    if (exists) {
      const stats = await fs.stat(normalizedPath);
      return success({
        exists: true,
        path: normalizedPath,
        isDirectory: stats.isDirectory(),
      });
    }

    return success({ exists: false, path: normalizedPath });
  } catch (error) {
    return failure(error);
  }
}

/**
 * Reads an EJS template from the templates directory
 *
 * @param templateName - Name of the template file (with or without .ejs extension)
 * @returns Result with template content
 *
 * @example
 * ```typescript
 * const result = await readTemplate('package.json');
 * if (result.success) {
 *   console.log('Template content:', result.data.content);
 * }
 * ```
 */
export async function readTemplate(
  templateName: string
): Promise<FSResult<{ content: string; path: string }>> {
  try {
    const templatesDir = getTemplatesDir();

    // Add .ejs extension if not present
    const fileName = templateName.endsWith('.ejs')
      ? templateName
      : `${templateName}.ejs`;

    const templatePath = path.join(templatesDir, fileName);
    const normalizedPath = normalizePath(templatePath);

    // Check if template exists
    const exists = await fs.pathExists(normalizedPath);
    if (!exists) {
      // Try without .ejs extension as fallback
      const altPath = path.join(templatesDir, templateName);
      const altNormalized = normalizePath(altPath);
      const altExists = await fs.pathExists(altNormalized);

      if (!altExists) {
        return failure(
          new Error(
            `Template not found: ${templateName} (searched in ${templatesDir})`
          )
        );
      }

      const content = await fs.readFile(altNormalized, 'utf-8');
      return success({ content, path: altNormalized });
    }

    const content = await fs.readFile(normalizedPath, 'utf-8');
    return success({ content, path: normalizedPath });
  } catch (error) {
    return failure(error);
  }
}

/**
 * Copies a directory recursively
 *
 * @param srcPath - Source directory path
 * @param destPath - Destination directory path
 * @param options - Copy options
 * @returns Result indicating success or failure
 */
export async function copyDir(
  srcPath: string,
  destPath: string,
  options: { overwrite?: boolean; filter?: (src: string) => boolean } = {}
): Promise<FSResult<{ path: string; filesCopied: number }>> {
  const { overwrite = true, filter } = options;

  try {
    const normalizedSrc = normalizePath(srcPath);
    const normalizedDest = normalizePath(destPath);

    // Check if source exists
    const srcExists = await fs.pathExists(normalizedSrc);
    if (!srcExists) {
      return failure(new Error(`Source directory not found: ${normalizedSrc}`));
    }

    // Count files before copying
    let filesCopied = 0;
    const countFilter = (src: string): boolean => {
      const shouldCopy = filter ? filter(src) : true;
      if (shouldCopy) filesCopied++;
      return shouldCopy;
    };

    // Copy directory
    await fs.copy(normalizedSrc, normalizedDest, {
      overwrite,
      filter: countFilter,
    });

    return success({ path: normalizedDest, filesCopied });
  } catch (error) {
    return failure(error);
  }
}

/**
 * Removes a file or directory
 *
 * @param targetPath - Path to remove
 * @returns Result indicating success or failure
 */
export async function remove(
  targetPath: string
): Promise<FSResult<{ path: string }>> {
  try {
    const normalizedPath = normalizePath(targetPath);
    await fs.remove(normalizedPath);
    return success({ path: normalizedPath });
  } catch (error) {
    return failure(error);
  }
}

/**
 * Reads a JSON file and parses it
 *
 * @param filePath - Path to JSON file
 * @returns Result with parsed JSON data
 */
export async function readJson<T = unknown>(
  filePath: string
): Promise<FSResult<{ data: T; path: string }>> {
  try {
    const normalizedPath = normalizePath(filePath);
    const data = await fs.readJson(normalizedPath);
    return success({ data: data as T, path: normalizedPath });
  } catch (error) {
    return failure(error);
  }
}

/**
 * Writes data to a JSON file with pretty formatting
 *
 * @param filePath - Path to JSON file
 * @param data - Data to write
 * @param options - Write options
 * @returns Result indicating success or failure
 */
export async function writeJson(
  filePath: string,
  data: unknown,
  options: { spaces?: number; overwrite?: boolean } = {}
): Promise<FSResult<{ path: string }>> {
  const { spaces = 2, overwrite = true } = options;

  try {
    const normalizedPath = normalizePath(filePath);
    const dirPath = path.dirname(normalizedPath);

    if (!overwrite) {
      const exists = await fs.pathExists(normalizedPath);
      if (exists) {
        return failure(
          new Error(`File already exists: ${normalizedPath}`)
        );
      }
    }

    await fs.ensureDir(dirPath);
    await fs.writeJson(normalizedPath, data, { spaces });

    return success({ path: normalizedPath });
  } catch (error) {
    return failure(error);
  }
}
