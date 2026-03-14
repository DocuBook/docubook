#!/usr/bin/env node

import { initializeProgram } from "./cli/program.js";
import { getVersion } from "./utils/version.js";

const VERSION = getVersion();

// Handle --version / -v early to print custom output
const args = process.argv.slice(2);
if (args.includes('--version') || args.includes('-v')) {
  console.log(`DocuBook CLI ${VERSION}`);
  console.log("Run 'docubook update' to check for updates.");
  process.exit(0);
}

// Initialize and parse CLI arguments
const program = initializeProgram(VERSION);
program.parse(process.argv);
