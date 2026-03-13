import { colors, success, info, loading, dim } from './colors.js';
import { createWelcomeBanner, createScaffoldingBanner, createSuccessBanner } from './ascii.js';

const BORDER_WIDTH = 40;

function createBorder() {
  return '╭' + '─'.repeat(BORDER_WIDTH - 2) + '╮';
}

function createBottomBorder() {
  return '╰' + '─'.repeat(BORDER_WIDTH - 2) + '╯';
}

function padLine(text) {
  const padding = BORDER_WIDTH - 4 - (text.replace(/\x1b\[\d+m/g, '').length);
  return '│ ' + text + ' '.repeat(Math.max(0, padding)) + ' │';
}

export function renderWelcome(version = '0.1.0') {
  console.clear();
  console.log('');
  console.log(createWelcomeBanner(version));
  console.log('');
}

export function renderScaffolding(state) {
  console.clear();
  console.log('');
  console.log(createScaffoldingBanner());
  console.log('');
  
  if (state.projectName) {
    console.log(padLine(info(`Project: ${state.projectName}`)));
  }
  
  if (state.packageManager) {
    console.log(padLine(success(`Package Manager: ${state.packageManager}`)));
  }
  
  if (state.template) {
    console.log(padLine(success(`Template: ${state.template}`)));
  }
  
  if (state.currentStep) {
    console.log(padLine(loading(state.currentStep)));
  }
  
  console.log('');
}

export function renderDone(projectName, packageManager, nextCommand) {
  console.clear();
  console.log('');
  console.log(createSuccessBanner());
  console.log('');
  console.log(padLine(''));
  console.log(padLine(dim('Next steps:')));
  console.log(padLine(dim(`  cd ${projectName}`)));
  console.log(padLine(dim(`  ${nextCommand}`)));
  console.log(padLine(''));
  console.log(padLine(dim(`Documentation: https://docubook.pro`)));
  console.log(padLine(''));
}

export function renderError(message) {
  console.clear();
  console.log('');
  console.log(createBorder());
  console.log(padLine(''));
  console.log(padLine(colors.magenta + '✗ Error' + colors.reset));
  console.log(padLine(''));
  console.log(padLine(message));
  console.log(padLine(''));
  console.log(createBottomBorder());
  console.log('');
}
