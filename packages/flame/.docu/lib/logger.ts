/**
 * Interactive CLI logger with spinner and tree-style route display.
 * Inspired by Next.js/Turbopack build output.
 *
 * Supports structured logging via environment variables:
 * - LOG_LEVEL: debug | info | warn | error (default: info)
 * - LOG_FORMAT: json | pretty (default: pretty)
 */

import docuConfig from "../../docu.json" with { type: "json" };

const isCI = !!(process.env.CI || process.env.NO_COLOR || !process.stdout.isTTY);
const LOG_FORMAT = process.env.LOG_FORMAT || "pretty";
const isJSON = LOG_FORMAT === "json";

type LogLevel = "debug" | "info" | "warn" | "error";
const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LEVELS[(process.env.LOG_LEVEL as LogLevel) || "info"] ?? LEVELS.info;

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= currentLevel;
}

function jsonLog(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const entry = { ts: new Date().toISOString(), level, msg, ...meta };
  console.log(JSON.stringify(entry));
}

const c =
  isCI || isJSON
    ? {
        reset: "",
        bold: "",
        dim: "",
        green: "",
        cyan: "",
        magenta: "",
        yellow: "",
        white: "",
        gray: "",
      }
    : {
        reset: "\x1b[0m",
        bold: "\x1b[1m",
        dim: "\x1b[2m",
        green: "\x1b[32m",
        cyan: "\x1b[36m",
        magenta: "\x1b[35m",
        yellow: "\x1b[33m",
        white: "\x1b[37m",
        gray: "\x1b[90m",
      };

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

class Spinner {
  private frame = 0;
  private message = "";
  private timer: ReturnType<typeof setInterval> | null = null;

  info(finalMsg: string) {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (isCI) {
      console.log(`ℹ ${finalMsg}`);
    } else {
      process.stdout.write(`\r\x1b[K${c.cyan}ℹ${c.reset} ${finalMsg}\n`);
      process.stdout.write("\x1b[?25h");
    }
  }

  start(msg: string) {
    this.message = msg;
    if (isCI) {
      console.log(`… ${msg}`);
      return;
    }
    this.frame = 0;
    process.stdout.write("\x1b[?25l");
    this.render();
    this.timer = setInterval(() => this.render(), 80);
  }

  stop(finalMsg: string) {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (isCI) {
      console.log(`✓ ${finalMsg}`);
      return;
    }
    process.stdout.write(`\r\x1b[K${c.green}✓${c.reset} ${finalMsg}\n`);
    process.stdout.write("\x1b[?25h");
  }

  private render() {
    const f = SPINNER_FRAMES[this.frame % SPINNER_FRAMES.length];
    process.stdout.write(`\r${c.cyan}${f}${c.reset} ${this.message}`);
    this.frame++;
  }
}

interface RouteItem {
  title: string;
  href: string;
  noLink?: boolean;
  items?: RouteItem[];
}

const MAX_ROUTE_LINES = 5;
let routeLineCount = 0;
let routeTruncated = false;

function printRouteTree(routes: RouteItem[], prefix = "", isRoot = true) {
  for (let i = 0; i < routes.length; i++) {
    if (routeTruncated) return;
    if (routeLineCount >= MAX_ROUTE_LINES) {
      routeTruncated = true;
      process.stdout.write(`${prefix}${c.dim}...${c.reset}\n`);
      return;
    }

    const route = routes[i];
    const last = i === routes.length - 1;
    const connector = isRoot ? "" : last ? "└── " : "├── ";
    const childPrefix = isRoot ? "" : last ? "    " : "│   ";

    const path = route.noLink
      ? `${c.dim}${route.href}${c.reset}`
      : `${c.white}${route.href}${c.reset}`;

    const label = route.noLink ? `${c.gray}(group)${c.reset}` : "";

    process.stdout.write(`${prefix}${connector}${path} ${label}\n`);
    routeLineCount++;

    if (route.items?.length) {
      printRouteTree(route.items, prefix + childPrefix, false);
    }
  }
}

