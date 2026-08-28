// scripts/audit-hs-codes.js
// Scans every file in data/ plus app/components/presets-data.js and reports
// every unique HS Code found, grouped by its 6-digit WCO subheading (the
// first 6 digits, which determine the actual duty classification — the
// remaining digits are country-specific suffixes), with a sample vehicle
// and a count for each, so we can see the full real spectrum before
// building any HS-Code-to-duty-rate lookup table.
//
// Run from project root: node scripts/audit-hs-codes.js

const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');

function sanitizeJsonString(str) {
  if (str.charCodeAt(0) === 0xFEFF) str = str.slice(1);
  return str
    .replace(/:\s*NaN\b/gi, ': null')
    .replace(/,\s*NaN\b/gi, ', null')
    .replace(/\[\s*NaN\b/gi, '[ null')
    .replace(/:\s*None\b/gi, ': null')
    .replace(/:\s*True\b/gi, ': true')
    .replace(/:\s*False\b/gi, ': false');
}

function extractRows(parsed) {
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed === 'object') {
    const combined = [];
    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key])) combined.push(...parsed[key]);
    }
    if (combined.length > 0) return combined;
    const values = Object.values(parsed);
    if (values.length > 0 && typeof values[0] === 'object' && values[0] !== null) return values;
    return [parsed];
  }
  return [];
}

function getFlexibleValue(rowObj, candidateKeys) {
  if (!rowObj || typeof rowObj !== 'object') return null;
  const normalizedMap = {};
  for (const k of Object.keys(rowObj)) {
    const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    normalizedMap[cleanKey] = rowObj[k];
  }
  for (const candidate of candidateKeys) {
    const cleanCandidate = candidate.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedMap[cleanCandidate] !== undefined && normalizedMap[cleanCandidate] !== null) {
      return normalizedMap[cleanCandidate];
    }
  }
  return null;
}

// The 6-digit WCO subheading is what actually determines the duty tier —
// e.g. "870322" from a raw code like "8703222000" or "8703.22.20.00".
// This strips punctuation and takes the first 6 digits.
function extractWcoSubheading(rawHsCode) {
  const digitsOnly = String(rawHsCode || '').replace(/[^0-9]/g, '');
  if (digitsOnly.length < 6) return null;
  return digitsOnly.slice(0, 6);
}

const results = new Map(); // subheading -> { fullCodesSeen: Set, count: 0, samples: [] }
let totalRowsScanned = 0;
let rowsWithoutHsCode = 0;

function processRow(row, sourceLabel) {
  const rawHs = getFlexibleValue(row, ['hs code', 'hscode', 'hs_code', 'tariff code']);
  totalRowsScanned++;
  if (!rawHs) {
    rowsWithoutHsCode++;
    return;
  }
  const subheading = extractWcoSubheading(rawHs);
  if (!subheading) {
    rowsWithoutHsCode++;
    return;
  }

  const make = getFlexibleValue(row, ['make', 'brand']) || '?';
  const model = getFlexibleValue(row, ['model']) || '?';
  const trim = getFlexibleValue(row, ['trim level', 'trim']) || '';
  const year = getFlexibleValue(row, ['year of manufacture', 'year']) || '?';

  if (!results.has(subheading)) {
    results.set(subheading, { fullCodesSeen: new Set(), count: 0, samples: [] });
  }
  const entry = results.get(subheading);
  entry.fullCodesSeen.add(String(rawHs));
  entry.count++;
  if (entry.samples.length < 3) {
    entry.samples.push(`${year} ${make} ${model} ${trim} [${sourceLabel}]`.trim());
  }
}

// 1. Scan every file in data/
if (fs.existsSync(dataDir)) {
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f !== 'dynamic_cache.json' && f !== 'models_list.json');
  console.log(`Scanning ${files.length} files in data/ ...`);
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dataDir, file), 'utf8');
      const sanitized = sanitizeJsonString(raw);
      let parsed;
      try {
        parsed = JSON.parse(sanitized);
      } catch (e) {
        parsed = JSON.parse(sanitized.replace(/'/g, '"'));
      }
      const rows = extractRows(parsed);
      rows.forEach(row => processRow(row, file));
    } catch (err) {
      console.error(`  [ERROR] ${file}: ${err.message}`);
    }
  }
} else {
  console.error(`data/ directory not found at ${dataDir}`);
}

// 2. Scan presets-data.js if it has HS Code info (it may not — check and report either way)
const presetsPath = path.join(process.cwd(), 'app/components/presets-data.js');
if (fs.existsSync(presetsPath)) {
  try {
    const { PRESET_DATA } = require(presetsPath);
    console.log(`Scanning ${PRESET_DATA.length} rows in presets-data.js ...`);
    const hasHsCode = PRESET_DATA.some(row => row.hsCode || row.hs_code || row['HS Code']);
    if (!hasHsCode) {
      console.log('  [NOTE] presets-data.js rows do not currently carry an HS Code field — generate-presets.js does not extract it. This audit only reflects data/ files until that changes.');
    } else {
      PRESET_DATA.forEach(row => processRow(row, 'presets-data.js'));
    }
  } catch (err) {
    console.error(`  [ERROR] Could not load presets-data.js: ${err.message}`);
  }
}

// Report
console.log('\n=== HS CODE (WCO 6-DIGIT SUBHEADING) AUDIT ===\n');
console.log(`Total rows scanned: ${totalRowsScanned}`);
console.log(`Rows without a usable HS Code: ${rowsWithoutHsCode}\n`);

const sorted = Array.from(results.entries()).sort((a, b) => b[1].count - a[1].count);
for (const [subheading, entry] of sorted) {
  console.log(`${subheading}  (${entry.count} rows, ${entry.fullCodesSeen.size} distinct full codes: ${Array.from(entry.fullCodesSeen).slice(0, 5).join(', ')}${entry.fullCodesSeen.size > 5 ? ', ...' : ''})`);
  entry.samples.forEach(s => console.log(`    e.g. ${s}`));
}

console.log(`\nTotal distinct WCO subheadings found: ${sorted.length}`);
