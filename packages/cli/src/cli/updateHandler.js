import { execSync, execFileSync } from "child_process";
import ora from "ora";
import fs from "fs";
import os from "os";
import path from "path";
import { lt } from "semver";

const _DOCUBOOK_DIR = path.join(os.homedir(), ".docubook");
const _CHANGELOGS_DIR = path.join(_DOCUBOOK_DIR, "changelogs");
const _PREFERENCES_FILE = path.join(_DOCUBOOK_DIR, "cli-config.json");

function _ensureChangelogsDir() {
  try {
    if (!fs.existsSync(_DOCUBOOK_DIR)) {
      fs.mkdirSync(_DOCUBOOK_DIR, { recursive: true, mode: 0o700 });
    }
    if (!fs.existsSync(_CHANGELOGS_DIR)) {
      fs.mkdirSync(_CHANGELOGS_DIR, { recursive: true, mode: 0o700 });
    }
  } catch {
    // non-fatal
  }
}

/**
 * Get changelog file path for a specific version
 * @param {string} version - Version string (e.g., "0.4.3")
 * @returns {string} - Full path to version changelog file
 */
function _getChangelogPath(version) {
  // Normalize version: remove 'v' prefix if present, sanitize for filename
  const normalized = version.replace(/^v/, "").replace(/[^\d.]/g, "");
  return path.join(_CHANGELOGS_DIR, `${normalized}.md`);
}

/**
 * Check if changelog for a version has been shown
 * @param {string} version - Version string
 * @returns {boolean} - True if already shown
 */
function _isChangelogShown(version) {
  const changelogPath = _getChangelogPath(version);
  try {
    return fs.existsSync(changelogPath);
  } catch {
    return false;
  }
}

/**
 * Mark changelog for a version as shown
 * @param {string} version - Version string
 */
function _markChangelogShown(version) {
  _ensureChangelogsDir();
  const changelogPath = _getChangelogPath(version);
  try {
    fs.writeFileSync(changelogPath, "# fetched\n", { mode: 0o600 });
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
    _ensureChangelogsDir();
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
 * Fetch CHANGELOG.md content from GitHub raw URL
 * @param {string} pkgPath - Path to package in monorepo (e.g., "packages/cli")
 * @returns {Promise<string>} - Raw changelog content
 */
async function fetchChangelogFromGitHub(pkgPath = "packages/cli") {
  try {
    const owner = "DocuBook";
    const repo = "docubook";
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${pkgPath}/CHANGELOG.md`;

    const res = await fetch(url);
    if (!res.ok) {
      return null;
    }
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Parse changelog and extract section for a specific version
 * Format expected: ## 0.4.3 followed by ### Patch Changes / ### Minor Changes
 * @param {string} changelog - Full changelog content
 * @param {string} version - Version to extract (e.g., "0.4.3")
 * @returns {string} - Parsed section or null
 */
function extractVersionSection(changelog, version) {
  if (!changelog || !version) return null;

  // Normalize version
  const normalizedVersion = version.replace(/^v/, "");
  const escapedVersion = normalizedVersion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const versionPattern = new RegExp(`^##\\s+${escapedVersion}`, "m");

  const match = changelog.match(versionPattern);
  if (!match) return null;

  // Get content after the version header until next version (##) or end
  const startIndex = match.index;
  const afterVersion = changelog.slice(startIndex);

  // Find next ## header or end of file
  const nextVersionMatch = afterVersion.match(/\n##\s+\d+\.\d+/);
  const endIndex = nextVersionMatch ? nextVersionMatch.index + startIndex : changelog.length;

  return changelog.slice(startIndex, endIndex).trim();
}

/**
 * Format changelog section as unordered list (max 5 lines)
 * @param {string} section - Parsed changelog section
 * @returns {string} - Formatted list
 */
function formatAsUnorderedList(section) {
  if (!section) return "";

  const lines = section.split("\n");
  const items = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Match bullet points: "- ", "* ", or "  - "
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.match(/^  - /)) {
      // Get the actual content after the bullet prefix
      const content = trimmed.replace(/^(\* |\- |  - )/, "").trim();
      if (content) {
        items.push(content);
      }
    }
    // Also match ### Patch Changes, ### Minor Changes, etc. headers
    else if (trimmed.startsWith("### ")) {
      items.push(`\n${trimmed.replace("### ", "**")}**`);
    }
  }

  // Limit to 5 items (excluding headers)
  const maxItems = 5;
  const result = [];
  let itemCount = 0;

  for (const item of items) {
    if (item.startsWith("**") && item.endsWith("**")) {
      // Header - always include
      result.push(item);
    } else if (itemCount < maxItems) {
      // Regular item - count toward limit
      result.push(`- ${item}`);
      itemCount++;
    }
  }

  return result.join("\n");
}

/**
 * Show changelog for a specific version
 * Fetches from GitHub, parses version section, formats as list
 */
async function showChangelogForVersion(pkgName, version) {
  try {
    // Check if already shown
    if (_isChangelogShown(version)) return;

    // Fetch changelog from GitHub
    const changelogContent = await fetchChangelogFromGitHub("packages/cli");
    if (!changelogContent) return;

    // Extract version section
    const versionSection = extractVersionSection(changelogContent, version);
    if (!versionSection) return;

    // Format as unordered list
    const formatted = formatAsUnorderedList(versionSection);
    if (!formatted) return;

    // Print changelog preview
    console.log("");
    console.log(`## ${version.replace(/^v/, "")}`);
    console.log(formatted);
    console.log("");
    console.log(`Full changelog: https://github.com/DocuBook/docubook/blob/main/packages/cli/CHANGELOG.md\n`);

    // Mark as shown
    _markChangelogShown(version);
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
    // Ensure changelogs directory exists
    _ensureChangelogsDir();

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
        await showChangelogForVersion(pkgName, latest);
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