#!/usr/bin/env node
// Injects skip link + id="main" into all public HTML pages

const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, '..', 'project');

const PUBLIC_PAGES = [
  'index.html', 'about.html', 'contact.html', 'favorite.html',
  'listings-comercial.html', 'listings-rezidential.html', 'listings-terenuri.html',
  'privacy.html', 'project-detail.html', 'projects.html',
  'property-comercial.html', 'property-rezidential.html', 'property-teren.html',
  'terms.html', 'verificat-even.html',
];

const SKIP_LINK = '<a class="skip-link" href="#main">Sari la conținut</a>';

for (const page of PUBLIC_PAGES) {
  const file = path.join(projectDir, page);
  if (!fs.existsSync(file)) { console.log(`SKIP (not found): ${page}`); continue; }

  let html = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Insert skip link as first child of <body> (idempotent)
  if (!html.includes('class="skip-link"')) {
    html = html.replace(/(<body[^>]*>)/, `$1\n  ${SKIP_LINK}`);
    changed = true;
  }

  // 2. Add id="main" to the first meaningful content element after </header>
  //    Strategy: find first <section, <main, or <div class="container"> after </header>
  //    that doesn't already have id="main"
  if (!html.includes('id="main"')) {
    const afterHeader = html.indexOf('</header>');
    if (afterHeader !== -1) {
      const rest = html.slice(afterHeader);
      // Try to find <section, <main, or a <div with class="container"
      const match = rest.match(/<(section|main)(\s)/);
      if (match) {
        const tag = `<${match[1]}${match[2]}`;
        const insertAt = afterHeader + rest.indexOf(tag);
        html = html.slice(0, insertAt + tag.length - 1) + ' id="main"' + html.slice(insertAt + tag.length - 1);
        changed = true;
      } else {
        // Fallback: first <div class="container"> after </header>
        const divMatch = rest.match(/<div\s+class="container/);
        if (divMatch) {
          const divTag = '<div class="container';
          const insertAt = afterHeader + rest.indexOf(divTag);
          html = html.slice(0, insertAt + '<div '.length) + 'id="main" ' + html.slice(insertAt + '<div '.length);
          changed = true;
        }
      }
    }
  }

  if (changed) {
    fs.writeFileSync(file, html, 'utf8');
    console.log(`UPDATED: ${page}`);
  } else {
    console.log(`OK (no change): ${page}`);
  }
}
