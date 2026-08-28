// scripts/generate-presets.js
const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data'); 
const outputFile = path.join(process.cwd(), 'app/components/presets-data.js');

const originMap = {
  'JP': 'Japan', 'JAPAN': 'Japan',
  'US': 'USA', 'USA': 'USA',
  'CA': 'Canada', 'CANADA': 'Canada',
  'DE': 'Germany', 'GERMANY': 'Germany',
  'BE': 'Belgium', 'BELGIUM': 'Belgium',
  'NL': 'Netherlands', 'NETHERLANDS': 'Netherlands',
  'UK': 'UK', 'GB': 'UK', 'UNITED KINGDOM': 'UK',
  'CN': 'China', 'CHINA': 'China',
  'KR': 'South Korea', 'KOREA': 'South Korea', 'SOUTH KOREA': 'South Korea',
  'AE': 'UAE', 'UAE': 'UAE',
  'FI': 'Finland', 'FINLAND': 'Finland',
  'AU': 'Australia', 'AUSTRALIA': 'Australia',
  'AT': 'Austria', 'AUSTRIA': 'Austria',
  'BN': 'Brunei', 'IT': 'Italy'
};

function sanitizeJsonString(str) {
  if (str.charCodeAt(0) === 0xFEFF) {
    str = str.slice(1);
  }
  return str
    .replace(/:\s*NaN\b/gi, ': null')
    .replace(/,\s*NaN\b/gi, ', null')
    .replace(/\[\s*NaN\b/gi, '[ null')
    .replace(/:\s*None\b/gi, ': null')
    .replace(/:\s*True\b/gi, ': true')
    .replace(/:\s*False\b/gi, ': false');
}

// Unwraps top-level objects like {"Sheet1": [...]} or {"data": [...]} into flat row arrays
function extractRows(parsed) {
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed === 'object') {
    const combined = [];
    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key])) {
        combined.push(...parsed[key]);
      }
    }
    if (combined.length > 0) return combined;

    const values = Object.values(parsed);
    if (values.length > 0 && typeof values[0] === 'object' && values[0] !== null) {
      return values;
    }
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

// Helper to infer clean Make from filenames like gra_2010-2023_volkswagen or toyota_aqua
function inferMakeFromFilename(filename) {
  const clean = filename.replace('.json', '').toLowerCase();
  if (clean.includes('volkswagen')) return 'Volkswagen';
  if (clean.includes('mercedes')) return 'Mercedes-Benz';
  if (clean.includes('hyundai')) return 'Hyundai';
  if (clean.includes('chevrolet')) return 'Chevrolet';
  if (clean.includes('toyota')) return 'Toyota';
  if (clean.includes('honda')) return 'Honda';
  if (clean.includes('ford')) return 'Ford';
  if (clean.includes('dodge')) return 'Dodge';
  if (clean.includes('infiniti') || clean.includes('infiniti')) return 'Infiniti';
  if (clean.includes('fiat')) return 'Fiat';
  if (clean.includes('daewoo')) return 'Daewoo';
  if (clean.includes('bmw')) return 'BMW';
  if (clean.includes('audi')) return 'Audi';
  if (clean.includes('lexus')) return 'Lexus';
  if (clean.includes('renault')) return 'Renault';
  if (clean.includes('jeep')) return 'Jeep';
  if (clean.includes('jaguar')) return 'Jaguar';
  if (clean.includes('iveco')) return 'Iveco';
  if (clean.includes('nissan')) return 'Nissan';
  if (clean.includes('mitsubishi')) return 'Mitsubishi';
  if (clean.includes('landrover')) return 'Land Rover';
  if (clean.includes('kia')) return 'Kia';
  if (clean.includes('acura')) return 'Acura';

  const parts = clean.split('_');
  if (parts[0] === 'gra') {
    const makePart = parts[parts.length - 1];
    return makePart.charAt(0).toUpperCase() + makePart.slice(1);
  }
  return parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Other';
}

