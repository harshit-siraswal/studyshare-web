const fs = require('fs');
const path = require('path');

const targetRelative = process.argv[2] || 'src/pages/Profile.tsx';
const file = path.resolve(process.cwd(), targetRelative);

let content;
try {
  content = fs.readFileSync(file, 'utf8');
} catch (err) {
  console.error(`Error reading file at ${file}:`, err.message);
  process.exit(1);
}

const originalContent = content;
let totalReplacements = 0;

if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
  totalReplacements++;
  console.log('Removed UTF-8 BOM.');
}

const replacements = {
  '/* Ã°Å¸â€\x9DÂ\x90 AUTH */': '/* === AUTH === */',
  '/* Ã°Å¸Â§Â\xa0 STATE */': '/* === STATE === */',
  '/* Ã¢Å“Â\x8FÃ¯Â¸Â\x8F EDIT FORM */': '/* === EDIT FORM === */',
  '/* Ã°Å¸â€\x9DÂ\x90 AUTH GUARD Ã¢â‚¬â€\x9D SAFE */': '/* === AUTH GUARD - SAFE === */',
  '/* Ã°Å¸Â§Â\xad VIEW MODE - Phase 2: Fix profile routing */': '/* === VIEW MODE - Phase 2: Fix profile routing === */',
  '/* Ã°Å¸Â§Â\xbe DISPLAY VALUES */': '/* === DISPLAY VALUES === */',
  '/* Ã°Å¸â€˜Â¥ SOCIAL DATA */': '/* === SOCIAL DATA === */',
  '/* Ã°Å¸Å½â€œ ROLE */': '/* === ROLE === */'
};

const stats = {};

for (const [bad, good] of Object.entries(replacements)) {
  if (content.includes(bad)) {
    const parts = content.split(bad);
    const count = parts.length - 1;
    content = parts.join(good);
    stats[bad] = count;
    totalReplacements += count;
  }
}

if (totalReplacements > 0) {
  const backup = file + '.bak';
  fs.writeFileSync(backup, originalContent, 'utf8');
  console.log(`Created backup at: ${backup}`);
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Successfully updated ${file}`);
  
  console.log('-- Replacement Summary --');
  for (const [bad, count] of Object.entries(stats)) {
    console.log(`Replaced ${count} instance(s) of: ${bad}`);
  }
} else {
  console.log('No replacements needed. File unchanged.');
}
