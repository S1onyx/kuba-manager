import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const localesDir = join(dirname(fileURLToPath(import.meta.url)), '../src/i18n/locales');
const REFERENCE = 'de.json';

const PLURAL_SUFFIXES = /(_zero|_one|_two|_few|_many|_other)$/;

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

// i18next-Pluralformen (_one/_few/_many/...) werden auf den Basis-Key reduziert,
// damit sprachspezifische Pluralregeln (z. B. Tschechisch) nicht als Konflikt zählen.
function baseKeys(keys) {
  return new Set(keys.map((k) => k.replace(PLURAL_SUFFIXES, '')));
}

function load(file) {
  return JSON.parse(readFileSync(join(localesDir, file), 'utf8'));
}

const reference = baseKeys(flattenKeys(load(REFERENCE)));
let failed = false;

for (const file of readdirSync(localesDir).filter((f) => f.endsWith('.json'))) {
  if (file === REFERENCE) continue;
  const keys = baseKeys(flattenKeys(load(file)));
  const missing = [...reference].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !reference.has(k));
  if (missing.length === 0 && extra.length === 0) {
    console.log(`${file}: OK (${keys.size} keys)`);
    continue;
  }
  failed = true;
  for (const key of missing) console.error(`${file}: MISSING ${key}`);
  for (const key of extra) console.error(`${file}: EXTRA ${key}`);
}

if (failed) {
  console.error('\ni18n check failed: locale files are out of sync with ' + REFERENCE);
  process.exit(1);
}
console.log('\nAll locale files are in sync.');
