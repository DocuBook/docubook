import enquirer from "enquirer";
import { detectDefaultPackageManager, getPackageManagerVersion } from "../utils/packageManager.js";
import log from "../utils/logger.js";

const { prompt } = enquirer;

/**
 * Collects user input for project creation
 * @returns {Promise<Object>} User answers
 */
export async function collectUserInput() {
  const answers = await prompt([
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
      initial: detectDefaultPackageManager(),
    },
    {
      type: "confirm",
      name: "installNow",
      message: "🛠️  Install dependencies now?",
      initial: true,
    },
  ]);

  // Validate package manager is installed
  const { packageManager } = answers;
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
