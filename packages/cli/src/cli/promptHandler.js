/* global process */
import prompts from "prompts";
import path from "path";
import fs from "fs";
import { getAvailableTemplates } from "../utils/templateDetect.js";

/**
 * Collects user input for project creation
 * @param {string} [cliProvidedDir] - The directory name provided via CLI argument.
 * @returns {Promise<Object>} User answers
 */
export async function collectUserInput(cliProvidedDir) {
  const normalizedCliDir =
    typeof cliProvidedDir === "string" ? cliProvidedDir.trim() : cliProvidedDir;

  if (typeof normalizedCliDir === "string") {
    if (normalizedCliDir.length === 0) {
      throw new Error("Project name cannot be empty.");
    }
    if (fs.existsSync(path.resolve(process.cwd(), normalizedCliDir))) {
      throw new Error(
        `The directory "${normalizedCliDir}" already exists. Choose a different name.`
      );
    }
  }

  let answers = {
    directoryName: normalizedCliDir,
  };

  const availableTemplates = getAvailableTemplates();
  if (availableTemplates.length === 0) {
    throw new Error("No templates available.");
  }

  const questions = [
    {
      type: cliProvidedDir ? null : "text",
      name: "directoryName",
      message: "What is your project named?",
      initial: "my-docs",
      validate: (name) => {
        const trimmed = name.trim();
        if (trimmed.length === 0) {
          return "Project name cannot be empty.";
        }
        if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
          return "Project name can only contain letters, numbers, dots, hyphens, and underscores.";
        }
        if (fs.existsSync(path.resolve(process.cwd(), trimmed))) {
          return `The directory "${trimmed}" already exists. Choose a different name.`;
        }
        return true;
      },
    },
    {
      type: "select",
      name: "template",
      message: "Select your template:",
      choices: availableTemplates.map((template) => ({
        title: template.name,
        description: template.description,
        value: template.id,
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

  let wasCancelled = false;
  const promptAnswers = await prompts(questions, {
    onCancel: () => {
      wasCancelled = true;
      return false;
    },
  });

  if (wasCancelled) {
    throw new Error("Scaffolding cancelled.");
  }

  answers = { ...answers, ...promptAnswers };
  const directoryName =
    typeof answers.directoryName === "string" ? answers.directoryName.trim() : "";

  if (!directoryName) {
    throw new Error("Project name cannot be empty.");
  }

  // Return all answers
  return {
    directoryName,
    template: answers.template,
    autoInstall: answers.autoInstall !== false,
  };
}
