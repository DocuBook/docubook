import path from "path";
import fs from "fs";
import ora from "ora";
import chalk from "chalk";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import log from "../utils/logger.js";
import { configurePackageManager } from "../utils/packageManager.js";
import { displayManualSteps, simulateInstallation, displayNextSteps } from "../utils/display.js";

/**
 * Creates a new DocuBook project
 * @param {Object} options - Installation options
 * @param {string} options.directoryName - Project directory name
 * @param {string} options.packageManager - Package manager to use
 * @param {string} options.version - Package manager version
 * @param {boolean} options.installNow - Whether to install dependencies immediately
 * @returns {Promise<void>}
 */
export async function createProject({ directoryName, packageManager, version, installNow }) {
  const projectPath = path.resolve(process.cwd(), directoryName);
  const spinner = ora("Creating your DocuBook project...").start();

  try {
    // Get the template directory path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const templatePath = path.join(__dirname, "../dist");

    // Create project directory if it doesn't exist
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    // Copy template files to project directory
    copyDirectoryRecursive(templatePath, projectPath);

    // Configure package manager specific settings
    configurePackageManager(packageManager, projectPath);

    // Update package.json with package manager info
    const pkgPath = path.join(projectPath, "package.json");
    let pkgVersion = "";
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      pkg.packageManager = `${packageManager}@${version}`;
      pkgVersion = pkg.version || "";
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    }

    spinner.succeed();
    log.success(`DocuBook v${pkgVersion} using "${packageManager}"`);

    if (!installNow) {
      displayManualSteps(directoryName, packageManager);
      return;
    }

    await installDependencies(directoryName, packageManager, projectPath);
  } catch (err) {
    spinner.fail("Failed to create project.");
    log.error(err.message);
    throw err;
  }
}

/**
 * Recursively copies a directory
 * @param {string} source - Source directory path
 * @param {string} destination - Destination directory path
 */
function copyDirectoryRecursive(source, destination) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Read source directory contents
  const entries = fs.readdirSync(source, { withFileTypes: true });

  // Process each entry
  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    // If entry is a directory, recursively copy it
    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      // Otherwise, copy the file
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Installs project dependencies
 * @param {string} directoryName - Project directory name
 * @param {string} packageManager - Package manager to use
 * @param {string} projectPath - Path to the project directory
 * @returns {Promise<void>}
 */
async function installDependencies(directoryName, packageManager, projectPath) {
  log.info("Installing dependencies...");
  console.log(chalk.yellow("This is a joke for you:"));
  console.log(
    chalk.white(
      "You don't need to worry about this process not running, you just need the latest device for a faster installation process."
    )
  );

  const installSpinner = ora(`Using ${packageManager}...`).start();

  try {
    execSync(`${packageManager} install`, { cwd: projectPath, stdio: "ignore" });
    installSpinner.succeed("Dependencies installed.");

    await simulateInstallation();
    displayNextSteps(directoryName, packageManager);
  } catch (error) {
    installSpinner.fail("Failed to install dependencies.");
    displayManualSteps(directoryName, packageManager);
    throw new Error("Failed to install dependencies");
  }
}
