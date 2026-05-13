/**
 * Interactive CLI logger with spinner and tree-style route display.
 * Inspired by Next.js/Turbopack build output.
 */

import docuConfig from "../../docu.json" with { type: "json" };

const c = {
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
    process.stdout.write(`\r\x1b[K${c.cyan}ℹ${c.reset} ${finalMsg}\n`);
    process.stdout.write("\x1b[?25h");
  }

  start(msg: string) {
    this.message = msg;
    this.frame = 0;
    process.stdout.write("\x1b[?25l"); // hide cursor
    this.render();
    this.timer = setInterval(() => this.render(), 80);
  }

  stop(finalMsg: string) {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    process.stdout.write(`\r\x1b[K${c.green}✓${c.reset} ${finalMsg}\n`);
    process.stdout.write("\x1b[?25h"); // show cursor
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
    console.log(
      `\n${c.bold}${c.cyan}  ▲ DocuBook Flame${c.reset} ${c.dim}v1.0.0-beta.1${c.reset}\n`
    );
  },

  bundleStart() {
    this.spinner.start("Building client bundle...");
  },

  bundleDone(ms: number) {
    this.spinner.stop(`Client bundle compiled ${c.dim}(${ms}ms)${c.reset}`);
  },

  indexStart() {
    this.spinner.start("Generating search index...");
  },

  indexDone(records: number, ms: number) {
    this.spinner.stop(`Search index generated ${c.dim}(${records} records, ${ms}ms)${c.reset}`);
  },

  routes() {
    const routes = docuConfig.routes as RouteItem[] | undefined;
    if (!routes?.length) return;

    console.log(`\n${c.bold}  Routes${c.reset} ${c.dim}(${countRoutes(routes)} pages)${c.reset}\n`);
    routeLineCount = 0;
    routeTruncated = false;
    printRouteTree(routes, "  ");
  },

  ready(port: number, hmr = false) {
    console.log(
      `\n${c.green}${c.bold}  ✓ Ready${c.reset} in ${c.bold}http://localhost:${port}/docs/${c.reset}`
    );
    if (hmr) console.log(`${c.dim}  HMR enabled — watching docs/ for changes${c.reset}`);
    console.log("");
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
