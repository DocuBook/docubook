import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("sentry", () => {
  const mockInit = vi.fn();
  const mockCaptureException = vi.fn();

  beforeEach(() => {
    mockInit.mockClear();
    mockCaptureException.mockClear();
    delete process.env.SENTRY_DSN;
    delete process.env.NODE_ENV;
    delete process.env.SENTRY_RELEASE;

    vi.doMock("@sentry/bun", () => ({
      init: mockInit,
      captureException: mockCaptureException,
    }));
  });

  afterEach(() => {
    vi.resetModules();
    delete process.env.SENTRY_DSN;
  });

  async function importSentry() {
    return await import("../lib/sentry.ts");
  }

  describe("initSentry", () => {
    it("skips when SENTRY_DSN is not set", async () => {
      const { initSentry, isEnabled } = await importSentry();
      await initSentry();
      expect(isEnabled()).toBe(false);
      expect(mockInit).not.toHaveBeenCalled();
    });

    it("initializes Sentry when DSN is set", async () => {
      process.env.SENTRY_DSN = "https://key@sentry.io/123";
      const { initSentry, isEnabled } = await importSentry();
      await initSentry();
      expect(isEnabled()).toBe(true);
      expect(mockInit).toHaveBeenCalledWith({
        dsn: "https://key@sentry.io/123",
        environment: "development",
        release: undefined,
      });
    });

    it("passes NODE_ENV and SENTRY_RELEASE to init", async () => {
      process.env.SENTRY_DSN = "https://key@sentry.io/123";
      process.env.NODE_ENV = "production";
      process.env.SENTRY_RELEASE = "v1.0.0";
      const { initSentry } = await importSentry();
      await initSentry();
      expect(mockInit).toHaveBeenCalledWith({
        dsn: "https://key@sentry.io/123",
        environment: "production",
        release: "v1.0.0",
      });
    });

    it("handles missing @sentry/bun gracefully", async () => {
      process.env.SENTRY_DSN = "https://key@sentry.io/123";
      vi.doMock("@sentry/bun", () => {
        throw new Error("Cannot find module");
      });
      const { initSentry, isEnabled } = await importSentry();
      await initSentry();
      expect(isEnabled()).toBe(false);
    });
  });

  describe("captureException", () => {
    it("does nothing when not initialized", async () => {
      const { captureException } = await importSentry();
      captureException(new Error("test"));
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it("forwards error to Sentry when initialized", async () => {
      process.env.SENTRY_DSN = "https://key@sentry.io/123";
      const { initSentry, captureException } = await importSentry();
      await initSentry();
      mockCaptureException.mockClear();
      const err = new Error("boom");
      captureException(err);
      expect(mockCaptureException).toHaveBeenCalledWith(err, undefined);
    });

    it("passes extra context to Sentry", async () => {
      process.env.SENTRY_DSN = "https://key@sentry.io/123";
      const { initSentry, captureException } = await importSentry();
      await initSentry();
      mockCaptureException.mockClear();
      const err = new Error("boom");
      captureException(err, { route: "/docs" });
      expect(mockCaptureException).toHaveBeenCalledWith(err, { extra: { route: "/docs" } });
    });
  });
});
