import path from "path";
import fs from "fs";
import ora from "ora";
import chalk from "chalk";
import { execSync } from "child_process";
import log from "../utils/logger.js";
import { configurePackageManager } from "../utils/packageManager.js";
import { displayManualSteps } from "../utils/display.js";
import { renderScaffolding } from "../tui/renderer.js";
import { getTemplatePath } from "../utils/templateDetect.js";

/**
 * Creates a new DocuBook project.
 * @param {Object} options - Installation options.
 */
export async function createProject(options) {
  const {
    directoryName,
    packageManager,
    packageManagerVersion,
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
    // 1. Create project directory and copy selected template
    state?.setCurrentStep("Creating directories...");
    renderScaffolding(state || {});
    
    const templatePath = getTemplatePath(template);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template "${template}" not found.`);
    }

    copyDirectoryRecursive(templatePath, projectPath);

    // 2. Configure package manager specific settings
    state?.setCurrentStep("Configuring package manager...");
    renderScaffolding(state || {});
    configurePackageManager(packageManager, projectPath);

    // 3. Update package.json
    state?.setCurrentStep("Updating project config...");
    renderScaffolding(state || {});
    const pkgPath = path.join(projectPath, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      pkg.name = directoryName;
      pkg.packageManager = `${packageManager}@${packageManagerVersion}`;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    }

    if (autoInstall) {
      state?.setCurrentStep("Installing dependencies...");
      renderScaffolding(state || {});
      await installDependencies(directoryName, packageManager, projectPath);
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
 * Recursively copies a directory.
 * @param {string} source - Source directory path.
 * @param {string} destination - Destination directory path.
 */
function copyDirectoryRecursive(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Installs project dependencies.
 * @param {string} directoryName - Project directory name.
 * @param {string} packageManager - Package manager to use.
 * @param {string} projectPath - Path to the project directory.
 */
async function installDependencies(directoryName, packageManager, projectPath) {
  log.info("Installing dependencies...");
  const installSpinner = ora(`Running ${chalk.green(`${packageManager} install`)}...`).start();

  try {
    execSync(`${packageManager} install`, { cwd: projectPath, stdio: "ignore" });
    installSpinner.succeed("Dependencies installed successfully.");
  } catch {
    installSpinner.fail("Failed to install dependencies.");
    displayManualSteps(directoryName, packageManager);
    throw new Error("Dependency installation failed.");
  }
}
