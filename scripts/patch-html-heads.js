/**
 * Faza 1 HTML head patches:
 * - Add og:image / og:image:width / og:image:height to all public pages
 * - Add og:title + og:description where missing (copied from <title> / meta description)
 * - Add preconnect tags before the Google Fonts link (pages that lack them)
 * - Remove Syne from the font URL (not used in any CSS)
 * - Standardize font URL (same set across all pages, matching index.html)
 */

const fs = require('fs');
const path = require('path');

const PROJECT = path.join(__dirname, '../project');

const FONT_LINK_CLEAN = `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=DM+Sans:wght@400;500;600;700&family=Mrs+Saint+Delafield&display=swap" rel="stylesheet">`;

const OG_IMAGE = `  <meta property="og:image" content="https://even-imobiliare.ro/design/og-default.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">`;

// Pages to patch (skip admin/sign/banner/brochure/prezentare)
const PUBLIC_PAGES = [
  '404.html',
  'about.html',
  'contact.html',
  'favorite.html',
  'index.html',
  'listings-comercial.html',
  'listings-rezidential.html',
  'listings-terenuri.html',
  'privacy.html',
  'project-detail.html',
  'projects.html',
  'property-comercial.html',
  'property-rezidential.html',
  'property-teren.html',
  'terms.html',
];

// OG data for pages that need title/description added
const OG_FILL = {
  '404.html':              { title: 'Pagină inexistentă · EVEN',  description: 'Pagina căutată nu există. Explorează proprietățile EVEN.' },
  'favorite.html':         { title: 'Favorite · EVEN',            description: 'Proprietățile salvate de tine — gata pentru revedere.' },
  'privacy.html':          { title: 'Politica de confidențialitate · EVEN', description: 'Cum prelucrează EVEN datele tale personale, conform GDPR.' },
  'project-detail.html':   { title: 'Proiect rezidențial nou · EVEN', description: 'Proiect rezidențial nou. Detalii, timeline construcție, plan de plată și unități disponibile.' },
  'projects.html':         { title: 'Ansambluri rezidențiale noi · EVEN', description: 'Proiecte rezidențiale noi în București — pre-vânzare, construcție și finalizate. Selectate de EVEN.' },
  'property-comercial.html': { title: 'Spațiu comercial verificat · EVEN', description: 'Spațiu comercial verificat de EVEN. Fișă tehnică, plan, calculator cost lunar și programare vizionare.' },
  'property-rezidential.html': { title: 'Proprietate rezidențială verificată · EVEN', description: 'Apartament rezidențial verificat de EVEN. Galerie, plan, calculator rate ipotecare și programare vizionare.' },
  'property-teren.html':   { title: 'Teren verificat · EVEN',    description: 'Teren verificat cadastral de EVEN. Utilități, regim juridic, calculator construibil și programare vizionare.' },
  'terms.html':            { title: 'Termeni și condiții · EVEN', description: 'Termenii de utilizare a site-ului even-imobiliare.ro.' },
  // listings pages have og:title but no og:description — fill from meta description
  'listings-comercial.html':   { description: 'Birouri, retail, depozite și spații industriale în București. Vânzare și închiriere cu plan, verificate de EVEN.' },
  'listings-rezidential.html': { description: 'Apartamente, case, vile și duplex-uri pentru vânzare și închiriere în București. Toate listările verificate de EVEN.' },
  'listings-terenuri.html':    { description: 'Terenuri intravilan, extravilan, agricol și industriale, verificate cadastral, în București și împrejurimi.' },
};

// Matches any Google Fonts <link> (with or without preconnect lines before it)
const FONTS_RE = /(?:<link rel="preconnect"[^>]*>\s*\n\s*)*(?:<link rel="preconnect"[^>]*crossorigin[^>]*>\s*\n\s*)?<link href="https:\/\/fonts\.googleapis\.com[^"]*" rel="stylesheet">/;

for (const page of PUBLIC_PAGES) {
  const filePath = path.join(PROJECT, page);
  if (!fs.existsSync(filePath)) { console.log(`SKIP (missing): ${page}`); continue; }

  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Replace font link (remove Syne, ensure preconnect, standardize)
  if (FONTS_RE.test(html)) {
    html = html.replace(FONTS_RE, FONT_LINK_CLEAN);
    changed = true;
  }

  // 2. Add og:image before </head> if not present
  if (!html.includes('og:image')) {
    html = html.replace('</head>', OG_IMAGE + '\n</head>');
    changed = true;
  }

  // 3. Add missing og:title and/or og:description
  const fill = OG_FILL[page];
  if (fill) {
    if (fill.title && !html.includes('og:title')) {
      const titleTag = `  <meta property="og:title" content="${fill.title}">`;
      html = html.replace('</head>', titleTag + '\n</head>');
      changed = true;
    }
    if (fill.description && !html.includes('og:description')) {
      const descTag = `  <meta property="og:description" content="${fill.description}">`;
      html = html.replace('</head>', descTag + '\n</head>');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`PATCHED: ${page}`);
  } else {
    console.log(`OK (no change): ${page}`);
  }
}

console.log('\nDone.');
