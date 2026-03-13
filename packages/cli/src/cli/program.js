/* global fetch */
import { program } from "commander";
import { collectUserInput } from "./promptHandler.js";
import { createProject } from "../installer/projectInstaller.js";
import log from "../utils/logger.js";
import { renderWelcome, renderDone, renderError } from "../tui/renderer.js";
import { CLIState } from "../tui/state.js";
import { detectPackageManager, getPackageManagerInfo, getPackageManagerVersion } from "../utils/packageManagerDetect.js";
import { getAvailableTemplates, getTemplate, getDefaultTemplate } from "../utils/templateDetect.js";
import { execSync } from "child_process";
import ora from "ora";
import fs from "fs";
import os from "os";
import path from "path";

// Helpers to show changelog once per installed version. Stores shown versions under
// $HOME/.docubook_cli_seen_changelogs.json as a map: { "@docubook/cli": ["1.2.3"] }
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

async function _fetchChangelogFromGitHub(tag) {
  // Try to fetch CHANGELOG.md from the repo tag. Support several tag-name variants
  // (e.g. v1.2.3, 1.2.3, cli-v1.2.3, cli-1.2.3) and common filename variants.
  const repo = "DocuBook/docubook";

  const bare = tag.replace(/^v/, "");
  const variants = [tag, bare, `cli-${tag}`, `cli-${bare}`].filter(Boolean);

  const candidates = [];
  for (const v of variants) {
    candidates.push(`https://raw.githubusercontent.com/${repo}/${v}/CHANGELOG.md`);
    candidates.push(`https://raw.githubusercontent.com/${repo}/${v}/CHANGELOG.MD`);
  }
  // final fallback to main branch
  candidates.push(`https://raw.githubusercontent.com/${repo}/main/CHANGELOG.md`);

  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (res && res.ok) return await res.text();
    } catch {
      // ignore and try next
    }
  }
  return null;
}

function _extractVersionSection(changelogText, version) {
  if (!changelogText) return null;
  const lines = changelogText.split(/\r?\n/);
  // Look for headings that include the version (e.g. "## v1.2.3" or "## 1.2.3")
  const headerRe = new RegExp(`^#{1,3}\\s*(?:v)?${version.replace(/\./g, "\\.")}(?:\\b|\\D)`, "i");
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (headerRe.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start === -1) return changelogText.slice(0, 2000); // fallback: return beginning of changelog

  let end = lines.length;
  for (let j = start + 1; j < lines.length; j++) {
    if (/^#{1,3}\s*/.test(lines[j])) {
      end = j;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

async function showChangelogOnce(pkgName, version) {
  try {
    const store = _readChangelogStore();
    const seen = Array.isArray(store[pkgName]) ? store[pkgName] : [];
    if (seen.includes(version)) return;

    const tag = version.startsWith("v") ? version : `v${version}`;
    const changelog = await _fetchChangelogFromGitHub(tag);
    if (!changelog) return;

    const section = _extractVersionSection(changelog, version);
    if (!section) return;

    // Print a concise changelog section
    console.log("\n=== DocuBook CLI changelog (new) ===\n");
    console.log(section.trim());
    console.log("\n(End of changelog)\n");

    // Mark as shown
    store[pkgName] = Array.from(new Set([...seen, version]));
    _writeChangelogStore(store);
  } catch {
    // silent on any error - changelog is a nicety
  }
}


/**
 * Initializes the CLI program
 * @param {string} version - Package version
 */
export function initializeProgram(version) {
  program
    .version(version)
    .description("CLI to create a new DocuBook project");

  // Add `update` command: check npm registry and install latest globally if needed
  program
    .command("update")
    .description("Check for updates and install the latest DocuBook CLI globally")
    .action(async () => {
      const pkgName = "@docubook/cli";
      // declare spinner in outer scope so catch block can safely reference it
      let spinner;
      try {
        // Fetch package metadata from npm registry
        const encoded = encodeURIComponent(pkgName);
        spinner = ora('Checking for updates...').start();
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

        // Stop spinner and print a plain "Checking for updates..." line (no check mark)
        if (spinner && typeof spinner.stop === 'function') spinner.stop();
        console.log('Checking for updates...');

        if (latest === version) {
          console.log(`No update needed, current version is ${version}, fetched latest release is ${latest}`);
          return;
        }

        console.log(`Updating ${pkgName} from ${version} to ${latest}...`);

        // Use npm to install globally. This will stream stdout/stderr to the user.
        const cmd = `npm install -g ${pkgName}@${latest}`;
        try {
          execSync(cmd, { stdio: "inherit" });
          console.log(`Successfully updated to ${latest}`);
          // Try to show changelog for the newly installed version once
          try {
            await showChangelogOnce(pkgName, latest);
          } catch {
            // non-fatal
          }
        } catch (installErr) {
          // If install fails, provide a helpful message
          console.error(`Update failed: ${installErr.message || installErr}`);
          console.error(`Try running the following command manually:\n  ${cmd}\nIf you see permissions errors, consider running with elevated privileges or using a Node version manager.`);
          process.exitCode = 1;
        }
      } catch (err) {
        // ensure spinner is stopped on error
        if (spinner && typeof spinner.stop === 'function') spinner.stop();
        console.error(err.message || err);
        process.exitCode = 1;
      }
    });

  // Expose a `version` subcommand: `docubook version`
  program
    .command('version')
    .description('Print the DocuBook CLI version')
    .action(() => {
      console.log(`DocuBook CLI ${version}`);
      console.log("Run 'docubook update' to check for updates.");
      process.exit(0);
    });

  // Default behavior (create project)
  program
    .argument("[directory]", "The name of the project directory")
    .action(async (directory) => {
      const state = new CLIState();
      
      try {
        // Render welcome screen with version
        renderWelcome(version);
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Auto-detect package manager
        const detectedPM = detectPackageManager();
        const pmVersion = getPackageManagerVersion(detectedPM);
        state.setPackageManager(detectedPM);

        // Get user input
        const userInput = await collectUserInput(directory);
        state.setProjectName(userInput.directoryName);

        // Get available templates
        const templates = getAvailableTemplates();
        let selectedTemplate;

        if (templates.length === 1) {
          // Only one template, use it
          selectedTemplate = templates[0].id;
          state.setTemplate(templates[0].name);
        } else if (templates.length > 1) {
          // Multiple templates, let user choose
          selectedTemplate = userInput.template || getDefaultTemplate()?.id;
          const tmpl = getTemplate(selectedTemplate);
          state.setTemplate(tmpl?.name || selectedTemplate);
        } else {
          throw new Error("No templates available");
        }

        // Create project with all information
        await createProject({
          directoryName: userInput.directoryName,
          packageManager: detectedPM,
          packageManagerVersion: pmVersion,
          template: selectedTemplate,
          autoInstall: userInput.autoInstall !== false,
          docubookVersion: version,
          state: state, // Pass state for TUI updates
        });

        // Show success message
        const pmInfo = getPackageManagerInfo(detectedPM);
        renderDone(userInput.directoryName, detectedPM, pmInfo.devCmd, userInput.autoInstall !== false);
      } catch (err) {
        renderError(err.message || "An unexpected error occurred.");
        log.error(err.message || "An unexpected error occurred.");
        process.exit(1);
      }
    });

  return program;
}
