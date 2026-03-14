/* global fetch */
import { execSync } from "child_process";
import ora from "ora";
import fs from "fs";
import os from "os";
import path from "path";
import { lt } from "semver";

// Changelog store to avoid showing same version multiple times
const _CHANGELOG_STORE = path.join(os.homedir(), ".docubook_cli_seen_changelogs.json");

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
    if (userAgent.includes("bun")) return "bun";
    if (userAgent.includes("yarn")) return "yarn";

    // Fallback: check what's available in PATH
    // Priority: npm > bun > yarn > pnpm (based on common usage and reliability)
    try {
      execSync("npm --version", { stdio: "ignore" });
      return "npm";
    } catch {
      // try next
    }

    try {
      execSync("bun --version", { stdio: "ignore" });
      return "bun";
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
      execSync("pnpm --version", { stdio: "ignore" });
      return "pnpm";
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
      headers: { "Accept": "application/vnd.github.v3+json" }
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
 * Generate changelog from git commits between two versions
 * Parses conventional commits and categorizes them
 */
async function generateChangelogFromCommits(fromTag, toTag) {
  try {
    // Get commits between two tags
    const cmd = `git log ${fromTag}..${toTag} --pretty=format:"%H|%s|%b" -- packages/cli/ 2>/dev/null || echo ""`;
    const output = execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] });

    if (!output || output.trim() === "") {
      return null;
    }

    const commits = output.trim().split("\n").filter(Boolean).map((line) => {
      const [hash, subject] = line.split("|");
      return { hash: hash.slice(0, 7), subject };
    });

    if (commits.length === 0) {
      return null;
    }

    // Categorize commits by conventional commit type
    const categories = {
      added: [],
      fixed: [],
      improved: [],
      deprecated: [],
      removed: [],
    };

    commits.forEach(({ hash, subject }) => {
      const repoUrl = "https://github.com/DocuBook/docubook/commit";
      const link = `[${hash}](${repoUrl}/${hash})`;

      if (subject.startsWith("feat") || subject.startsWith("feat:")) {
        categories.added.push(`- ${subject.replace(/^feat(\(.*?\))?:\s*/, "")} ${link}`);
      } else if (subject.startsWith("fix") || subject.startsWith("fix:")) {
        categories.fixed.push(`- ${subject.replace(/^fix(\(.*?\))?:\s*/, "")} ${link}`);
      } else if (subject.startsWith("perf") || subject.startsWith("refactor")) {
        categories.improved.push(`- ${subject.replace(/^(perf|refactor)(\(.*?\))?:\s*/, "")} ${link}`);
      } else if (subject.startsWith("deprecate")) {
        categories.deprecated.push(`- ${subject.replace(/^deprecate(\(.*?\))?:\s*/, "")} ${link}`);
      } else if (subject.startsWith("remove") || subject.startsWith("remove:")) {
        categories.removed.push(`- ${subject.replace(/^remove(\(.*?\))?:\s*/, "")} ${link}`);
      }
    });

    // Build markdown
    let markdown = "";
    if (categories.added.length > 0) {
      markdown += `### Added\n${categories.added.join("\n")}\n\n`;
    }
    if (categories.fixed.length > 0) {
      markdown += `### Fixed\n${categories.fixed.join("\n")}\n\n`;
    }
    if (categories.improved.length > 0) {
      markdown += `### Improved\n${categories.improved.join("\n")}\n\n`;
    }
    if (categories.deprecated.length > 0) {
      markdown += `### Deprecated\n${categories.deprecated.join("\n")}\n\n`;
    }
    if (categories.removed.length > 0) {
      markdown += `### Removed\n${categories.removed.join("\n")}\n\n`;
    }

    return markdown.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Fetch and display changelog from GitHub release
 * Uses git commits for structured changelog if available
 */
async function showChangelogOnce(pkgName, version, releaseInfo) {
  try {
    const store = _readChangelogStore();
    const seen = Array.isArray(store[pkgName]) ? store[pkgName] : [];
    if (seen.includes(version)) return;

    let changelog = "";

    // Try to generate from git commits first
    try {
      // Get the previous release tag
      const currentTag = `cli-v${version}`;
      const prevTagCmd = `git describe --tags --abbrev=0 ${currentTag}^ 2>/dev/null || echo ""`;
      const prevTag = execSync(prevTagCmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }).trim();

      if (prevTag && prevTag.startsWith("cli-v")) {
        const generatedChangelog = await generateChangelogFromCommits(prevTag, currentTag);
        if (generatedChangelog) {
          changelog = generatedChangelog;
        }
      }
    } catch {
      // fallback to release body
    }

    // Fallback to release body if no commits found
    if (!changelog && releaseInfo && releaseInfo.body) {
      changelog = releaseInfo.body.slice(0, 2000);
    }

    if (!changelog) return;

    // Print changelog
    console.log("\n===========================================================\n");
    console.log(`## ${releaseInfo?.tag_name || `cli-v${version}`}`);
    console.log("");
    console.log(changelog);
    console.log("\nFull changelog, visit:");
    console.log(`  ${releaseInfo?.html_url || `https://github.com/DocuBook/docubook/releases/tag/cli-v${version}`}\n`);

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
  let cmd;

  switch (packageManager) {
    case "pnpm":
      cmd = `pnpm add -g ${packageName}@${version}`;
      break;
    case "bun":
      cmd = `bun add -g ${packageName}@${version}`;
      break;
    case "yarn":
      cmd = `yarn global add ${packageName}@${version}`;
      break;
    case "npm":
    default:
      cmd = `npm install -g ${packageName}@${version}`;
      break;
  }

  try {
    // For Node ecosystem, try with stdio to user. For errors, we'll retry with npm.
    // For Bun, show full output since we won't fallback.
    const isBun = packageManager === "bun";
    execSync(cmd, { stdio: isBun ? "inherit" : ["pipe", "pipe", "pipe"] });
  } catch (error) {
    // For Node ecosystem (npm, pnpm, yarn), fallback to npm on failure
    // Bun is independent and should not fallback
    const nodeEcosystemPMs = ["npm", "pnpm", "yarn"];
    if (nodeEcosystemPMs.includes(packageManager)) {
      console.warn(`\n⚠️ Installation with ${packageManager} failed. Retrying with npm...\n`);
      execSync(`npm install -g ${packageName}@${version}`, { stdio: "inherit" });
      packageManager = "npm"; // Update for cache clearing below
    } else {
      // Bun or unknown - propagate error
      throw error;
    }
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
    // Detect package manager
    const packageManager = detectInstalledPackageManager();

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
    const releaseInfo = await fetchLatestReleaseFromGitHub(pkgName);

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
      const cmd = `${packageManager === "bun" ? "bun install -g" : packageManager === "yarn" ? "yarn global add" : "npm install -g"} ${pkgName}@${latest}`;
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
