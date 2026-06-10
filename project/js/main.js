// ============================================
// MAIN.JS - Utilitare globale + navbar + footer
// ============================================

// ---------- NAVBAR ----------
function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const mobile = document.getElementById('navMobile');
  if (toggle && mobile) {
    toggle.addEventListener('click', () => {
      const isOpen = mobile.classList.toggle('open');
      toggle.querySelector('i').className = isOpen
        ? 'fa-solid fa-xmark'
        : 'fa-solid fa-bars';
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
  }
}

function renderNavbar(activePage = '') {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  // If already inlined by scripts/inline-chrome.js, just wire up events
  if (navbar.children.length) { initNavToggle(); updateNavFavBadge(); return; }
  navbar.innerHTML = `
    <div class="container nav-inner">
      <a href="index.html" class="logo">
        <img src="design/logomark-even.svg" class="logo-mark-svg" alt="">
        <img src="design/logotype-even.svg" class="logo-type-svg" alt="EVEN">
      </a>
      <ul class="nav-links">
        <li><a href="index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">Acasă</a></li>
        <li><a href="listings-rezidential.html" class="nav-link ${activePage === 'rezidential' ? 'active' : ''}">Rezidențial</a></li>
        <li><a href="listings-comercial.html" class="nav-link ${activePage === 'comercial' ? 'active' : ''}">Comercial</a></li>
        <li><a href="listings-terenuri.html" class="nav-link ${activePage === 'terenuri' ? 'active' : ''}">Terenuri</a></li>
        <li><a href="projects.html" class="nav-link ${activePage === 'proiecte' ? 'active' : ''}">Proiecte Noi</a></li>
        <li><a href="about.html" class="nav-link ${activePage === 'about' ? 'active' : ''}">Despre</a></li>
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
  `;
  initNavToggle();
  updateNavFavBadge();
}

function updateNavFavBadge() {
  const count = getFavs().length;
  const badge = document.getElementById('navFavBadge');
  const mobileLink = document.getElementById('navMobileFavLink');
  if (badge) {
    badge.textContent = count;
    badge.hidden = count === 0;
  }
  if (mobileLink) {
    mobileLink.textContent = count > 0 ? `Favorite (${count})` : 'Favorite';
  }
}

// Owner-only hidden access to admin panel. Discreet on purpose.
// Three ways in:
//   1. Keyboard:        Ctrl/Cmd + Shift + A   (desktop)
//   2. Triple-click the EVEN logomark          (desktop)
//   3. Tap the footer copyright 5× quickly     (mobile-friendly — it's
//      plain text, not a link, so taps never navigate away)
function initAdminAccess() {
  const goAdmin = () => { window.location.href = 'admin.html'; };

  document.addEventListener('keydown', (e) => {
    if (e.shiftKey && (e.ctrlKey || e.metaKey) && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      goAdmin();
    }
  });

  // A reusable "secret knock": N taps within a short window.
  const secretKnock = (el, { taps = 5, windowMs = 1500 } = {}) => {
    if (!el) return;
    let count = 0, timer = null;
    el.addEventListener('pointerup', (e) => {
      count += 1;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { count = 0; }, windowMs);
      if (count >= taps) {
        count = 0;
        if (e.cancelable) e.preventDefault();
        goAdmin();
      }
    });
  };

  // Desktop: triple-click the navbar logomark.
  secretKnock(document.querySelector('.navbar .logo'), { taps: 3, windowMs: 600 });
  // Mobile: tap the footer copyright line 5× (generous window so it's easy).
  secretKnock(document.querySelector('.footer-bottom'), { taps: 5, windowMs: 2500 });
}

// ---------- NAVBAR SCROLL TRANSFORM ----------
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('nav-scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ---------- FOOTER ----------
function renderFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;
  // If already inlined by scripts/inline-chrome.js, skip re-render
  if (footer.children.length) return;
  footer.innerHTML = `
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
        © ${new Date().getFullYear()} EVEN Real Estate. Toate drepturile rezervate.
        | <a href="terms.html" style="color: inherit">Termeni</a>
        | <a href="privacy.html" style="color: inherit">Confidențialitate</a>
        | <a href="verificat-even.html" style="color: inherit">Verificat de EVEN</a>
        | <a href="favorite.html" style="color: inherit">Favorite</a>
      </div>
    </div>
  `;
}

// ---------- SCROLL REVEAL ----------
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if (!elements.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal-visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  elements.forEach(el => obs.observe(el));
}

