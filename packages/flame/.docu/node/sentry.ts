/**
 * Optional Sentry error tracking integration.
 * Active only when SENTRY_DSN environment variable is set.
 * Requires @sentry/bun as an optional peer dependency.
 */

let sentry: typeof import("@sentry/bun") | null = null;
let initialized = false;

export async function initSentry(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    sentry = await import("@sentry/bun");
    sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      release: process.env.SENTRY_RELEASE || undefined,
    });
    initialized = true;
  } catch {
    // @sentry/bun not installed — silently skip
    sentry = null;
    initialized = false;
  }
}

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (!initialized || !sentry) return;
  sentry.captureException(err, context ? { extra: context } : undefined);
}

export function isEnabled(): boolean {
  return initialized;
}
