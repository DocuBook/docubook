import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the dist directory where templates are bundled
function getTemplateDir() {
  // This will be in packages/cli/dist/ after build
  // But during dev, templates might be in ../../../packages/template/
  const distPath = path.join(__dirname, '..', '..', 'dist');
  
  // Check if dist exists, otherwise fallback to development path
  if (fs.existsSync(distPath)) {
    return distPath;
  }
  
  // Development: read from packages/template/
  return path.join(__dirname, '..', '..', '..', '..', 'packages', 'template');
}

// Get list of available templates
export function getAvailableTemplates() {
  const templateDir = getTemplateDir();
  
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

// Get template directory path
export function getTemplatePath(templateId) {
  const templateDir = getTemplateDir();
  return path.join(templateDir, templateId);
}

// Validate template exists
export function validateTemplate(templateId) {
  const templatePath = getTemplatePath(templateId);
  return fs.existsSync(templatePath);
}

// Get first available template (for default)
export function getDefaultTemplate() {
  const templates = getAvailableTemplates();
  return templates.length > 0 ? templates[0] : null;
}