// Adaugă clase reveal pe carduri după render
function applyRevealToCards(container = document) {
  const cards = container.querySelectorAll('.prop-card:not(.reveal), .project-card:not(.reveal)');
  cards.forEach((card, i) => {
    card.classList.add('reveal');
    const delayClass = `reveal-delay-${Math.min((i % 4) + 1, 5)}`;
    card.classList.add(delayClass);
  });
  initScrollReveal();
}

// ---------- FAV BUTTON (localStorage-backed) ----------
const FAV_STORE_KEY = 'even_favs';

function getFavs() {
  try { return JSON.parse(localStorage.getItem(FAV_STORE_KEY) || '[]'); }
  catch { return []; }
}
function saveFavs(arr) {
  localStorage.setItem(FAV_STORE_KEY, JSON.stringify(arr));
}
function isFav(id) {
  return getFavs().includes(String(id));
}

function toggleFav(btn) {
  const id = btn.dataset.propId || '';
  if (!id) {
    btn.classList.toggle('fav-active');
    return;
  }
  const favs = getFavs();
  const idx = favs.indexOf(String(id));
  if (idx >= 0) {
    favs.splice(idx, 1);
    btn.classList.remove('fav-active');
  } else {
    favs.push(String(id));
    btn.classList.add('fav-active');
  }
  saveFavs(favs);
  updateNavFavBadge();
  const icon = btn.querySelector('i');
  if (icon) icon.className = btn.classList.contains('fav-active') ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
}

function applyFavStates(scope = document) {
  scope.querySelectorAll('.prop-card-fav[data-prop-id], .fav[data-prop-id]').forEach(btn => {
    const id = btn.dataset.propId;
    if (id && isFav(id)) {
      btn.classList.add('fav-active');
      const icon = btn.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-heart';
    }
  });
}

// ---------- ESCAPE HTML ----------
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- GLOBAL EVENT DELEGATION ----------
document.addEventListener('click', e => {
  // Fav buttons — highest priority
  const fav = e.target.closest('.prop-card-fav');
  if (fav) { toggleFav(fav); return; }

  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  if (action === 'accept-cookies')    { acceptCookies(); return; }
  if (action === 'search-flux')       { if (typeof searchFlux   === 'function') searchFlux();   return; }
  if (action === 'reset-filters')     { if (typeof resetFilters === 'function') resetFilters(); return; }
  if (action === 'clear-favorites')   { if (typeof clearAllFavorites === 'function') clearAllFavorites(); return; }
  if (action === 'go-to-page')        { if (typeof goToPage === 'function') goToPage(+el.dataset.page); return; }
  if (action === 'open-lightbox')     { if (typeof openLightbox  === 'function') openLightbox(+(el.dataset.idx ?? 0)); return; }
  if (action === 'close-lightbox')    { if (typeof closeLightbox === 'function') closeLightbox(); return; }
  if (action === 'prev-lightbox')     { if (typeof prevLightbox  === 'function') prevLightbox(); return; }
  if (action === 'next-lightbox')     { if (typeof nextLightbox  === 'function') nextLightbox(); return; }
  if (action === 'share')             { if (typeof sharePage     === 'function') sharePage(); return; }
  if (action === 'print-page')        { window.print(); return; }
  if (action === 'toggle-description') { if (typeof toggleDescription === 'function') toggleDescription(el); return; }
  if (action === 'request-doc')       { if (typeof requestDoc   === 'function') requestDoc(el.dataset.doc); return; }
  if (action === 'scroll-to-form')    {
    e.preventDefault();
    const target = document.getElementById('ppForm');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
});

document.addEventListener('submit', e => {
  const form = e.target.closest('[data-submit-action]');
  if (!form) return;
  if (form.dataset.submitAction === 'submit-interest') {
    e.preventDefault();
    if (typeof submitInterest === 'function') submitInterest(e, form.dataset.projectName || '');
  }
  if (form.dataset.submitAction === 'submit-contact') {
    e.preventDefault();
    if (typeof submitContact === 'function') submitContact(e);
  }
});

// ---------- UTILITARE ----------
function formatPrice(n, suffix = '') {
  if (n == null) return '-';
  return new Intl.NumberFormat('ro-RO').format(n) + ' €' + suffix;
}

function formatSurface(val, unit = 'mp') {
  return `${val} ${unit}`;
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function getAllQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [k, v] of params) result[k] = v;
  return result;
}