try {
  if (!fs.existsSync(dataDir)) {
    console.error(`[ERROR] Directory not found at: ${dataDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(dataDir).filter(
    file => file.endsWith('.json') && file !== 'dynamic_cache.json'
  );
  console.log(`[INFO] Found ${files.length} JSON files. Commencing precise extraction...\n`);

  const presets = [];
  const seenKeys = new Set();
  const fileSummary = [];

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    let fileAddedCount = 0;
    
    const cleanFilename = file.replace('.json', '');
    const filenameMake = inferMakeFromFilename(file);
    const nameParts = cleanFilename.split('_');
    let filenameModel = nameParts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

    try {
      let rawData = fs.readFileSync(filePath, 'utf8');
      const sanitizedData = sanitizeJsonString(rawData);
      
      let parsedJson;
      try {
        parsedJson = JSON.parse(sanitizedData);
      } catch (e) {
        const replacedQuotes = sanitizedData.replace(/'/g, '"');
        parsedJson = JSON.parse(replacedQuotes);
      }

      const dataRows = extractRows(parsedJson);

      for (const row of dataRows) {
        try {
          if (!row || typeof row !== 'object') continue;

          const rawMake = getFlexibleValue(row, ['make', 'brand', 'manufacturer']);
          const rawModel = getFlexibleValue(row, ['model', 'vehicle_model', 'car_model']);
          const rawYear = getFlexibleValue(row, ['year of manufacture', 'year', 'yom', 'yr']);
          const rawTrim = getFlexibleValue(row, ['trim level', 'trim', 'grade', 'variant', 'submodel']);
          const rawHdv = getFlexibleValue(row, ['hdv', 'price', 'msrp', 'value', 'cif', 'customs_value', 'cost']);
          const rawCurrency = getFlexibleValue(row, ['currency', 'curr']) ?? 'USD';
          const rawOrigin = getFlexibleValue(row, ['origin code', 'origin_code', 'origin', 'country', 'market']) ?? 'US';
          const rawBody = getFlexibleValue(row, ['body style', 'bodystyle', 'bodytype', 'body_style']) ?? 'Sedan';
          const rawHsCode = getFlexibleValue(row, ['hs code', 'hscode', 'hs_code', 'tariff code']);

          let make = rawMake ? String(rawMake).trim() : filenameMake;
          if (make.toLowerCase() === 'mercedes_benz' || make.toLowerCase() === 'mercedes benz') {
            make = 'Mercedes-Benz';
          }

          const model = rawModel ? String(rawModel).trim() : filenameModel || 'Other';
          const year = rawYear ? String(rawYear).trim() : '';
          const trimLevel = rawTrim ? String(rawTrim).trim() : '';
          const currency = String(rawCurrency).trim();

          // Skip duplicate header row copies
          if (make.toLowerCase() === 'make' || model.toLowerCase() === 'model' || year.toLowerCase() === 'year of manufacture') {
            continue;
          }

          let originCode = String(rawOrigin).trim().toUpperCase();
          if (originCode === 'USA') originCode = 'US';
          
          const mappedOrigin = originMap[originCode] || originMap[originCode.replace(/[^A-Z]/g, '')] || 'USA';
          const numericHdv = Number(rawHdv);

          // The 6-digit WCO subheading (e.g. "870323" from a raw code like
          // "8703232000" or "8703.23.20.00") is what actually determines
          // the duty tier — everything after the 6th digit is Ghana's own
          // country-specific suffix and doesn't affect classification.
          const hsDigitsOnly = String(rawHsCode || '').replace(/[^0-9]/g, '');
          const hsCode = hsDigitsOnly.length >= 6 ? hsDigitsOnly.slice(0, 6) : '';

          if (year && !isNaN(Number(year)) && make && model && !isNaN(numericHdv) && numericHdv > 0) {
            const dedupKey = `${make}|${model}|${year}|${trimLevel}|${mappedOrigin}`.toUpperCase();
            if (!seenKeys.has(dedupKey)) {
              seenKeys.add(dedupKey);
              presets.push({
                year: year,
                make: make,
                model: model,
                trim: trimLevel === 'NIL' || trimLevel === 'NILL' ? '' : trimLevel,
                engine: "",
                bodyType: String(rawBody).trim() || "Sedan",
                origin: mappedOrigin,
                hdv: numericHdv,
                currency: currency,
                hsCode: hsCode
              });
              fileAddedCount++;
            }
          }
        } catch (rowErr) {
          // Ignore bad single rows
        }
      }
      fileSummary.push({ file, count: fileAddedCount, status: 'OK' });
    } catch (parseError) {
      fileSummary.push({ file, count: 0, status: `PARSE ERROR: ${parseError.message}` });
    }
  }

  console.log('=== EXTRACTION REPORT ===');
  fileSummary.forEach(item => {
    const symbol = item.count > 0 ? '✓' : '✗';
    console.log(`${symbol} ${item.file.padEnd(35)} -> ${item.count} presets extracted (${item.status})`);
  });

  presets.sort((a, b) => {
    const makeCompare = a.make.localeCompare(b.make);
    if (makeCompare !== 0) return makeCompare;
    const modelCompare = a.model.localeCompare(b.model);
    if (modelCompare !== 0) return modelCompare;
    return Number(b.year) - Number(a.year);
  });

  const fileContent = `// Auto-generated vehicle presets registry
// Generated on: ${new Date().toISOString().split('T')[0]}

export const PRESET_DATA = ${JSON.stringify(presets, null, 2)};
`;

  fs.writeFileSync(outputFile, fileContent, 'utf8');
  console.log(`\n[SUCCESS] Total unique presets in registry: ${presets.length}`);

} catch (error) {
  console.error('[FATAL CRASH]:', error.message);
}