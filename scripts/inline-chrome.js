/**
 * Inlines navbar + footer HTML into every public page.
 * Run manually whenever the nav/footer markup changes.
 *
 * After running this script, main.js renderNavbar/renderFooter are no-ops
 * (they detect existing children and only wire up event listeners).
 */

const fs = require('fs');
const path = require('path');

const PROJECT = path.join(__dirname, '../project');
const YEAR = new Date().getFullYear();

const SKIP = new Set([
  'admin.html', 'sign.html', 'banner.html', 'brochure.html',
  'prezentare.html', 'verificat-even.html',
]);

// page -> activePage value used in nav-link class
const PAGE_MAP = {
  home:        'home',
  rezidential: 'rezidential',
  comercial:   'comercial',
  terenuri:    'terenuri',
  proiecte:    'proiecte',
  about:       'about',
  contact:     'contact',
};

function navbarHTML(activePage) {
  const a = (page, href, label) =>
    `<li><a href="${href}" class="nav-link${activePage === page ? ' active' : ''}">${label}</a></li>`;
  return `<header id="navbar" class="navbar">
    <div class="container nav-inner">
      <a href="index.html" class="logo">
        <img src="design/logomark-even.svg" class="logo-mark-svg" alt="">
        <img src="design/logotype-even.svg" class="logo-type-svg" alt="EVEN">
      </a>
      <ul class="nav-links">
        ${a('home',        'index.html',              'Acasă')}
        ${a('rezidential', 'listings-rezidential.html','Rezidențial')}
        ${a('comercial',   'listings-comercial.html',  'Comercial')}
        ${a('terenuri',    'listings-terenuri.html',   'Terenuri')}
        ${a('proiecte',    'projects.html',            'Proiecte Noi')}
        ${a('about',       'about.html',               'Despre')}
      </ul>
      <div class="nav-cta">
        <a href="favorite.html" class="nav-fav" aria-label="Favorite" id="navFavLink">
          <i class="fa-regular fa-heart"></i>
          <span class="nav-fav-badge" id="navFavBadge" aria-hidden="true" hidden></span>
        </a>
        <a href="contact.html" class="btn btn-outline"><i class="fa-solid fa-phone"></i> Contact</a>
        <button class="nav-toggle" id="navToggle" aria-label="Meniu"><i class="fa-solid fa-bars"></i></button>
      </div>
    </div>
    <div class="nav-mobile" id="navMobile">
      <a href="index.html">Acasă</a>
      <a href="listings-rezidential.html">Rezidențial</a>
      <a href="listings-comercial.html">Comercial</a>
      <a href="listings-terenuri.html">Terenuri</a>
      <a href="projects.html">Proiecte Noi</a>
      <a href="about.html">Despre</a>
      <a href="favorite.html" id="navMobileFavLink">Favorite</a>
      <a href="contact.html">Contact</a>
    </div>
  </header>`;
}

const FOOTER_HTML = `<footer id="footer" class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="index.html" class="logo">
            <img src="design/logomark-even.svg" class="logo-mark-svg logo-svg-footer" alt="">
            <img src="design/logotype-even.svg" class="logo-type-svg logo-svg-footer" alt="EVEN">
          </a>
          <p>Strategie înainte de anunț. Evaluare corectă. Implicare reală în fiecare tranzacție.</p>
          <p class="footer-tagline">Imobiliare cu plan.</p>
          <div class="footer-social"></div>
        </div>
        <div>
          <h4>Categorii</h4>
          <ul class="footer-links">
            <li><a href="listings-rezidential.html">Rezidențial</a></li>
            <li><a href="listings-comercial.html">Comercial</a></li>
            <li><a href="listings-terenuri.html">Terenuri</a></li>
            <li><a href="projects.html">Proiecte Noi</a></li>
          </ul>
        </div>
        <div>
          <h4>Companie</h4>
          <ul class="footer-links">
            <li><a href="about.html">Despre noi</a></li>
            <li><a href="about.html#echipa">Echipa</a></li>
            <li><a href="contact.html">Contact</a></li>
          </ul>
        </div>
        <div class="footer-contact">
          <h4>Contact</h4>
          <p><i class="fa-solid fa-location-dot"></i>Banul Antonache 71, Floreasca</p>
          <p><i class="fa-solid fa-phone"></i>0745 609 366</p>
          <p><i class="fa-solid fa-envelope"></i>ilan@even-imobiliare.ro</p>
          <p><i class="fa-regular fa-clock"></i>Lun-Vin: 09:00-19:00</p>
        </div>
      </div>
      <div class="footer-bottom">
        © ${YEAR} EVEN Real Estate. Toate drepturile rezervate.
        | <a href="terms.html" style="color: inherit">Termeni</a>
        | <a href="privacy.html" style="color: inherit">Confidențialitate</a>
        | <a href="verificat-even.html" style="color: inherit">Verificat de EVEN</a>
        | <a href="favorite.html" style="color: inherit">Favorite</a>
      </div>
    </div>
  </footer>`;

// Matches the empty placeholder tags left in HTML
const NAVBAR_EMPTY_RE = /<header id="navbar" class="navbar"><\/header>/;
const FOOTER_EMPTY_RE = /<footer id="footer" class="footer"><\/footer>/;
// Matches already-inlined versions (to replace on re-run)
const NAVBAR_INLINED_RE = /<header id="navbar" class="navbar">[\s\S]*?<\/header>/;
const FOOTER_INLINED_RE = /<footer id="footer" class="footer">[\s\S]*?<\/footer>/;

let patched = 0;
let skipped = 0;

for (const f of fs.readdirSync(PROJECT).sort()) {
  if (!f.endsWith('.html') || SKIP.has(f)) continue;

  const fp = path.join(PROJECT, f);
  let html = fs.readFileSync(fp, 'utf8');

  // Determine active page from data-page on <body>
  const bodyMatch = html.match(/<body[^>]*data-page="([^"]*)"[^>]*>/);
  const activePage = PAGE_MAP[bodyMatch?.[1]] || '';

  const navbar = navbarHTML(activePage);
  let changed = false;

  if (NAVBAR_INLINED_RE.test(html)) {
    html = html.replace(NAVBAR_INLINED_RE, navbar);
    changed = true;
  } else if (NAVBAR_EMPTY_RE.test(html)) {
    html = html.replace(NAVBAR_EMPTY_RE, navbar);
    changed = true;
  }

  if (FOOTER_INLINED_RE.test(html)) {
    html = html.replace(FOOTER_INLINED_RE, FOOTER_HTML);
    changed = true;
  } else if (FOOTER_EMPTY_RE.test(html)) {
    html = html.replace(FOOTER_EMPTY_RE, FOOTER_HTML);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(fp, html, 'utf8');
    console.log(`INLINED [${activePage || 'none'}]: ${f}`);
    patched++;
  } else {
    console.log(`SKIP (no placeholders): ${f}`);
    skipped++;
  }
}

console.log(`\nDone — ${patched} patched, ${skipped} skipped.`);
