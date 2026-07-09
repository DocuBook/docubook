/**
 * Wraps raw MDX compilation errors with a clear message prefix.
 */
export function createFormattedMDXError(error: any, _source: string): Error {
  return new Error(`[mdx-remote] error compiling MDX:\n${error?.message ?? error}`);
}
