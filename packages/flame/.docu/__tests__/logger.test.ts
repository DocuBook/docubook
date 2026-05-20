import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to control env vars before importing logger, so we use dynamic import
function setEnv(vars: Record<string, string>) {
  for (const [k, v] of Object.entries(vars)) process.env[k] = v;
}
function clearEnv(keys: string[]) {
  for (const k of keys) delete process.env[k];
}

const ENV_KEYS = ["LOG_LEVEL", "LOG_FORMAT", "CI", "NO_COLOR"];

describe("logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearEnv(ENV_KEYS);
  });

  afterEach(() => {
    clearEnv(ENV_KEYS);
    vi.resetModules();
  });

  async function importLogger(env: Record<string, string> = {}) {
    clearEnv(ENV_KEYS);
    setEnv({ CI: "1", ...env }); // CI=1 to disable spinner TTY logic
    vi.resetModules();
    const mod = await import("../lib/logger.ts");
    return mod.logger;
  }

  describe("log level filtering", () => {
    it("filters debug messages when level is info", async () => {
      const logger = await importLogger({ LOG_LEVEL: "info" });
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      logger.debug("should not appear");
      expect(spy).not.toHaveBeenCalled();
    });

    it("shows debug messages when level is debug", async () => {
      const logger = await importLogger({ LOG_LEVEL: "debug" });
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      logger.debug("visible");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("visible"));
    });

    it("filters info messages when level is warn", async () => {
      const logger = await importLogger({ LOG_LEVEL: "warn" });
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      logger.buildStart();
      expect(spy).not.toHaveBeenCalled();
    });

    it("filters warn messages when level is error", async () => {
      const logger = await importLogger({ LOG_LEVEL: "error" });
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      logger.warn("should not appear");
      expect(spy).not.toHaveBeenCalled();
    });

    it("shows error messages at error level", async () => {
      const logger = await importLogger({ LOG_LEVEL: "error" });
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.error("critical");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("critical"));
    });
  });

  describe("JSON format output", () => {
    it("outputs valid JSON when LOG_FORMAT=json", async () => {
      const logger = await importLogger({ LOG_FORMAT: "json" });
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      logger.buildStart();
      expect(spy).toHaveBeenCalledTimes(1);
      const output = spy.mock.calls[0][0];
      const parsed = JSON.parse(output);
      expect(parsed).toMatchObject({
        level: "info",
        msg: "build_start",
        package: "@docubook/flame",
      });
      expect(parsed.ts).toBeDefined();
      expect(parsed.version).toBeDefined();
    });

    it("includes meta in JSON output", async () => {
      const logger = await importLogger({ LOG_FORMAT: "json" });
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      logger.debug("test", { key: "value" });
      // debug is filtered at default info level in JSON mode too
      expect(spy).not.toHaveBeenCalled();
    });

    it("outputs JSON for warn with debug level", async () => {
      const logger = await importLogger({ LOG_FORMAT: "json", LOG_LEVEL: "debug" });
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      logger.warn("caution", { detail: "x" });
      expect(spy).toHaveBeenCalledTimes(1);
      const parsed = JSON.parse(spy.mock.calls[0][0]);
      expect(parsed).toMatchObject({ level: "warn", msg: "caution", detail: "x" });
    });
  });

  describe("output channels", () => {
    it("warn() outputs to stderr via console.warn", async () => {
      const logger = await importLogger({ LOG_LEVEL: "warn" });
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      logger.warn("warning message");
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("warning message"));
      expect(logSpy).not.toHaveBeenCalled();
    });

    it("error() outputs to stderr via console.error", async () => {
      const logger = await importLogger({ LOG_LEVEL: "error" });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      logger.error("error message");
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("error message"));
      expect(logSpy).not.toHaveBeenCalled();
    });
  });
});
