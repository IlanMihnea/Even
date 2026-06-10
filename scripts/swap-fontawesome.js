/**
 * Replaces the Font Awesome CDN <link> with <link rel="stylesheet" href="css/icons.css">
 * on all public pages (skips admin/sign/banner/brochure/prezentare).
 */
const fs = require('fs');
const path = require('path');

const PROJECT = path.join(__dirname, '../project');
const FA_RE = /<link[^>]+cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome[^>]+>/g;
const REPLACEMENT = '<link rel="stylesheet" href="css/icons.css">';

const SKIP = new Set(['admin.html','sign.html','banner.html','brochure.html','prezentare.html']);

for (const f of fs.readdirSync(PROJECT)) {
  if (!f.endsWith('.html') || SKIP.has(f)) continue;
  const fp = path.join(PROJECT, f);
  const html = fs.readFileSync(fp, 'utf8');
  if (!FA_RE.test(html)) { FA_RE.lastIndex = 0; continue; }
  FA_RE.lastIndex = 0;
  fs.writeFileSync(fp, html.replace(FA_RE, REPLACEMENT), 'utf8');
  console.log(`SWAPPED: ${f}`);
}
console.log('Done.');
