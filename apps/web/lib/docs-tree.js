import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DOCU_JSON = path.join(__dirname, '..', 'docu.json');
const OUTPUT_FILE = path.join(__dirname, 'docs-tree.json');

function main() {
  console.log('Generating docs-tree.json from docu.json...');

  if (!fs.existsSync(DOCU_JSON)) {
    console.error(`docu.json not found: ${DOCU_JSON}`);
    process.exit(1);
  }

  const docuConfig = JSON.parse(fs.readFileSync(DOCU_JSON, 'utf-8'));

  if (!docuConfig.routes || !Array.isArray(docuConfig.routes)) {
    console.error('routes not found in docu.json');
    process.exit(1);
  }

  const output = JSON.stringify(docuConfig.routes, null, 2);

  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
  console.log(`Generated: ${OUTPUT_FILE}`);
}

main();