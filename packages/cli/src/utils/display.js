import chalk from "chalk";
import boxen from "boxen";

/**
 * Displays manual installation steps if automatic installation fails.
 * @param {string} projectDirectory - Project directory name.
 * @param {string} packageManager - Package manager being used.
 */
export function displayManualSteps(projectDirectory, packageManager) {
  const installCommand =
    packageManager === "yarn" ? "yarn install" :
      packageManager === "pnpm" ? "pnpm install" :
        packageManager === "bun" ? "bun install" :
          "npm install";

  const devCommand =
    packageManager === "yarn" ? "yarn dev" :
      packageManager === "pnpm" ? "pnpm dev" :
        packageManager === "bun" ? "bun run dev" :
          "npm run dev";

  const buildCommand =
    packageManager === "yarn" ? "yarn build" :
      packageManager === "pnpm" ? "pnpm build" :
        packageManager === "bun" ? "bun run build" :
          "npm run build";

  const startCommand =
    packageManager === "yarn" ? "yarn start" :
      packageManager === "pnpm" ? "pnpm start" :
        packageManager === "bun" ? "bun run start" :
          "npm run start";

  const steps = `
  ${chalk.yellow("Automatic installation failed.")} Please finish setup manually:

  1. ${chalk.blueBright(`cd ${projectDirectory}`)}
  2. ${chalk.blueBright(installCommand)}
  3. ${chalk.blueBright(devCommand)}

  ${chalk.gray("Optional production check:")}
  4. ${chalk.blueBright(buildCommand)}
  5. ${chalk.blueBright(startCommand)}
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