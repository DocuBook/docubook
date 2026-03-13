import { colors, success, info, loading, dim } from './colors.js';
import { createWelcomeBanner, createScaffoldingBanner, createSuccessBanner, createBoxedMessage } from './ascii.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(__dirname, '../../package.json');
let version = '0.1.0';

try {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  version = packageJson.version || '0.1.0';
} catch {
  // Fallback to default version if package.json cannot be read
}

export function renderWelcome() {
  console.clear();
  console.log('');
  console.log(createWelcomeBanner(version));
  console.log('');
}

export function renderScaffolding(state) {
  console.clear();
  console.log('');
  console.log(createScaffoldingBanner());
  
  if (state.projectName) {
    console.log(info(`Project: ${state.projectName}`));
  }
  
  if (state.packageManager) {
    console.log(success(`Package Manager: ${state.packageManager}`));
  }
  
  if (state.template) {
    console.log(success(`Template: ${state.template}`));
  }
  
  if (state.currentStep) {
    console.log(loading(state.currentStep));
  }
  
  console.log('');
}

export function renderDone(projectName, packageManager, nextCommand, installDependencies = true) {
  console.clear();
  console.log('');
  console.log(createSuccessBanner());
  console.log('');
  
  // Determine install command based on package manager
  const installCommand = 
    packageManager === 'yarn' ? 'yarn install' :
    packageManager === 'pnpm' ? 'pnpm install' :
    packageManager === 'bun' ? 'bun install' :
    'npm install';
  
  const nextSteps = [
    `${colors.cyan}cd${colors.reset} ${projectName}`,
  ];

  // Add install step only if dependencies were not already installed
  if (!installDependencies) {
    nextSteps.push(`${colors.cyan}${installCommand}${colors.reset}`);
  }

  nextSteps.push(`${colors.cyan}${nextCommand}${colors.reset}`);
  nextSteps.push('');
  nextSteps.push(`${dim('📚 Documentation: https://docubook.pro')}`);
  
  console.log(createBoxedMessage('Next Steps', nextSteps, colors.green));
  console.log('');
}

export function renderError(message) {
  console.clear();
  console.log('');
  console.log(`${colors.magenta}✗ Error${colors.reset}`);
  console.log(message);
  console.log('');
}

export function renderBoxedMessage(title, content, color = colors.yellow) {
  console.log(createBoxedMessage(title, content, color));
}
