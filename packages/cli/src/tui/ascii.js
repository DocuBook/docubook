import { colors } from './colors.js';

/**
 * DocuBook ASCII logo inspired by the SVG design
 * Logo is a stylized 'D' with circular elements
 */
export const DOCUBOOK_LOGO = `
  ${colors.cyan}╔═══════╗${colors.reset}
  ${colors.cyan}║${colors.reset} ${colors.cyan}◉${colors.reset} ${colors.cyan}◉${colors.reset} ${colors.cyan}║${colors.reset}
  ${colors.cyan}║${colors.reset} ${colors.cyan}◉${colors.reset} ${colors.cyan}◉${colors.reset} ${colors.cyan}║${colors.reset}
  ${colors.cyan}╚═══════╝${colors.reset}
`;

/**
 * Compact logo for one-liner display
 */
export const DOCUBOOK_LOGO_COMPACT = `${colors.cyan}[◉◉]${colors.reset}`;

/**
 * Create a welcome banner with logo and text
 */
export function createWelcomeBanner(version) {
  const logo = `
  ${colors.cyan}┌─────────┐${colors.reset}
  ${colors.cyan}│ ◉ ◉ ◉ ◉ │${colors.reset}  ${colors.cyan}DocuBook CLI${colors.reset} v${version}
  ${colors.cyan}│ ◉   ◉   │${colors.reset}  Modern documentation scaffold tool
  ${colors.cyan}│ ◉ ◉ ◉ ◉ │${colors.reset}
  ${colors.cyan}└─────────┘${colors.reset}
  `;
  return logo;
}

/**
 * Create a banner for scaffolding progress
 */
export function createScaffoldingBanner() {
  return `
  ${colors.cyan}┌──────────────────┐${colors.reset}
  ${colors.cyan}│ Creating Project  │${colors.reset}
  ${colors.cyan}└──────────────────┘${colors.reset}
  `;
}

/**
 * Create success banner
 */
export function createSuccessBanner() {
  return `
  ${colors.cyan}┌─────────────────────┐${colors.reset}
  ${colors.cyan}│ ✓ Project Created   │${colors.reset}
  ${colors.cyan}└─────────────────────┘${colors.reset}
  `;
}
