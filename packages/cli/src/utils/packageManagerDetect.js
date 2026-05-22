import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const _DOCUBOOK_DIR = path.join(os.homedir(), ".docubook");
const _PREFERENCES_FILE = path.join(_DOCUBOOK_DIR, "cli-config.json");

function _readPreferences() {
  try {
    const raw = fs.readFileSync(_PREFERENCES_FILE, "utf8");
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

function _writePreferences(obj) {
  try {
    if (!fs.existsSync(_DOCUBOOK_DIR)) {
      fs.mkdirSync(_DOCUBOOK_DIR, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(_PREFERENCES_FILE, JSON.stringify(obj, null, 2), { mode: 0o600 });
  } catch {
    // non-fatal
  }
}

/**
 * Detect which package manager is available.
 * Checks npm_config_user_agent env var first, then falls back to testing
 * actual availability in PATH via execFileSync.
 * @returns {string} Package manager name ('npm' | 'pnpm' | 'yarn' | 'bun')
 */
export function detectInstalledPackageManager() {
  const userAgent = process.env.npm_config_user_agent || "";
  if (userAgent.includes("pnpm")) return "pnpm";
  if (userAgent.includes("yarn")) return "yarn";
  if (userAgent.includes("bun")) return "bun";
  if (userAgent.includes("npm")) return "npm";

  // Fallback: check what's available in PATH
  const candidates = ["npm", "pnpm", "yarn", "bun"];
  for (const pm of candidates) {
    try {
      execFileSync(pm, ["--version"], { stdio: "ignore" });
      return pm;
    } catch {
      // try next
    }
  }

  return "npm";
}

/**
 * Get preferred package manager from persisted config, falling back to detection.
 * @returns {string} Package manager name
 */
export function getPreferredPackageManager() {
  const prefs = _readPreferences();
  if (prefs.packageManager) return prefs.packageManager;
  return detectInstalledPackageManager();
}

/**
 * Persist the preferred package manager to ~/.docubook/cli-config.json
 * @param {string} pm - Package manager name
 */
export function setPreferredPackageManager(pm) {
  if (!pm) return;
  const prefs = _readPreferences();
  prefs.packageManager = pm;
  _writePreferences(prefs);
}

// Get package manager info (static, cached)
const PACKAGE_MANAGER_INFO = {
  npm: {
    name: "npm",
    installCmd: "npm install",
    devCmd: "npm run dev",
  },
  yarn: {
    name: "yarn",
    installCmd: "yarn install",
    devCmd: "yarn dev",
  },
  pnpm: {
    name: "pnpm",
    installCmd: "pnpm install",
    devCmd: "pnpm dev",
  },
  bun: {
    name: "bun",
    installCmd: "bun install",
    devCmd: "bun run dev",
  },
};

/**
 * Get package manager info by name
 * @param {string} pm - Package manager name
 * @returns {Object} Package manager info
 */
export function getPackageManagerInfo(pm) {
  return PACKAGE_MANAGER_INFO[pm] || PACKAGE_MANAGER_INFO.npm;
}
