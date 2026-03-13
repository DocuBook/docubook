import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get list of available templates
export function getAvailableTemplates() {
  // Try to load from templates.json first (works in published package and dev)
  try {
    const templatesJsonPath = path.join(__dirname, '..', '..', 'templates.json');
    if (fs.existsSync(templatesJsonPath)) {
      const content = fs.readFileSync(templatesJsonPath, 'utf-8');
      const data = JSON.parse(content);
      return data.templates || [];
    }
  } catch {
    // Fallback to directory scanning
  }

  // Fallback: scan template directories
  const distPath = path.join(__dirname, '..', '..', 'dist');
  const templateDir = fs.existsSync(distPath)
    ? distPath
    : path.join(__dirname, '..', '..', '..', '..', 'packages', 'template');

  if (!fs.existsSync(templateDir)) {
    return [];
  }

  const entries = fs.readdirSync(templateDir, { withFileTypes: true });
  const templates = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const configPath = path.join(templateDir, entry.name, 'template.config.json');

    if (!fs.existsSync(configPath)) continue;

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      templates.push({
        id: config.id || entry.name,
        name: config.name || entry.name,
        description: config.description,
        features: config.features,
      });
    } catch {
      console.error(`Failed to read template config for ${entry.name}`);
    }
  }

  return templates;
}

// Get template by id
export function getTemplate(templateId) {
  const templates = getAvailableTemplates();
  return templates.find(t => t.id === templateId);
}

// Get first available template (for default)
export function getDefaultTemplate() {
  const templates = getAvailableTemplates();
  return templates.length > 0 ? templates[0] : null;
}
