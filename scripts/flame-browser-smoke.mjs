#!/usr/bin/env node
/**
 * Browser smoke test for a built Flame site.
 *
 * The runtime-smoke CI jobs only prove that `flame build` exits 0. A client
 * bundle can still crash on load (e.g. server modules leaking into the browser
 * bundle, see #418) and every page would ship without working islands. This
 * script serves the static output, loads a few pages in headless Chrome and
 * fails when a page throws, a same-origin script or stylesheet fails to load,
 * or an island does not hydrate and respond to input.
 *
 * Usage: node scripts/flame-browser-smoke.mjs [distDir]
 *   distDir defaults to packages/flame/.docu/dist (the repo docs site).
 *   CHROME_PATH selects a Chrome/Chromium binary; otherwise the locally
 *   installed Google Chrome channel is used (preinstalled on GitHub runners).
 *
 * Read-only: it serves the existing build output and writes nothing.
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const root = path.resolve(import.meta.dirname, "..");
const distDir = path.resolve(process.argv[2] ?? path.join(root, "packages/flame/.docu/dist"));
const HYDRATION_TIMEOUT_MS = 15_000;

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

/**
 * Each page is loaded fresh. `interact` must prove the page hydrated: it runs
 * after React has attached to the target element.
 */
const pages = [
  { path: "/" },
  { path: "/docs/" },
  {
    path: "/docs/components/accordion",
    hydrated: "button.mdx-accordion-header",
    interact: async (page) => {
      const trigger = page.locator("button.mdx-accordion-header").first();
      const before = await trigger.getAttribute("aria-expanded");
      await trigger.click();
      await expectAttribute(trigger, "aria-expanded", before === "true" ? "false" : "true");
    },
  },
  {
    path: "/docs/components/tabs",
    hydrated: '[role="tab"]',
    interact: async (page) => {
      const tab = page.locator('[role="tab"]').nth(1);
      await tab.click();
      await expectAttribute(tab, "aria-selected", "true");
    },
  },
];

/** Resolve a URL path to a file in distDir, mirroring clean-URL static hosts. */
function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split("?")[0]);
  } catch {
    return null;
  }
  const candidates = decoded.endsWith("/")
    ? [`${decoded}index.html`]
    : [decoded, `${decoded}.html`, `${decoded}/index.html`];
  for (const candidate of candidates) {
    // Resolve each candidate and confirm it stays inside distDir before any
    // filesystem access, so request paths cannot escape the served directory.
    const file = path.resolve(distDir, `.${path.posix.normalize(`/${candidate}`)}`);
    if (!file.startsWith(distDir + path.sep)) continue;
    if (existsSync(file) && statSync(file).isFile()) return file;
  }
  return null;
}

function startServer() {
  const server = createServer((req, res) => {
    const file = resolveFile(req.url ?? "/");
    if (!file) {
      const notFound = path.join(distDir, "404.html");
      res.writeHead(404, { "content-type": CONTENT_TYPES[".html"] });
      res.end(existsSync(notFound) ? readFileSync(notFound) : "not found");
      return;
    }
    const type = CONTENT_TYPES[path.extname(file)] ?? "application/octet-stream";
    res.writeHead(200, { "content-type": type });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function expectAttribute(locator, name, expected) {
  const deadline = Date.now() + 5_000;
  let actual;
  while (Date.now() < deadline) {
    actual = await locator.getAttribute(name);
    if (actual === expected) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`expected ${name}="${expected}" after interaction, got "${actual}"`);
}

/** React attaches `__reactProps$<id>` to DOM nodes it has hydrated or rendered. */
async function waitForHydration(page, selector) {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return !!el && Object.keys(el).some((key) => key.startsWith("__reactProps$"));
    },
    selector,
    { timeout: HYDRATION_TIMEOUT_MS }
  );
}

async function checkPage(browser, origin, spec) {
  const page = await browser.newPage();
  const problems = [];
  page.on("pageerror", (error) => problems.push(`uncaught: ${error.message}`));
  page.on("requestfailed", (request) => {
    if (
      request.url().startsWith(origin) &&
      ["script", "stylesheet"].includes(request.resourceType())
    ) {
      problems.push(`failed ${request.resourceType()}: ${request.url().slice(origin.length)}`);
    }
  });
  page.on("response", (response) => {
    const type = response.request().resourceType();
    if (
      response.url().startsWith(origin) &&
      ["script", "stylesheet"].includes(type) &&
      response.status() >= 400
    ) {
      problems.push(`${response.status()} ${type}: ${response.url().slice(origin.length)}`);
    }
  });

  try {
    const response = await page.goto(origin + spec.path, { waitUntil: "networkidle" });
    if (!response || response.status() >= 400) {
      problems.push(`page returned ${response?.status() ?? "no response"}`);
    } else if (spec.hydrated) {
      await waitForHydration(page, spec.hydrated);
      await spec.interact(page);
    }
  } catch (error) {
    problems.push(error instanceof Error ? error.message.split("\n")[0] : String(error));
  } finally {
    await page.close();
  }
  return problems;
}

if (!existsSync(path.join(distDir, "index.html"))) {
  console.error(
    `flame browser smoke: no built site at ${path.relative(root, distDir)}; run flame build first`
  );
  process.exit(1);
}

const server = await startServer();
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }
);

let failures = 0;
console.log(`flame browser smoke (${path.relative(root, distDir)})`);
try {
  for (const spec of pages) {
    const problems = await checkPage(browser, origin, spec);
    if (problems.length === 0) {
      console.log(`  ok   ${spec.path}${spec.hydrated ? " (hydrated + interactive)" : ""}`);
    } else {
      failures += 1;
      console.log(`  FAIL ${spec.path}`);
      for (const problem of problems) console.log(`       ${problem}`);
    }
  }
} finally {
  await browser.close();
  server.close();
}

if (failures > 0) {
  console.error(`\nflame browser smoke failed: ${failures} of ${pages.length} pages`);
  process.exit(1);
}

console.log(`\nflame browser smoke passed: ${pages.length} pages`);
