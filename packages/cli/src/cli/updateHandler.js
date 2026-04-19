import { execSync, execFileSync } from "child_process";
import ora from "ora";
import fs from "fs";
import os from "os";
import path from "path";
import { lt } from "semver";

// Changelog store to avoid showing same version multiple times
const _CHANGELOG_STORE = path.join(os.homedir(), ".docubook_cli_seen_changelogs.json");
const _PREFERENCES_FILE = path.join(os.homedir(), ".docubook_cli_prefs.json");

function _readChangelogStore() {
  try {
    const raw = fs.readFileSync(_CHANGELOG_STORE, "utf8");
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

function _writeChangelogStore(obj) {
  try {
    fs.writeFileSync(_CHANGELOG_STORE, JSON.stringify(obj, null, 2), { mode: 0o600 });
  } catch {
    // non-fatal
  }
}

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
    fs.writeFileSync(_PREFERENCES_FILE, JSON.stringify(obj, null, 2), { mode: 0o600 });
  } catch {
    // non-fatal
  }
}

function getPreferredPackageManager() {
  const prefs = _readPreferences();
  if (prefs.packageManager) return prefs.packageManager;
  return detectInstalledPackageManager();
}

function setPreferredPackageManager(pm) {
  if (!pm) return;
  const prefs = _readPreferences();
  prefs.packageManager = pm;
  _writePreferences(prefs);
}

/**
 * Detect which package manager was used to install this CLI globally
 * Returns: 'npm', 'bun', 'yarn', or 'pnpm'
 */
function detectInstalledPackageManager() {
  try {
    // Check npm_config_user_agent environment variable (set by package manager when running scripts)
    const userAgent = process.env.npm_config_user_agent || "";
    if (userAgent.includes("npm")) return "npm";
    if (userAgent.includes("pnpm")) return "pnpm";
    if (userAgent.includes("yarn")) return "yarn";
    if (userAgent.includes("bun")) return "bun";

    // Fallback: check what's available in PATH
    // Priority: npm > bun > yarn > pnpm (based on common usage and reliability)
    try {
      execSync("npm --version", { stdio: "ignore" });
      return "npm";
    } catch {
      // try next
    }

    try {
      execSync("pnpm --version", { stdio: "ignore" });
      return "pnpm";
    } catch {
      // try next
    }

    try {
      execSync("yarn --version", { stdio: "ignore" });
      return "yarn";
    } catch {
      // try next
    }

    try {
      execSync("bun --version", { stdio: "ignore" });
      return "bun";
    } catch {
      // try next
    }

    // Default to npm
    return "npm";
  } catch {
    return "npm";
  }
}

/**
 * Fetch release info from GitHub API
 * Returns: { tag_name, name, body, created_at, html_url } or null
 */
