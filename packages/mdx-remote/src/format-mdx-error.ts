/**
 * Parse line:column from an MDX error message (fallback when error.position is missing).
 */
function parsePositionFromMessage(message: string): { start: { line: number; column: number } } | undefined {
  const pattern = /\d+:\d+(-\d+:\d+)?/g;
  const match = message.match(pattern);
  if (!match) return undefined;
  const last = match[match.length - 1];
  const [line, col] = last.split("-")[0].split(":");
  return {
    start: { line: Number(line), column: Number(col) },
  };
}

/**
 * Wraps raw MDX compilation errors with formatted source context.
 */
export function createFormattedMDXError(error: any, source: string): Error {
  const position = error?.position ?? parsePositionFromMessage(error?.message);
  const formatted = new Error(
    `[mdx-remote] error compiling MDX:\n${error?.message ?? error}`,
  );
  formatted.stack = "";
  return formatted;
}
