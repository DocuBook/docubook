// Dark theme with neon accents
export const colors = {
  // Neon colors
  cyan: '\x1b[36m',    // #00D9FF
  magenta: '\x1b[35m', // #FF00FF
  yellow: '\x1b[33m',  // #FFD700
  green: '\x1b[32m',   // #00FF00

  // Grayscale
  white: '\x1b[37m',
  gray: '\x1b[90m',
  dark: '\x1b[2m',

  // Reset
  reset: '\x1b[0m',

  // Styles
  bright: '\x1b[1m',
  dim: '\x1b[2m',
};

export function colorize(text, color) {
  return `${color}${text}${colors.reset}`;
}

export function line(text = '') {
  if (!text) return '';
  return text;
}

export function header(text) {
  return colorize(text, colors.cyan + colors.bright);
}

export function success(text) {
  return `${colorize('✓', colors.green)} ${text}`;
}

export function error(text) {
  return `${colorize('✗', colors.magenta)} ${text}`;
}

export function info(text) {
  return `${colorize('→', colors.cyan)} ${text}`;
}

export function loading(text) {
  return `${colorize('◐', colors.yellow)} ${text}`;
}

export function dim(text) {
  return colorize(text, colors.gray);
}
