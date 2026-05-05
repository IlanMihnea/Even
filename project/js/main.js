// ============================================
// MAIN.JS - Utilitare globale + navbar + footer
// ============================================

// ---------- NAVBAR ----------
function renderNavbar(activePage = '') {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
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
        <a href="contact.html" class="btn btn-outline"><i class="fa-solid fa-phone"></i> Contact</a>
        <a href="admin.html" class="btn btn-primary">Admin</a>
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
      <a href="contact.html">Contact</a>
      <a href="admin.html">Admin</a>
    </div>
  `;
  const toggle = document.getElementById('navToggle');
  const mobile = document.getElementById('navMobile');
  if (toggle && mobile) {
    toggle.addEventListener('click', () => {
      mobile.classList.toggle('open');
      toggle.querySelector('i').className = mobile.classList.contains('open')
        ? 'fa-solid fa-xmark'
        : 'fa-solid fa-bars';
    });
  }
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
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="index.html" class="logo">
            <img src="design/logomark-even.svg" class="logo-mark-svg logo-svg-footer" alt="">
            <img src="design/logotype-even.svg" class="logo-type-svg logo-svg-footer" alt="EVEN">
          </a>
          <p>Strategie înainte de anunț. Evaluare corectă. Implicare reală în fiecare tranzacție.</p>
          <div class="footer-social">
            <a href="#" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
            <a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
            <a href="#" aria-label="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a>
            <a href="#" aria-label="YouTube"><i class="fa-brands fa-youtube"></i></a>
          </div>
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
            <li><a href="#">Carieră</a></li>
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
        | <a href="#" style="color: inherit">Termeni</a>
        | <a href="#" style="color: inherit">Confidențialitate</a>
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

// ---------- FAV BUTTON ----------
function toggleFav(btn) {
  btn.classList.toggle('fav-active');
  const icon = btn.querySelector('i');
  if (btn.classList.contains('fav-active')) {
    icon.className = 'fa-solid fa-heart';
    icon.style.color = '#e84545';
    btn.style.background = '#fff';
  } else {
    icon.className = 'fa-regular fa-heart';
    icon.style.color = '';
    btn.style.background = '';
  }
}

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
  const cached = sessionStorage.getItem('categoryCounts');
  if (cached) return JSON.parse(cached);
  try {
    const res = await fetch('/api/category-counts');
    if (!res.ok) return null;
    const counts = await res.json();
    sessionStorage.setItem('categoryCounts', JSON.stringify(counts));
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

// ---------- AUTO-INIT ----------
document.addEventListener('DOMContentLoaded', async () => {
  const activePage = document.body.dataset.page || '';
  renderNavbar(activePage);
  renderFooter();
  initNavbarScroll();
  initScrollReveal();
  initScrollToTop();

  const counts = await fetchCategoryCounts();
  applyCategoryVisibility(counts);
});
