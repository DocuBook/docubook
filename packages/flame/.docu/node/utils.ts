export { cn, parseDate, formatDate, formatDate2 } from "@docubook/core";
export {
  withBasePath,
  assetHref,
  applyBasePath,
  rebaseContentPath,
  stripDocsHtmlSuffix,
  matchDocsSlug,
} from "./base-path";

/**
 * Client-safe utilities shared by SSR and the browser bundle.
 *
 * This module MUST NOT import Node built-ins (`node:fs`, `node:path`, ...):
 * Bun's bundler injects a `node:path` polyfill into browser builds for any
 * bundled module that imports it. Filesystem/git helpers live in
 * `./server-utils` (server-only).
 */

export function isExternalUrl(url: string): boolean {
  return /^(https?:\/\/|\/\/)/.test(url);
}

/** Suffix an internal docs link with `.html` to match the flat static build output. */
export function docsHtmlHref(path: string): string {
  return `${path}.html`;
}

export function getPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch (err) {
    console.error("Failed to parse URL", url, err);
    return url;
  }
}
