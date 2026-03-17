#!/usr/bin/env node

import { DocsTreeBuilder } from './index';
import path from 'path';

const args = process.argv.slice(2);

// Default values
const defaultDocsDir = './docs';
const defaultConfigPath = './docu.json';
const defaultOutputPath = './docs-tree.json';

let docsDir: string;
let configPath: string;
let outputPath: string;

if (args.length === 0) {
  // Use defaults
  docsDir = defaultDocsDir;
  configPath = defaultConfigPath;
  outputPath = defaultOutputPath;
} else if (args.length === 3) {
  [docsDir, configPath, outputPath] = args;
} else {
  console.error('Usage: docs-tree [docs-dir] [config-path] [output-path]');
  console.error('If no arguments provided, defaults will be used:');
  console.error(`  docs-dir: ${defaultDocsDir}`);
  console.error(`  config-path: ${defaultConfigPath}`);
  console.error(`  output-path: ${defaultOutputPath}`);
  process.exit(1);
}

const builder = new DocsTreeBuilder(
  path.resolve(docsDir),
  path.resolve(configPath),
  path.resolve(outputPath)
);

builder.build().catch(console.error);