function debounce(fn, delay = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// ---------- SMOOTH SCROLL TOP ----------
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Buton scroll-to-top apare la scroll
function initScrollToTop() {
  const btn = document.createElement('button');
  btn.className = 'scroll-top-btn';
  btn.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
  btn.setAttribute('aria-label', 'Sus');
  btn.onclick = scrollToTop;
  document.body.appendChild(btn);
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
}

// ---------- CATEGORY VISIBILITY ----------
async function fetchCategoryCounts() {
  // Short-lived sessionStorage cache so category tabs reflect newly added
  // properties within the same browser session. The endpoint is also edge-cached
  // (s-maxage=60), so a 60s TTL here just avoids redundant fetches between page
  // navigations without going stale for the whole session.
  const TTL_MS = 60 * 1000;
  try {
    const raw = sessionStorage.getItem('categoryCounts');
    if (raw) {
      const { counts, ts } = JSON.parse(raw);
      if (counts && ts && Date.now() - ts < TTL_MS) return counts;
    }
  } catch {}
  try {
    const res = await fetch('/api/category-counts');
    if (!res.ok) return null;
    const counts = await res.json();
    try { sessionStorage.setItem('categoryCounts', JSON.stringify({ counts, ts: Date.now() })); } catch {}
    return counts;
  } catch {
    return null;
  }
}

function applyCategoryVisibility(counts) {
  if (!counts) return;
  const hidden = new Set(
    ['rezidential', 'comercial', 'terenuri'].filter(c => counts[c] === 0)
  );
  if (!hidden.size) return;

  const hrefMap = {
    'listings-rezidential.html': 'rezidential',
    'listings-comercial.html': 'comercial',
    'listings-terenuri.html': 'terenuri',
  };

  const shouldHide = href => Object.entries(hrefMap).some(
    ([file, cat]) => href.includes(file) && hidden.has(cat)
  );

  document.querySelectorAll('.nav-links li').forEach(li => {
    const a = li.querySelector('a');
    if (a && shouldHide(a.getAttribute('href') || '')) li.style.display = 'none';
  });

  document.querySelectorAll('#navMobile a').forEach(a => {
    if (shouldHide(a.getAttribute('href') || '')) a.style.display = 'none';
  });

  document.querySelectorAll('.footer-links a').forEach(a => {
    if (shouldHide(a.getAttribute('href') || '')) {
      const li = a.closest('li');
      if (li) li.style.display = 'none';
    }
  });
}

// ---------- WHATSAPP FLOATING BUTTON ----------
function initWhatsAppButton() {
  if (document.body.dataset.page === 'admin') return;
  const a = document.createElement('a');
  a.className = 'wa-float';
  a.href = 'https://wa.me/40745609366?text=' + encodeURIComponent('Bună, am o întrebare despre o proprietate.');
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', 'WhatsApp Ilan');
  a.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/></svg>';
  document.body.appendChild(a);
}

// ---------- COOKIE BANNER ----------
function initCookieBanner() {
  const KEY = 'even_cookie_consent';
  if (localStorage.getItem(KEY)) return;
  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Consimțământ cookie-uri');
  banner.setAttribute('aria-live', 'polite');
  banner.innerHTML = `
    <div class="cookie-banner-inner">
      <div class="cookie-banner-text">
        <strong>Cookie-uri tehnice.</strong>
        <span>Folosim doar cookie-uri necesare pentru funcționare și salvarea preferințelor (favorite). Citește <a href="privacy.html">politica de confidențialitate</a>.</span>
      </div>
      <div class="cookie-banner-actions">
        <button type="button" class="cookie-btn cookie-btn-primary" data-action="accept-cookies">Am înțeles</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('is-visible'));
}

function acceptCookies() {
  localStorage.setItem('even_cookie_consent', String(Date.now()));
  const b = document.querySelector('.cookie-banner');
  if (b) {
    b.classList.remove('is-visible');
    setTimeout(() => b.remove(), 400);
  }
}

// ---------- AUTO-INIT ----------
document.addEventListener('DOMContentLoaded', async () => {
  const activePage = document.body.dataset.page || '';
  renderNavbar(activePage);
  renderFooter();
  initNavbarScroll();
  initAdminAccess();
  initScrollReveal();
  initScrollToTop();
  initWhatsAppButton();
  initCookieBanner();

  const counts = await fetchCategoryCounts();
  applyCategoryVisibility(counts);
});