async function fetchLatestReleaseFromGitHub() {
  try {
    const owner = "DocuBook";
    const repo = "docubook";
    const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

    const res = await fetch(url, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();

    // Ensure it's a cli release
    if (!data.tag_name || !data.tag_name.startsWith("cli-v")) {
      return null;
    }

    return {
      tag_name: data.tag_name,
      name: data.name,
      body: data.body || "",
      created_at: data.created_at,
      html_url: data.html_url,
    };
  } catch {
    return null;
  }
}

/**
 * Extract first 5 non-empty lines from changelog text
 * Empty lines are skipped and don't count toward the limit
 * @param {string} text - Full changelog text
 * @returns {string} - First 5 non-empty lines joined with newline
 */
function extractFirst5Lines(text) {
  if (!text) return "";

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.slice(0, 5).join("\n");
}

/**
 * Fetch and display changelog from GitHub release
 * Shows only the first 5 non-empty lines from release body
 */
async function showChangelogOnce(pkgName, version, releaseInfo) {
  try {
    const store = _readChangelogStore();
    const seen = Array.isArray(store[pkgName]) ? store[pkgName] : [];
    if (seen.includes(version)) return;

    // Use release body only
    if (!releaseInfo || !releaseInfo.body) return;

    const changelogPreview = extractFirst5Lines(releaseInfo.body);
    if (!changelogPreview) return;

    // Print changelog preview
    console.log("");
    console.log(changelogPreview);
    console.log("");
    console.log(`Full changelog: ${releaseInfo.html_url}\n`);

    // Mark as shown
    store[pkgName] = Array.from(new Set([...seen, version]));
    _writeChangelogStore(store);
  } catch {
    // silent on any error - changelog is a nicety
  }
}

/**
 * Install package using detected package manager
 * Supports npm, bun, yarn, and pnpm
 */
function installGlobal(packageName, version, packageManager) {
  let command;
  let args;

  switch (packageManager) {
    case "pnpm":
      command = "pnpm";
      args = ["add", "-g", `${packageName}@${version}`];
      break;
    case "bun":
      command = "bun";
      args = ["add", "-g", `${packageName}@${version}`];
      break;
    case "yarn":
      command = "yarn";
      args = ["global", "add", `${packageName}@${version}`];
      break;
    case "npm":
    default:
      command = "npm";
      args = ["install", "-g", `${packageName}@${version}`];
      break;
  }

  try {
    // Show full output during installation
    execFileSync(command, args, { stdio: "inherit" });
  } catch (error) {
    // Propagate error - respect user's chosen PM
    throw error;
  }

  // Clear package manager cache to ensure symlinks are refreshed
  try {
    switch (packageManager) {
      case "npm":
        execSync("npm cache clean --force", { stdio: "pipe" });
        break;
      case "yarn":
        execSync("yarn cache clean", { stdio: "pipe" });
        break;
      case "pnpm":
        execSync("pnpm store prune", { stdio: "pipe" });
        break;
      case "bun":
        execSync("bun pm cache rm", { stdio: "pipe" });
        break;
    }
  } catch {
    // Ignore cache clean errors - they don't affect installation
  }
}

/**
 * Main update handler: check for updates and install if available
 */
export async function handleUpdate(currentVersion) {
  const pkgName = "@docubook/cli";
  let spinner;

  try {
    // Detect package manager (in preference order: persisted > env/argv)
    const packageManager = getPreferredPackageManager();
    setPreferredPackageManager(packageManager);

    // Print a Terminal UI friendly note
    console.log(`Package manager used for update: ${packageManager}`);

    // Fetch package metadata from npm registry
    const encoded = encodeURIComponent(pkgName);
    spinner = ora("Checking for updates...").start();

    const res = await fetch(`https://registry.npmjs.org/${encoded}`);
    if (!res.ok) {
      spinner.fail(`Failed to fetch registry metadata (status ${res.status})`);
      throw new Error(`Failed to fetch registry metadata (status ${res.status})`);
    }

    const data = await res.json();
    const latest = data && data["dist-tags"] && data["dist-tags"].latest;
    if (!latest) {
      spinner.fail("Could not determine latest version from npm registry");
      throw new Error("Could not determine latest version from npm registry");
    }

    // Stop spinner and print a plain line
    if (spinner && typeof spinner.stop === "function") spinner.stop();
    console.log("Checking for updates...");

    if (!lt(currentVersion, latest)) {
      console.log(
        `No update needed, current version is ${currentVersion}, latest release is ${latest}`
      );
      return;
    }

    console.log(
      `Updating ${pkgName} from ${currentVersion} to ${latest} using ${packageManager}...`
    );

    // Fetch release info from GitHub
    const releaseInfo = await fetchLatestReleaseFromGitHub();

    // Install using detected package manager
    try {
      installGlobal(pkgName, latest, packageManager);
      console.log(`Successfully updated to ${latest}`);

      // Try to show changelog for the newly installed version once
      try {
        await showChangelogOnce(pkgName, latest, releaseInfo);
      } catch {
        // non-fatal
      }
    } catch (installErr) {
      // If install fails, provide a helpful message
      const cmd = `${packageManager === "pnpm" ? "pnpm add -g" : packageManager === "yarn" ? "yarn global add" : packageManager === "bun" ? "bun add -g" : "npm install -g"} ${pkgName}@${latest}`;
      console.error(`Update failed: ${installErr.message || installErr}`);
      console.error(
        `Try running the following command manually:\n  ${cmd}\n` +
          `If you see permissions errors, consider running with elevated privileges or using a Node version manager.`
      );
      process.exitCode = 1;
    }
  } catch (err) {
    // ensure spinner is stopped on error
    if (spinner && typeof spinner.stop === "function") spinner.stop();
    console.error(err.message || err);
    process.exitCode = 1;
  }
}
