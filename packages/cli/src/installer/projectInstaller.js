import path from "path";
import fs from "fs";
import { URL } from "url";
import ora from "ora";
import chalk from "chalk";
import { execSync } from "child_process";
import prompts from "prompts";
import log from "../utils/logger.js";
import { displayManualSteps } from "../utils/display.js";
import { renderScaffolding } from "../tui/renderer.js";
import { getTemplate } from "../utils/templateDetect.js";

/**
 * Creates a new DocuBook project.
 * @param {Object} options - Installation options.
 */
export async function createProject(options) {
  const {
    directoryName,
    packageManager,
    template,
    autoInstall,
    docubookVersion,
    state
  } = options;

  const projectPath = path.resolve(process.cwd(), directoryName);

  if (fs.existsSync(projectPath)) {
    throw new Error(`Directory "${directoryName}" already exists.`);
  }

  log.info(`Creating a new DocuBook project in ${chalk.green(projectPath)}...`);

  try {
    state?.setStage('scaffolding');
    state?.setCurrentStep('Creating directories...');
    renderScaffolding(state || {});

    const templatePath = await getOrDownloadTemplate(template, state);

    if (!templatePath || !fs.existsSync(templatePath)) {
      throw new Error(`Template "${template}" could not be found or downloaded.`);
    }

    copyDirectoryRecursive(templatePath, projectPath);

    // 2. Update package.json
    state?.setCurrentStep("Updating project config...");
    renderScaffolding(state || {});
    const pkgPath = path.join(projectPath, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      pkg.name = directoryName;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    }

    if (autoInstall) {
      state?.setCurrentStep("Installing dependencies (this may take a few minutes)...");
      renderScaffolding(state || {});
      await installDependencies(directoryName, packageManager, projectPath, state);
      state?.setCurrentStep("Dependencies installed successfully.");
      renderScaffolding(state || {});
    } else {
      state?.setCurrentStep("Skipped automatic dependency installation.");
      renderScaffolding(state || {});
    }

    log.info(chalk.green(`Successfully created DocuBook project v${docubookVersion}`));
  } catch (err) {
    // Cleanup created directory on failure
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true });
    }
    throw err;
  }
}

/**
 * Gets template from local cache or downloads from GitHub
 * @param {string} templateId - Template ID
 * @param {Object} state - CLI state for progress updates
 * @returns {Promise<string>} Path to template directory
 */
async function getOrDownloadTemplate(templateId, state) {
  // Try local path first (for dev environment)
  const localPath = getLocalTemplatePath(templateId);
  if (localPath && fs.existsSync(localPath)) {
    return localPath;
  }

  // Download from GitHub
  state?.setCurrentStep("Downloading template...");
  renderScaffolding(state || {});

  const templateInfo = getTemplate(templateId);
  if (!templateInfo) {
    throw new Error(`Template "${templateId}" not found.`);
  }

  return await downloadTemplateFromGitHub(templateId, templateInfo.url);
}

/**
 * Gets local template path if it exists (for development)
 * @param {string} templateId - Template ID
 * @returns {string|null} Path to local template or null
 */
function getLocalTemplatePath(templateId) {
  const currentDir = new URL(".", import.meta.url).pathname;

  // Check dist/ folder first (if built)
  const distPath = path.join(currentDir, "..", "..", "dist", templateId);
  if (fs.existsSync(distPath)) {
    return distPath;
  }

  // Check packages/template/ folder (dev environment)
  const devPath = path.join(currentDir, "..", "..", "..", "..", "packages", "template", templateId);
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  return null;
}

/**
 * Downloads template from GitHub repository
 * @param {string} templateId - Template ID
 * @param {string} templateUrl - Template URL from templates.json
 * @returns {Promise<string>} Path to downloaded template
 */
