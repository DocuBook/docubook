import { program } from "commander";
import { collectUserInput } from "./promptHandler.js";
import { createProject } from "../installer/projectInstaller.js";
import log from "../utils/logger.js";
import { renderWelcome, renderDone, renderError } from "../tui/renderer.js";
import { CLIState } from "../tui/state.js";
import { detectPackageManager, getPackageManagerInfo, getPackageManagerVersion } from "../utils/packageManagerDetect.js";
import { getAvailableTemplates, getTemplate, getDefaultTemplate } from "../utils/templateDetect.js";
import { execSync } from "child_process";
import ora from "ora";

/**
 * Initializes the CLI program
 * @param {string} version - Package version
 */
export function initializeProgram(version) {
  program
    .version(version)
    .description("CLI to create a new DocuBook project");

  // Add `update` command: check npm registry and install latest globally if needed
  program
    .command("update")
    .description("Check for updates and install the latest DocuBook CLI globally")
    .action(async () => {
      const pkgName = "@docubook/cli";
      try {
        // Fetch package metadata from npm registry
        const encoded = encodeURIComponent(pkgName);
        const spinner = ora('Checking for updates...').start();
        const res = await fetch(`https://registry.npmjs.org/${encoded}`);
        if (!res.ok) {
          spinner.fail(`Failed to fetch registry metadata (status ${res.status})`);
          throw new Error(`Failed to fetch registry metadata (status ${res.status})`);
        }
        const data = await res.json();
        const latest = data && data["dist-tags"] && data["dist-tags"].latest;
        if (!latest) {
          spinner.fail("Could not determine latest version from npm registry");
          throw new Error("Could not determine latest version from npm registry");
        }

        // Stop spinner but keep the "Checking for updates..." line above
        spinner.stop();

        if (latest === version) {
          console.log(`No update needed, current version is ${version}, fetched latest release is ${latest}`);
          return;
        }

        console.log(`Updating ${pkgName} from ${version} to ${latest}...`);

        // Use npm to install globally. This will stream stdout/stderr to the user.
        const cmd = `npm install -g ${pkgName}@${latest}`;
        try {
          execSync(cmd, { stdio: "inherit" });
          console.log(`Successfully updated to ${latest}`);
        } catch (installErr) {
          // If install fails, provide a helpful message
          console.error(`Update failed: ${installErr.message || installErr}`);
          console.error(`Try running the following command manually:\n  ${cmd}\nIf you see permissions errors, consider running with elevated privileges or using a Node version manager.`);
          process.exitCode = 1;
        }
      } catch (err) {
        // ensure spinner is stopped on error
        try { ora().stop && spinner.stop(); } catch (e) {}
        console.error(err.message || err);
        process.exitCode = 1;
      }
    });

  // Default behavior (create project)
  program
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
        renderDone(userInput.directoryName, detectedPM, pmInfo.devCmd, userInput.autoInstall !== false);
      } catch (err) {
        renderError(err.message || "An unexpected error occurred.");
        log.error(err.message || "An unexpected error occurred.");
        process.exit(1);
      }
    });

  return program;
}
