import fs from "fs";
import path from "path";

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