async function downloadTemplateFromGitHub(templateId, templateUrl) {
  const tempDir = fs.mkdtempSync(path.join("/tmp", "docubook-"));

  try {
    // Build archive URL from template URL
    // https://github.com/DocuBook/docubook/tree/main/packages/template/nextjs-vercel
    // -> https://github.com/DocuBook/docubook/archive/refs/heads/main.tar.gz
    const repoMatch = templateUrl.match(/https:\/\/github\.com\/([^/]+\/[^/]+)\//);
    if (!repoMatch) {
      throw new Error(`Invalid template URL: ${templateUrl}`);
    }

    const archiveUrl = `https://github.com/${repoMatch[1]}/archive/refs/heads/main.tar.gz`;
    const archivePath = path.join(tempDir, "repo.tar.gz");

    // Show progress for download
    const downloadSpinner = ora(`Downloading template...`).start();

    try {
      execSync(`curl -L -o "${archivePath}" "${archiveUrl}"`, { stdio: "pipe" });
      downloadSpinner.succeed("Template downloaded");
    } catch (err) {
      downloadSpinner.fail("Failed to download template");
      throw err;
    }

    // Show progress for extraction
    const extractSpinner = ora(`Extracting template...`).start();

    try {
      execSync(`tar -xzf "${archivePath}" -C "${tempDir}"`, { stdio: "pipe" });
      extractSpinner.succeed("Template extracted");
    } catch (err) {
      extractSpinner.fail("Failed to extract template");
      throw err;
    }

    // Find template in extracted repo
    const repoName = repoMatch[1].split('/')[1];
    const extractedDir = path.join(tempDir, `${repoName}-main`, "packages", "template", templateId);

    if (!fs.existsSync(extractedDir)) {
      throw new Error(`Template "${templateId}" not found in repository.`);
    }

    return extractedDir;
  } catch (err) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw new Error(`Failed to download template: ${err.message}`);
  }
}

/**
 * Recursively copies a directory, skipping build artifacts and symlinks.
 * @param {string} source - Source directory path.
 * @param {string} destination - Destination directory path.
 */
function copyDirectoryRecursive(source, destination, depth = 0) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    // Skip build artifacts and node_modules at root level
    if (['node_modules', '.next', '.turbo', 'dist', 'build', '.cache'].includes(entry.name) && depth === 0) {
      continue;
    }

    // Skip symlinks and socket files
    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath, depth + 1);
    } else if (entry.isFile()) {
      try {
        fs.copyFileSync(srcPath, destPath);
      } catch (err) {
        // Skip files that can't be copied (sockets, etc)
        console.warn(`Skipped: ${entry.name} (${err.code})`);
      }
    }
  }
}

/**
 * Installs project dependencies.
 * @param {string} directoryName - Project directory name.
 * @param {string} packageManager - Package manager to use.
 * @param {string} projectPath - Path to the project directory.
 * @param {Object} state - CLI state for progress updates
 */
async function installDependencies(directoryName, packageManager, projectPath, state) {
  log.info("Installing dependencies...");
  state?.setCurrentStep(`Installing dependencies with ${packageManager}...`);
  renderScaffolding(state || {});

  const installSpinner = ora(`Running ${chalk.green(`${packageManager} install`)}...`).start();

  try {
    execSync(`${packageManager} install`, { cwd: projectPath, stdio: "inherit" });
    installSpinner.succeed("Dependencies installed successfully.");
  } catch (err) {
    installSpinner.fail("Failed to install dependencies.");
    state?.setError("Dependency installation failed.");
    renderScaffolding(state || {});

    // Offer retry if not in silent mode
    if (!state?.silent && !state?.json) {
      const answer = await prompts({
        type: 'confirm',
        name: 'retry',
        message: 'Would you like to retry installing dependencies?',
        initial: true,
      });

      if (answer.retry) {
        return installDependencies(directoryName, packageManager, projectPath, state);
      }
    }

    displayManualSteps(directoryName, packageManager);
    throw new Error("Dependency installation failed. Please run the commands above manually.");
  }
}
