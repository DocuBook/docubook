import { execSync } from 'child_process';

// Map argv[1] patterns to package managers
const PM_DETECTION_MAP = {
  'npx': 'npm',
  'npm': 'npm',
  'bunx': 'bun',
  'bun': 'bun',
  'pnpm': 'pnpm',
  'yarn': 'yarn',
};

// Environment variable detection
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
  // process.argv[1] contains the command that was used
  const argv1 = process.argv[1] || '';
  
  for (const [pattern, pm] of Object.entries(PM_DETECTION_MAP)) {
    if (argv1.includes(pattern)) {
      return pm;
    }
  }
  
  return null;
}

// Get package manager version
export function getPackageManagerVersion(pm) {
  try {
    const version = execSync(`${pm} --version`, { encoding: 'utf-8' }).trim();
    return version;
  } catch {
    return 'unknown';
  }
}

// Detect package manager
export function detectPackageManager() {
  // Priority: argv > env > default
  const detected = detectFromArgv() || detectFromEnv();
  return detected || 'npm';
}

// Get package manager info
export function getPackageManagerInfo(pm) {
  const info = {
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

  return info[pm] || info.npm;
}
