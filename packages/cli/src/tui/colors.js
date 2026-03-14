/**
 * ANSI color codes and terminal formatting functions
 * Used for styled console output throughout the CLI
 */

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

/**
 * Apply color to text using ANSI codes
 * @param {string} text - Text to colorize
 * @param {string} color - ANSI color code
 * @returns {string} Colored text
 */
export function colorize(text, color) {
  return `${color}${text}${colors.reset}`;
}

/**
 * Format empty or filled line
 * @param {string} text - Optional text
 * @returns {string} Formatted line
 */
export function line(text = '') {
  if (!text) return '';
  return text;
}

/**
 * Format header text (cyan + bright)
 * @param {string} text - Header text
 * @returns {string} Formatted header
 */
export function header(text) {
  return colorize(text, colors.cyan + colors.bright);
}

/**
 * Format success message with checkmark
 * @param {string} text - Message text
 * @returns {string} Formatted success message
 */
export function success(text) {
  return `${colorize('✓', colors.green)} ${text}`;
}

/**
 * Format error message with cross
 * @param {string} text - Error message
 * @returns {string} Formatted error message
 */
export function error(text) {
  return `${colorize('✗', colors.magenta)} ${text}`;
}

/**
 * Format info message with arrow
 * @param {string} text - Info text
 * @returns {string} Formatted info message
 */
export function info(text) {
  return `${colorize('→', colors.cyan)} ${text}`;
}

/**
 * Format loading message with spinner symbol
 * @param {string} text - Loading message
 * @returns {string} Formatted loading message
 */
export function loading(text) {
  return `${colorize('◐', colors.yellow)} ${text}`;
}

/**
 * Format dimmed text
 * @param {string} text - Text to dim
 * @returns {string} Dimmed text
 */
export function dim(text) {
  return colorize(text, colors.gray);
}
