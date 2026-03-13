#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const cliDir = __dirname;
const distDir = path.join(cliDir, 'dist');
const templateSourceDir = path.join(cliDir, '..', 'template');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy all templates from packages/template/* to packages/cli/dist/*
if (fs.existsSync(templateSourceDir)) {
  const templates = fs.readdirSync(templateSourceDir, { withFileTypes: true });
  
  for (const template of templates) {
    if (!template.isDirectory()) continue;
    
    const src = path.join(templateSourceDir, template.name);
    const dest = path.join(distDir, template.name);
    
    // Remove existing dest if it exists
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
    
    // Recursively copy
    copyDirectoryRecursive(src, dest);
    console.log(`✓ Bundled template: ${template.name}`);
  }
  
  console.log(`✓ Templates bundled to ${distDir}`);
} else {
  console.error(`✗ Template source directory not found: ${templateSourceDir}`);
  process.exit(1);
}

function copyDirectoryRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      // Skip symlinks
      continue;
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
