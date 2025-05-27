import chalk from "chalk";
import figlet from "figlet";
import boxen from "boxen";
import cliProgress from "cli-progress";

/**
 * Displays ASCII art "DocuBook" when CLI is launched
 * @returns {Promise} Promise that resolves when ASCII art is displayed
 */
export function displayAsciiArt() {
  return new Promise((resolve, reject) => {
    figlet.text("DocuBook", { horizontalLayout: "full" }, (err, data) => {
      if (err) return reject(err);
      console.log(chalk.green(data));
      resolve();
    });
  });
}

/**
 * Displays a progress bar to simulate final setup
 * @returns {Promise} Promise that resolves when simulation completes
 */
export async function simulateInstallation() {
  const bar = new cliProgress.SingleBar(
    {
      format: 'Finishing Setup |' + chalk.green('{bar}') + '| {percentage}% || {value}/{total}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
    },
    cliProgress.Presets.shades_classic
  );

  bar.start(100, 0);
  for (let i = 0; i <= 100; i++) {
    await new Promise((r) => setTimeout(r, 50));
    bar.update(i);
  }
  bar.stop();
}

/**
 * Displays manual installation steps if automatic installation fails
 * @param {string} projectDirectory - Project directory name
 * @param {string} packageManager - Package manager being used
 */
export function displayManualSteps(projectDirectory, packageManager) {
  const manualInstructions = `
  Please follow these steps manually to finish setting up your project:

  1. ${chalk.cyan(`cd ${projectDirectory}`)}
  2. ${chalk.cyan(`${packageManager} install`)}
  3. ${chalk.cyan(`${packageManager} run dev`)}
  `;

  console.log(
    boxen(manualInstructions, {
      padding: 0.5,
      borderStyle: "round",
      borderColor: "cyan",
    })
  );
}

/**
 * Displays next steps after successful installation
 * @param {string} directoryName - Project directory name
 * @param {string} packageManager - Package manager being used
 */
export function displayNextSteps(directoryName, packageManager) {
  console.log(
    boxen(
      `Next Steps:\n\n` +
        `1. ${chalk.cyan(`cd ${directoryName}`)}\n` +
        `2. ${chalk.cyan(`${packageManager} run dev`)}`,
      {
        padding: 0.5,
        borderStyle: "round",
        borderColor: "cyan",
      }
    )
  );
}
