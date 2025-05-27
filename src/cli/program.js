import { program } from "commander";
import chalk from "chalk";
import { displayAsciiArt } from "../utils/display.js";
import { collectUserInput } from "./promptHandler.js";
import { createProject } from "../installer/projectInstaller.js";

/**
 * Initializes the CLI program
 * @param {string} version - Package version
 */
export function initializeProgram(version) {
  program
    .version(version)
    .description("CLI to create a new Docubook project")
    .action(async () => {
      try {
        await displayAsciiArt();
        console.log(chalk.white("DocuBook Installer\n"));

        // Collect user input
        const options = await collectUserInput();

        // Create project with collected options
        await createProject(options);
      } catch (err) {
        // Error handling is done in the respective modules
        process.exit(1);
      }
    });

  return program;
}
