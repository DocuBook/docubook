import { colors } from './colors.js';


const stripAnsi = (str) => str.replace(/\x1B\[[0-9;]*m/g, "");
const stringWidth = (str) => {
  str = stripAnsi(str);

  let width = 0;
  for (const char of [...str]) {
    const code = char.codePointAt(0);

    // emoji / wide char
    if (
      code > 0xffff ||
      (code >= 0x1100 &&
        (
          code <= 0x115f ||
          code === 0x2329 ||
          code === 0x232a ||
          (0x2e80 <= code && code <= 0xa4cf)
        ))
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }

  return width;
};

function wrapText(text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const test = current ? current + " " + word : word;

    if (stringWidth(test) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);

  return lines;
}

/**
 * Create a welcome banner with full ASCII logo and tip link
 */
export function createWelcomeBanner(version) {
  const termWidth = process.stdout.columns || 80;
  const width = Math.min(76, termWidth - 4);
  const indent = " ".repeat(5)

  const logoTop = `${colors.cyan}▛▀▀▜${colors.reset}`
  const logoMid = `${colors.cyan}${colors.bright}▌>_▐${colors.reset}`
  const logoBot = `${colors.cyan}▙▄▄▟${colors.reset}`

  const title = `${colors.cyan}${colors.bright}DocuBook${colors.reset} v${version}`
  const subtitle = `${colors.gray}Initialize, build, and deploy docs from terminal.${colors.reset}`

  const tip = `${colors.gray}Visit our documentation.${colors.reset}`
  const docsLink = `${colors.cyan}https://www.docubook.pro/${colors.reset}`

  const pad = (text = "") => {
    const len = stringWidth(text)
    return text + " ".repeat(Math.max(0, width - len))
  }

  const banner = `
${colors.cyan}┌${"─".repeat(width)}┐${colors.reset}
${colors.cyan}│${colors.reset}${pad(` ${logoTop}`)}${colors.cyan}│${colors.reset}
${colors.cyan}│${colors.reset}${pad(` ${logoMid}  ${title}`)}${colors.cyan}│${colors.reset}
${colors.cyan}│${colors.reset}${pad(` ${logoBot}  ${subtitle}`)}${colors.cyan}│${colors.reset}
${colors.cyan}│${colors.reset}${pad("")}${colors.cyan}│${colors.reset}
${colors.cyan}│${colors.reset}${pad(`${indent}${tip} ${docsLink}`)}${colors.cyan}│${colors.reset}
${colors.cyan}└${"─".repeat(width)}┘${colors.reset}
`

  return banner
}

/**
 * Create a banner for scaffolding progress
 */
export function createScaffoldingBanner() {
  return `
${colors.cyan}Creating Project${colors.reset}
${colors.gray}Initializing...${colors.reset}
  `;
}

/**
 * Create a boxed message with title and content
 */
export function createBoxedMessage(title, content, color = colors.green) {
  const reset = "\x1b[0m";
  const termWidth = process.stdout.columns || 80;

  // 1. Tentukan total lebar box (termasuk border)
  const boxWidth = Math.min(80, termWidth - 4);

  // 2. width adalah panjang garis horizontal (─) di atas dan bawah
  // Total lebar box adalah width + 2 (untuk karakter pojok ┌ dan ┐)
  const width = boxWidth - 2;

  // 3. inner adalah ruang bersih di dalam box untuk teks (tanpa padding spasi)
  // Kita beri padding 2 spasi di kiri dan 2 spasi di kanan (total 4)
  // Jadi: 1(│) + 2(spasi) + inner + 2(spasi) + 1(│) = width + 2
  const inner = (width + 2) - 6;

  const centerTitle = () => {
    const text = ` ${title} `;
    const textWidth = stringWidth(text);
    const remaining = width - textWidth;
    const left = Math.floor(remaining / 2);
    const right = remaining - left;
    return "─".repeat(left) + text + "─".repeat(right);
  };

  const pad = (text = "") => {
    const len = stringWidth(text);
    // Tambahkan spasi hingga tepat mengisi 'inner'
    return text + " ".repeat(Math.max(0, inner - len));
  };

  const lines = [];

  // Header
  lines.push(`${color}┌${centerTitle()}┐${reset}`);

  // Padding atas (opsional)
  lines.push(`${color}│${reset}  ${pad("")}  ${color}│${reset}`);

  const items = typeof content === "string"
    ? content.split("\n")
    : Array.isArray(content) ? content : [];

  for (const line of items) {
    const wrapped = wrapText(line, inner);
    wrapped.forEach((w) => {
      // Pastikan struktur: │ + spasi(2) + konten + spasi(2) + │
      lines.push(`${color}│${reset}  ${pad(w)}  ${color}│${reset}`);
    });
  }

  // Padding bawah (opsional)
  lines.push(`${color}│${reset}  ${pad("")}  ${color}│${reset}`);

  // Footer
  lines.push(`${color}└${"─".repeat(width)}┘${reset}`);

  return "\n" + lines.join("\n") + "\n";
}

/**
 * Create success banner
 */
export function createSuccessBanner() {
  return `
${colors.green}✓ Project Created${colors.reset}
  `;
}
