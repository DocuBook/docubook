import chalk from "chalk";
import boxen from "boxen";

/**
 * Displays manual installation steps if automatic installation fails.
 * @param {string} projectDirectory - Project directory name.
 * @param {string} packageManager - Package manager being used.
 */
export function displayManualSteps(projectDirectory, packageManager) {
  const steps = `
  ${chalk.yellow("Automatic installation failed.")} Please finish setup manually:

  1. ${chalk.blueBright(`cd ${projectDirectory}`)}
  2. ${chalk.blueBright(`${packageManager} install`)}
  3. ${chalk.blueBright(`${packageManager} run dev`)}
  `;
  console.log(
    boxen(steps, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "yellow",
      title: "Manual Setup Required",
      titleAlignment: "center",
    })
  );
}