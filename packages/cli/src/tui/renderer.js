import { colors, success, info, loading, dim } from './colors.js';
import { createWelcomeBanner, createScaffoldingBanner, createSuccessBanner, createBoxedMessage } from './ascii.js';
import { getVersion } from '../utils/version.js';

const version = getVersion();

export function renderWelcome() {
  console.clear();
  console.log('');
  console.log(createWelcomeBanner(version));
  console.log('');
}

export function renderScaffolding(state) {
  if (state.silent || state.json) return;

  if (!state.noClear) {
    console.clear();
  }
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

  if (state.stage) {
    console.log(info(`Stage: ${state.stage}`));
  }

  if (state.history?.length > 0) {
    console.log(dim(`Recent steps (${Math.min(5, state.history.length)}):`));
    state.history.slice(-5).forEach((entry, index) => {
      const prefix = index === state.history.slice(-5).length - 1 ? '→' : '•';
      console.log(`  ${prefix} ${entry}`);
    });
  }

  if (state.currentStep) {
    console.log(loading(`> ${state.currentStep}`));
  } else {
    console.log(loading('Preparing scaffolding...'));
  }

  console.log('');
}

export function renderDone(projectName, packageManager, nextCommand, installDependencies = true, state = {}) {
  const installCommand =
    packageManager === 'yarn' ? 'yarn install' :
      packageManager === 'pnpm' ? 'pnpm install' :
        packageManager === 'bun' ? 'bun install' :
          'npm install';

  const buildCommand =
    packageManager === 'yarn' ? 'yarn build' :
      packageManager === 'pnpm' ? 'pnpm build' :
        packageManager === 'bun' ? 'bun run build' :
          'npm run build';

  const startCommand =
    packageManager === 'yarn' ? 'yarn start' :
      packageManager === 'pnpm' ? 'pnpm start' :
        packageManager === 'bun' ? 'bun run start' :
          'npm run start';

  if (state.json) {
    // JSON output mode
    console.log(JSON.stringify({
      success: true,
      projectName,
      packageManager,
      autoInstall: installDependencies,
      template: state.template,
      history: state.history,
      nextSteps: {
        cd: projectName,
        install: installDependencies ? null : installCommand,
        dev: nextCommand,
        build: buildCommand,
        start: startCommand,
      },
    }, null, 2));
    return;
  }

  if (state.silent) return;

  if (!state.noClear) {
    console.clear();
  }
  console.log('');
  console.log(createSuccessBanner());
  console.log('');

  // Summary block for completed operation
  const completedLines = [
    `${colors.green}Project created successfully!${colors.reset}`,
    `${colors.cyan}Project:${colors.reset} ${projectName}`,
  ];

  if (state.template) {
    completedLines.push(`${colors.cyan}Template:${colors.reset} ${state.template}`);
  }
  if (packageManager) {
    completedLines.push(`${colors.cyan}Package Manager:${colors.reset} ${packageManager}`);
  }
  completedLines.push(`${colors.cyan}Auto install:${colors.reset} ${installDependencies ? 'Yes' : 'No'}`);

  console.log(createBoxedMessage('Completion Summary', completedLines, colors.cyan));

  const nextSteps = [
    `${colors.cyan}cd${colors.reset} ${projectName}`,
  ];

  // Add install step only if dependencies were not already installed
  if (!installDependencies) {
    nextSteps.push(`${colors.cyan}${installCommand}${colors.reset}`);
  }

  nextSteps.push(`${dim('Development:')}`);
  nextSteps.push(`${colors.cyan}${nextCommand}${colors.reset}`);
  nextSteps.push('');
  nextSteps.push(`${dim('Production:')}`);
  nextSteps.push(`${colors.cyan}${buildCommand}${colors.reset}`);
  nextSteps.push(`${colors.cyan}${startCommand}${colors.reset}`);
  nextSteps.push('');
  nextSteps.push(`${dim('📚 Documentation: https://docubook.pro')}`);

  console.log(createBoxedMessage('Next Steps', nextSteps, colors.green));
  console.log('');
}

export function renderError(message, state = {}) {
  if (state.json) {
    console.log(JSON.stringify({
      success: false,
      error: message,
    }, null, 2));
    return;
  }

  if (state.silent) return;

  if (!state.noClear) {
    console.clear();
  }
  console.log('');
  console.log(`${colors.magenta}✗ Error${colors.reset}`);
  console.log(message);
  console.log('');
}

export function renderBoxedMessage(title, content, color = colors.yellow) {
  console.log(createBoxedMessage(title, content, color));
}
