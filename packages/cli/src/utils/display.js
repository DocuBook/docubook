import chalk from "chalk";
import boxen from "boxen";
import cliProgress from "cli-progress";

/**
 * Displays an introduction message for the CLI.
 */
export function displayIntro() {
  console.log(`\n${chalk.bold.green("🚀 DocuBook Installer")}\n`);
}

/**
 * Displays a progress bar to simulate final setup.
 * @returns {Promise<void>} Promise that resolves when simulation completes.
 */
export async function simulateInstallation() {
  const bar = new cliProgress.SingleBar(
    {
      format: `Finishing setup... ${chalk.greenBright("{bar}")} | {percentage}%`,
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );

  bar.start(100, 0);
  for (let i = 0; i <= 100; i++) {
    await new Promise((r) => setTimeout(r, 20)); // Faster simulation
    bar.update(i);
  }
  bar.stop();
  console.log("\n");
}

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

/**
 * Displays next steps after successful installation.
 * @param {string} directoryName - Project directory name.
 * @param {string} packageManager - Package manager being used.
 */
export function displayNextSteps(directoryName, packageManager) {
  const steps = `
  ${chalk.bold("Next steps:")}

  1. ${chalk.blueBright(`cd ${directoryName}`)}
  2. ${chalk.blueBright(`${packageManager} run dev`)}
  `;

  console.log(
    boxen(steps, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "green",
      title: "Success!",
      titleAlignment: "center",
    })
  );
}