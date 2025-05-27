import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Gets the version of the specified package manager
 * @param {string} pm - Package manager name
 * @returns {string|null} Version string or null if not installed
 */
export function getPackageManagerVersion(pm) {
  try {
    return execSync(`${pm} --version`).toString().trim();
  } catch {
    return null;
  }
}

/**
 * Detects the default package manager from user environment
 * @returns {string} Default package manager name
 */
export function detectDefaultPackageManager() {
  const userAgent = process.env.npm_config_user_agent || "";
  if (userAgent.includes("pnpm")) return "pnpm";
  if (userAgent.includes("yarn")) return "yarn";
  if (userAgent.includes("bun")) return "bun";
  return "npm";
}

/**
 * Updates postcss config file extension for Bun compatibility
 * @param {string} projectPath - Path to the project directory
 */
export function updatePostcssConfig(projectPath) {
  const oldPath = path.join(projectPath, "postcss.config.js");
  const newPath = path.join(projectPath, "postcss.config.cjs");
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
  }
}

/**
 * Configures package manager specific settings
 * @param {string} packageManager - Package manager name
 * @param {string} projectPath - Path to the project directory
 */
export function configurePackageManager(packageManager, projectPath) {
  if (packageManager === "bun") {
    updatePostcssConfig(projectPath);
  } else if (packageManager === "yarn") {
    const yarnrcPath = path.join(projectPath, ".yarnrc.yml");
    fs.writeFileSync(yarnrcPath, "nodeLinker: node-modules\n");
  }
}
