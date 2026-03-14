// Detect package manager from environment and process arguments
// Used internally for auto-install, not for user prompting
function detectFromEnv() {
  const userAgent = process.env.npm_config_user_agent;
  if (!userAgent) return null;

  if (userAgent.includes('bun')) return 'bun';
  if (userAgent.includes('yarn')) return 'yarn';
  if (userAgent.includes('pnpm')) return 'pnpm';
  if (userAgent.includes('npm')) return 'npm';
  
  return null;
}

// Detect from process argv (how the CLI was invoked)
function detectFromArgv() {
  const argv1 = process.argv[1] || '';
  
  if (argv1.includes('bunx') || argv1.includes('bun')) return 'bun';
  if (argv1.includes('pnpm')) return 'pnpm';
  if (argv1.includes('yarn')) return 'yarn';
  if (argv1.includes('npx') || argv1.includes('npm')) return 'npm';
  
  return null;
}

/**
 * Detect which package manager invoked the CLI
 * Used internally for auto-install dependency resolution
 * @returns {string} Package manager name (default: 'npm')
 */
export function detectInstalledPackageManager() {
  const detected = detectFromEnv() || detectFromArgv();
  return detected || 'npm';
}

// Get package manager info (static, cached)
const PACKAGE_MANAGER_INFO = {
  npm: {
    name: 'npm',
    installCmd: 'npm install',
    devCmd: 'npm run dev',
  },
  yarn: {
    name: 'yarn',
    installCmd: 'yarn install',
    devCmd: 'yarn dev',
  },
  pnpm: {
    name: 'pnpm',
    installCmd: 'pnpm install',
    devCmd: 'pnpm dev',
  },
  bun: {
    name: 'bun',
    installCmd: 'bun install',
    devCmd: 'bun run dev',
  },
};

/**
 * Get package manager info by name
 * @param {string} pm - Package manager name
 * @returns {Object} Package manager info
 */
export function getPackageManagerInfo(pm) {
  return PACKAGE_MANAGER_INFO[pm] || PACKAGE_MANAGER_INFO.npm;
}
