/**
 * Module-level __dirname and __filename utilities for ESM
 * Eliminates code duplication across the codebase
 */
import { fileURLToPath } from "url";
import { dirname } from "path";

/**
 * Get the directory name of the current module
 * @param {string} importMetaUrl - import.meta.url from calling module
 * @returns {string} __dirname equivalent
 */
export function getDirname(importMetaUrl) {
  const filename = fileURLToPath(importMetaUrl);
  return dirname(filename);
}

/**
 * Get the file name of the current module
 * @param {string} importMetaUrl - import.meta.url from calling module
 * @returns {string} __filename equivalent
 */
export function getFilename(importMetaUrl) {
  return fileURLToPath(importMetaUrl);
}