export const logger = {
  spinner: new Spinner(),

  buildStart() {
    if (isJSON)
      return jsonLog("info", "build_start", {
        package: "@docubook/flame",
        version: "1.0.0-beta.1",
      });
    if (!shouldLog("info")) return;
    console.log(
      `\n${c.bold}${c.cyan}  🔥 DocuBook Flame${c.reset} ${c.dim}v1.0.0-beta.1${c.reset}\n`
    );
  },

  bundleStart() {
    if (isJSON) return jsonLog("info", "bundle_start");
    if (!shouldLog("info")) return;
    this.spinner.start("Building client bundle...");
  },

  bundleDone(ms: number) {
    if (isJSON) return jsonLog("info", "bundle_done", { duration_ms: ms });
    if (!shouldLog("info")) return;
    this.spinner.stop(`Client bundle compiled ${c.dim}(${ms}ms)${c.reset}`);
  },

  indexStart() {
    if (isJSON) return jsonLog("info", "index_start");
    if (!shouldLog("info")) return;
    this.spinner.start("Generating search index...");
  },

  indexDone(records: number, ms: number) {
    if (isJSON) return jsonLog("info", "index_done", { records, duration_ms: ms });
    if (!shouldLog("info")) return;
    this.spinner.stop(`Search index generated ${c.dim}(${records} records, ${ms}ms)${c.reset}`);
  },

  routes() {
    if (isJSON || !shouldLog("debug")) return;
    const routes = docuConfig.routes as RouteItem[] | undefined;
    if (!routes?.length) return;

    console.log(`\n${c.bold}  Routes${c.reset} ${c.dim}(${countRoutes(routes)} pages)${c.reset}\n`);
    routeLineCount = 0;
    routeTruncated = false;
    printRouteTree(routes, "  ");
  },

  ready(port: number, hmr = false) {
    if (isJSON) return jsonLog("info", "server_ready", { port, hmr });
    if (!shouldLog("info")) return;
    console.log(
      `\n${c.green}${c.bold}  ✓ Ready${c.reset} in ${c.bold}http://localhost:${port}/docs/${c.reset}`
    );
    if (hmr) console.log(`${c.dim}  HMR enabled — watching docs/ for changes${c.reset}`);
    console.log("");
  },

  request(method: string, pathname: string, status: number, duration_ms?: number) {
    if (isJSON)
      return jsonLog("info", "http_request", { method, path: pathname, status, duration_ms });
    if (!shouldLog("info")) return;
    const color = status >= 500 ? c.yellow : status >= 400 ? c.gray : c.green;
    const ts = new Date().toLocaleTimeString();
    const dur = duration_ms != null ? ` ${c.dim}${duration_ms}ms${c.reset}` : "";
    console.log(
      `${c.dim}  ${ts}${c.reset} ${method} ${pathname} ${color}${status}${c.reset}${dur}`
    );
  },

  debug(msg: string, meta?: Record<string, unknown>) {
    if (isJSON) return jsonLog("debug", msg, meta);
    if (!shouldLog("debug")) return;
    console.log(`${c.gray}  [debug] ${msg}${c.reset}`);
  },

  warn(msg: string, meta?: Record<string, unknown>) {
    if (isJSON) return jsonLog("warn", msg, meta);
    if (!shouldLog("warn")) return;
    console.log(`${c.yellow}  ⚠ ${msg}${c.reset}`);
  },

  error(msg: string, meta?: Record<string, unknown>) {
    if (isJSON) return jsonLog("error", msg, meta);
    if (!shouldLog("error")) return;
    console.error(`${c.yellow}  ✖ ${msg}${c.reset}`);
  },
};

function countRoutes(routes: RouteItem[]): number {
  let count = 0;
  for (const r of routes) {
    if (!r.noLink) count++;
    if (r.items) count += countRoutes(r.items);
  }
  return count;
}
