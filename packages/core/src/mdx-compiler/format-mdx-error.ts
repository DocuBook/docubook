// MPL-2.0 — derived from next-mdx-remote (IBM). See LICENSE-MPL-2.0.
/**
 * Wraps raw MDX compilation errors with a clear message prefix.
 */
export function createFormattedMDXError(error: unknown, _source: string): Error {
  const message = error instanceof Error ? error.message : String(error);
  return new Error(`[mdx] error compiling MDX:\n${message}`);
}
