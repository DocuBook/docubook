/**
 * Centralized version reading from package.json
 * Ensures consistent version across the entire CLI
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedVersion = null;

/**
 * Read version from package.json (cached)
 * @returns {string} Package version
 */
export function getVersion() {
  if (cachedVersion) return cachedVersion;

  try {
    const packageJsonPath = path.join(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    cachedVersion = packageJson.version || "0.1.0";
    return cachedVersion;
  } catch (error) {
    console.warn("Failed to read version from package.json, using fallback");
    return "0.1.0";
  }
}
