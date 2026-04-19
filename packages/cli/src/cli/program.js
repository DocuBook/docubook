import { program } from "commander";
import { collectUserInput } from "./promptHandler.js";
import { createProject } from "../installer/projectInstaller.js";
import { handleUpdate } from "./updateHandler.js";
import log from "../utils/logger.js";
import { renderWelcome, renderDone, renderError } from "../tui/renderer.js";
import { CLIState } from "../tui/state.js";
import {
  detectInstalledPackageManager,
  getPackageManagerInfo,
} from "../utils/packageManagerDetect.js";
import { getAvailableTemplates, getTemplate, getDefaultTemplate } from "../utils/templateDetect.js";

let isProgramInitialized = false;

/**
 * Initializes the CLI program
 * @param {string} version - Package version
 */
export function initializeProgram(version) {
  if (isProgramInitialized) {
    return program;
  }

  isProgramInitialized = true;

  program.version(version, "-v, --version").description("CLI to create a new DocuBook project");

  // Add `update` command: check npm registry and install latest globally if needed
  program
    .command("update")
    .description("Check for updates and install the latest DocuBook CLI globally")
    .action(async () => {
      await handleUpdate(version);
    });

  // Expose a `version` subcommand: `docubook version`
  program
    .command("version")
    .description("Print the DocuBook CLI version")
    .action(() => {
      console.log(`DocuBook CLI ${version}`);
      console.log("Run 'docubook update' to check for updates.");
      return;
    });

  // Default behavior (create project)
  program
    .argument("[directory]", "The name of the project directory")
    .option("--silent", "Silent mode (no interactive output)")
    .option("--json", "Output as JSON")
    .option("--no-clear", "Don't clear terminal (useful for debugging)")
    .action(async (directory, options) => {
      const state = new CLIState(options);

      try {
        // Render welcome screen with version (skip if silent)
        if (!state.silent && !state.json) {
          renderWelcome(version);
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        // Detect package manager used to invoke CLI (for auto-install)
        const packageManager = detectInstalledPackageManager();
        state.setPackageManager(packageManager);

        // Get user input (only project name if not provided)
        state.setStage("input");
        const userInput = await collectUserInput(directory);
        state.setProjectName(userInput.directoryName);

        // Get available templates
        const templates = getAvailableTemplates();
        let selectedTemplate;

        if (templates.length === 1) {
          // Only one template, use it
          selectedTemplate = templates[0].id;
          state.setTemplate(templates[0].name);
        } else if (templates.length > 1) {
          // Multiple templates, let user choose
          selectedTemplate = userInput.template || getDefaultTemplate()?.id;

          if (!selectedTemplate) {
            throw new Error("No default template configured. Please choose a template explicitly.");
          }

          const tmpl = getTemplate(selectedTemplate);
          if (!tmpl) {
            const availableTemplateIds = templates
              .map((templateItem) => templateItem.id)
              .join(", ");
            throw new Error(
              `Invalid template \"${selectedTemplate}\". Available templates: ${availableTemplateIds}`
            );
          }

          state.setTemplate(tmpl.name);
        } else {
          throw new Error("No templates available");
        }

        // Create project with all information
        await createProject({
          directoryName: userInput.directoryName,
          packageManager: packageManager,
          template: selectedTemplate,
          autoInstall: userInput.autoInstall !== false,
          docubookVersion: version,
          state: state, // Pass state for TUI updates
        });

        // Show success message
        const pmInfo = getPackageManagerInfo(packageManager);
        renderDone(
          userInput.directoryName,
          packageManager,
          pmInfo.devCmd,
          userInput.autoInstall !== false,
          state
        );
      } catch (error) {
        renderError(error.message || "An unexpected error occurred.", state);
        log.error(error.message || "An unexpected error occurred.");
        process.exit(1);
      }
    });

  return program;
}
