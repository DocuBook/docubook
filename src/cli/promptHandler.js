import enquirer from "enquirer";
import { detectDefaultPackageManager, getPackageManagerVersion } from "../utils/packageManager.js";
import log from "../utils/logger.js";

const { prompt } = enquirer;

/**
 * Detects if the command was run with yarn or yarn dlx
 * @returns {boolean}
 */
function isYarnCommand() {
  const userAgent = process.env.npm_config_user_agent || '';
  return userAgent.includes('yarn') || process.argv.some(arg => arg.includes('yarn'));
}

/**
 * Collects user input for project creation
 * @returns {Promise<Object>} User answers
 */
export async function collectUserInput() {
  // Skip installation prompt if running with yarn/yarn dlx
  const isYarn = isYarnCommand();
  const defaultPackageManager = detectDefaultPackageManager();

  // Get initial answers (directory name and package manager)
  const { directoryName, packageManager } = await prompt([
    {
      type: "input",
      name: "directoryName",
      message: "📁 Project name",
      initial: "docubook",
    },
    {
      type: "select",
      name: "packageManager",
      message: "📦 Package manager",
      choices: ["npm", "pnpm", "yarn", "bun"],
      initial: defaultPackageManager,
    }
  ]);

  // Only ask about installation if not using yarn
  let installNow = false;
  if (packageManager !== 'yarn') {
    const { shouldInstall } = await prompt({
      type: "confirm",
      name: "shouldInstall",
      message: "🛠️  Install dependencies now?",
      initial: true,
    });
    installNow = shouldInstall;
  }

  // Prepare the answers object
  const answers = {
    directoryName,
    packageManager,
    installNow
  };

  // Validate package manager is installed
  const version = getPackageManagerVersion(packageManager);

  if (!version) {
    log.error(`${packageManager} is not installed on your system.`);
    process.exit(1);
  }

  return {
    ...answers,
    version
  };
}
