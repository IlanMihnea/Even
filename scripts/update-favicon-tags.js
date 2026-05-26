// One-shot: replace favicon <link> tags across all project HTML files
const fs   = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'project');

const NEW_BLOCK =
  '  <link rel="icon" href="favicon.ico" sizes="any">\n' +
  '  <link rel="icon" type="image/svg+xml" href="design/logomark-even.svg">\n' +
  '  <link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">\n' +
  '  <link rel="icon" type="image/png" sizes="96x96" href="favicon-96.png">\n' +
  '  <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">';

const OLD_BLOCK =
  '  <link rel="icon" type="image/svg+xml" href="design/logomark-even.svg">\n' +
  '  <link rel="apple-touch-icon" href="design/logomark-even.svg">';

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.html'));
let changed = 0, skipped = [];
for (const f of files) {
  const p = path.join(DIR, f);
  const before = fs.readFileSync(p, 'utf8');
  if (!before.includes(OLD_BLOCK)) { skipped.push(f); continue; }
  const after = before.replace(OLD_BLOCK, NEW_BLOCK);
  fs.writeFileSync(p, after, 'utf8');
  changed++;
  console.log('updated:', f);
}
if (skipped.length) console.log('skipped (no matching block):', skipped.join(', '));
console.log('done. files changed:', changed);
