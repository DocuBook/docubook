#!/usr/bin/env node

import { initializeProgram } from "./cli/program.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version from package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const VERSION = packageJson.version;

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
