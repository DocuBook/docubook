import prompts from "prompts";
import { getAvailableTemplates } from "../utils/templateDetect.js";
import log from "../utils/logger.js";

/**
 * Collects user input for project creation
 * @param {string} [cliProvidedDir] - The directory name provided via CLI argument.
 * @returns {Promise<Object>} User answers
 */
export async function collectUserInput(cliProvidedDir) {
  let answers = {
    directoryName: cliProvidedDir
  };

  const questions = [
    {
      type: cliProvidedDir ? null : "text",
      name: "directoryName",
      message: "What is your project named?",
      initial: "my-docs",
      validate: (name) => name.trim().length > 0 ? true : "Project name cannot be empty.",
    },
    {
      type: "select",
      name: "template",
      message: "Select your template:",
      choices: getAvailableTemplates().map(t => ({
        title: `${t.name}`,
        description: t.description,
        value: t.id
      })),
      initial: 0,
    },
    {
      type: "confirm",
      name: "autoInstall",
      message: "Would you like to install dependencies now?",
      initial: true,
    },
  ];

  const promptAnswers = await prompts(questions, {
    onCancel: () => {
      log.error("Scaffolding cancelled.");
      process.exit(0);
    },
  });

  answers = { ...answers, ...promptAnswers };

  // Return all answers
  return {
    directoryName: answers.directoryName.trim(),
    template: answers.template,
    autoInstall: answers.autoInstall !== false,
  };
}
