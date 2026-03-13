import { program } from "commander";
import { collectUserInput } from "./promptHandler.js";
import { createProject } from "../installer/projectInstaller.js";
import log from "../utils/logger.js";
import { renderWelcome, renderDone, renderError } from "../tui/renderer.js";
import { CLIState } from "../tui/state.js";
import { detectPackageManager, getPackageManagerInfo, getPackageManagerVersion } from "../utils/packageManagerDetect.js";
import { getAvailableTemplates, getTemplate, getDefaultTemplate } from "../utils/templateDetect.js";

/**
 * Initializes the CLI program
 * @param {string} version - Package version
 */
export function initializeProgram(version) {
  program
    .version(version)
    .description("CLI to create a new DocuBook project")
    .argument("[directory]", "The name of the project directory")
    .action(async (directory) => {
      const state = new CLIState();
      
      try {
        // Render welcome screen with version
        renderWelcome(version);
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Auto-detect package manager
        const detectedPM = detectPackageManager();
        const pmVersion = getPackageManagerVersion(detectedPM);
        state.setPackageManager(detectedPM);

        // Get user input
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
          const tmpl = getTemplate(selectedTemplate);
          state.setTemplate(tmpl?.name || selectedTemplate);
        } else {
          throw new Error("No templates available");
        }

        // Create project with all information
        await createProject({
          directoryName: userInput.directoryName,
          packageManager: detectedPM,
          packageManagerVersion: pmVersion,
          template: selectedTemplate,
          autoInstall: userInput.autoInstall !== false,
          docubookVersion: version,
          state: state, // Pass state for TUI updates
        });

        // Show success message
        const pmInfo = getPackageManagerInfo(detectedPM);
        renderDone(userInput.directoryName, detectedPM, pmInfo.devCmd);
      } catch (err) {
        renderError(err.message || "An unexpected error occurred.");
        log.error(err.message || "An unexpected error occurred.");
        process.exit(1);
      }
    });

  return program;
}
