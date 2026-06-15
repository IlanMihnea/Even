// ============================================
// HOMEPAGE.JS
// ============================================

const FLUX_CONFIGS = {
  rezidential: {
    target: 'listings-rezidential.html',
    filters: [
      { name: 'regim', label: 'Regim', type: 'select', options: [
        { v: '', l: 'Toate' },
        { v: 'vanzare', l: 'Vânzare' },
        { v: 'inchiriere', l: 'Închiriere' }
      ]},
      { name: 'tip', label: 'Tip proprietate', type: 'select', options: [
        { v: '', l: 'Toate tipurile' },
        { v: 'apartament', l: 'Apartament' },
        { v: 'casa', l: 'Casă' },
        { v: 'vila', l: 'Vilă' },
        { v: 'duplex', l: 'Duplex' }
      ]},
      { name: 'oras', label: 'Oraș', type: 'text', placeholder: 'București, Cluj-Napoca…' },
      { name: 'camere', label: 'Camere min', type: 'select', options: [
        { v: '', l: 'Oricâte' },
        { v: '1', l: '1+' }, { v: '2', l: '2+' },
        { v: '3', l: '3+' }, { v: '4', l: '4+' }
      ]},
      { name: 'pretMax', label: 'Preț max (€)', type: 'number', placeholder: 'ex: 250000' }
    ]
  },
  comercial: {
    target: 'listings-comercial.html',
    filters: [
      { name: 'regim', label: 'Regim', type: 'select', options: [
        { v: '', l: 'Toate' },
        { v: 'vanzare', l: 'Vânzare' },
        { v: 'inchiriere', l: 'Închiriere' }
      ]},
      { name: 'tipSpatiu', label: 'Tip spațiu', type: 'select', options: [
        { v: '', l: 'Toate' },
        { v: 'birouri', l: 'Birouri' },
        { v: 'retail', l: 'Retail' },
        { v: 'depozit', l: 'Depozit/Hală' },
        { v: 'industrial', l: 'Industrial' },
        { v: 'showroom', l: 'Showroom' },
        { v: 'hotel', l: 'Hotel / Pensiune' }
      ]},
      { name: 'oras', label: 'Oraș', type: 'text', placeholder: 'București, Cluj…' },
      { name: 'suprafataMin', label: 'Suprafață min (mp)', type: 'number', placeholder: 'ex: 200' },
      { name: 'clasaCladire', label: 'Clasă clădire', type: 'select', options: [
        { v: '', l: 'Oricare' },
        { v: 'A', l: 'Clasa A' }, { v: 'B', l: 'Clasa B' }, { v: 'C', l: 'Clasa C' }
      ]}
    ]
  },
  terenuri: {
    target: 'listings-terenuri.html',
    filters: [
      { name: 'tip', label: 'Tip teren', type: 'select', options: [
        { v: '', l: 'Toate' },
        { v: 'intravilan-rezidential', l: 'Intravilan rezidențial' },
        { v: 'intravilan-comercial', l: 'Intravilan comercial' },
        { v: 'extravilan-agricol', l: 'Extravilan agricol' },
        { v: 'industrial', l: 'Industrial' }
      ]},
      { name: 'judet', label: 'Județ', type: 'text', placeholder: 'Ilfov, Cluj…' },
      { name: 'suprafataMin', label: 'Suprafață min (mp)', type: 'number', placeholder: '500' },
      { name: 'pretMax', label: 'Preț max (€)', type: 'number', placeholder: '500000' },
      { name: 'utilitati', label: 'Utilități', type: 'select', options: [
        { v: '', l: 'Indiferent' },
        { v: 'toate', l: 'Toate utilitățile' },
        { v: 'curent', l: 'Cu curent' }
      ]}
    ]
  },
  proiecte: {
    target: 'projects.html',
    filters: [
      { name: 'oras', label: 'Oraș', type: 'text', placeholder: 'București, Cluj…' },
      { name: 'status', label: 'Status', type: 'select', options: [
        { v: '', l: 'Toate' },
        { v: 'pre-vanzare', l: 'Pre-vânzare' },
        { v: 'construire', l: 'În construcție' },
        { v: 'finalizat', l: 'Finalizat' }
      ]},
      { name: 'tipUnitate', label: 'Tip unitate', type: 'select', options: [
        { v: '', l: 'Toate' },
        { v: '1 cameră', l: '1 cameră' },
        { v: '2 camere', l: '2 camere' },
        { v: '3 camere', l: '3 camere' },
        { v: 'Penthouse', l: 'Penthouse' }
      ]},
      { name: 'pretMax', label: 'Preț max (€)', type: 'number', placeholder: '300000' }
    ]
  }
};

let activeFlux = 'rezidential';

// Shared, cached projects loader (used by the Nº IV grid + the inline
// results shown under the "Proiecte noi" catalog tab).
let _homeProjectsPromise = null;
function loadHomeProjects() {
  if (!_homeProjectsPromise) _homeProjectsPromise = getProjects().catch(err => {
    console.error('Projects error:', err);
    _homeProjectsPromise = null;
    return [];
  });
  return _homeProjectsPromise;
}

// projectCardHTML, renderRezCard, renderComCard, renderTerCard, buildPropCard,
// cardPhoto, favBtn, shortPropNum, pricePerSqm, formatStatus, formatLivrare
// — definite în cards.js (încărcat înainte de acest fișier)

// ---- Property cards for inline catalog results (com / teren / rez) ----
let _homePropsCache = {};
function loadHomeProperties(cat) {
  if (!_homePropsCache[cat]) _homePropsCache[cat] = getProperties(cat).catch(err => {
    console.error('Properties error:', err);
    _homePropsCache[cat] = null;
    return [];
  });
  return _homePropsCache[cat];
}

// homePropPhoto → cardPhoto din cards.js
function homePropPhoto(imagini, titlu) { return cardPhoto(imagini, titlu); }

// buildHomePropCard → buildPropCard din cards.js
function buildHomePropCard(args) { return buildPropCard(args); }

function homePropCardHTML(p) {
  if (p.categorie === 'comercial') return renderComCard(p);
  if (p.categorie === 'terenuri') return renderTerCard(p);
  return renderRezCard(p);
}

// Inline results rendered directly under the active catalog tab, so
// selecting a category immediately shows real listings (not just filters).
let _inlineToken = 0;
async function renderInlineResults(flux) {
  const filters = document.getElementById('fluxFilters');
  if (!filters) return;
  let wrap = document.getElementById('fluxInline');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'fluxInline';
    wrap.className = 'flux-inline';
    // Place results full-width below the catalog card (not inside it).
    const anchor = filters.closest('.hp-catalog-card') || filters;
    anchor.insertAdjacentElement('afterend', wrap);
  }
  const token = ++_inlineToken;
  wrap.innerHTML = Array(4).fill(0).map(() => `
    <div class="prop-card skeleton-card">
      <div class="skeleton-img shimmer"></div>
      <div class="skeleton-body">
        <div class="skeleton-line w-80 shimmer"></div>
        <div class="skeleton-line w-60 shimmer"></div>
        <div class="skeleton-line w-40 shimmer" style="margin-top:16px"></div>
      </div>
    </div>`).join('');
  const target = (FLUX_CONFIGS[flux] || {}).target || '#';
  const footer = `<div class="flux-inline-foot"><a href="${target}" class="hp-link-arrow"><span>Vezi toate</span><i class="fa-solid fa-arrow-right"></i></a></div>`;

  if (flux === 'proiecte') {
    const projects = await loadHomeProjects();
    if (token !== _inlineToken) return;
    wrap.innerHTML = projects.length
      ? `<div class="hp-projects-grid">${projects.slice(0, 4).map(projectCardHTML).join('')}</div>${footer}`
      : '<div class="flux-inline-loading">Niciun proiect momentan.</div>';
    return;
  }

  const props = await loadHomeProperties(flux);
  if (token !== _inlineToken) return;
  wrap.innerHTML = props.length
    ? `<div class="featured-grid hp-featured-grid">${props.slice(0, 4).map(homePropCardHTML).join('')}</div>${footer}`
    : '<div class="flux-inline-loading">Nicio proprietate momentan.</div>';
  if (props.length && typeof applyFavStates === 'function') applyFavStates(wrap);
}

function renderFilters() {
  const cfg = FLUX_CONFIGS[activeFlux];
  const container = document.getElementById('fluxFilters');
  container.innerHTML = cfg.filters.map(f => {
    if (f.type === 'select') {
      return `
        <div class="form-group">
          <label>${f.label}</label>
          <select name="${f.name}">
            ${f.options.map(o => `<option value="${o.v}">${o.l}</option>`).join('')}
          </select>
        </div>`;
    }
    return `
      <div class="form-group">
        <label>${f.label}</label>
        <input type="${f.type}" name="${f.name}" placeholder="${f.placeholder || ''}">
      </div>`;
  }).join('') + `
    <div class="form-group">
      <label>&nbsp;</label>
      <button class="btn btn-gold btn-full" data-action="search-flux"><i class="fa-solid fa-magnifying-glass"></i> Caută</button>
    </div>
  `;
}

function searchFlux() {
  const cfg = FLUX_CONFIGS[activeFlux];
  const params = new URLSearchParams();
  document.querySelectorAll('#fluxFilters [name]').forEach(el => {
    if (el.value) params.set(el.name, el.value);
  });
  const qs = params.toString();
  window.location.href = cfg.target + (qs ? '?' + qs : '');
}

function setFluxTab(flux) {
  activeFlux = flux;
  const tabs = [...document.querySelectorAll('.flux-tab')];
  tabs.forEach(t => {
    const active = t.dataset.flux === flux;
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', String(active));
    t.setAttribute('tabindex', active ? '0' : '-1');
  });
  const panel = document.getElementById('fluxFilters');
  if (panel) panel.setAttribute('aria-labelledby', `tab-${flux}`);
  renderFilters();
  renderInlineResults(flux);
}

async function renderHeroFeature() {
  const wrap = document.getElementById('hpHeroFeature');
  if (!wrap) return;
  let p;
  try { p = await getHomeHeroProperty(); }
  catch (err) { console.error('Hero feature error:', err); return; }
  if (!p) return; // keep the default static card

  const cat = p.categorie;
  const propPage = cat === 'terenuri' ? 'property-teren.html' : `property-${cat}.html`;
  const link = `${propPage}?id=${encodeURIComponent(p.id)}`;
  const num = shortPropNum(p.id);

  let tagTxt, metaParts, priceTxt;
  if (cat === 'rezidential') {
    const tipLbl = escapeHtml((p.tip || '').charAt(0).toUpperCase() + (p.tip || '').slice(1));
    tagTxt = `${tipLbl}${p.camere ? ' · ' + p.camere + ' camere' : ''}`;
    metaParts = [
      p.suprafata ? `<span><i class="fa-solid fa-vector-square"></i>${p.suprafata} m²</span>` : '',
      p.camere ? `<span><i class="fa-solid fa-bed"></i>${p.camere} cam.</span>` : '',
      (p.cartier || p.oras) ? `<span><i class="fa-solid fa-location-dot"></i>${escapeHtml(p.cartier || p.oras)}</span>` : ''
    ];
    priceTxt = formatPrice(p.pret) + (p.regim === 'inchiriere' ? '<span class="per-month">/lună</span>' : '');
  } else if (cat === 'comercial') {
    const tipLbl = escapeHtml((p.tipSpatiu || 'Spațiu comercial').charAt(0).toUpperCase() + (p.tipSpatiu || 'Spațiu comercial').slice(1));
    tagTxt = `${tipLbl}${p.clasaCladire ? ' · Clasa ' + p.clasaCladire : ''}`;
    metaParts = [
      p.suprafataTotala ? `<span><i class="fa-solid fa-vector-square"></i>${p.suprafataTotala} m²</span>` : '',
      (p.cartier || p.oras) ? `<span><i class="fa-solid fa-location-dot"></i>${escapeHtml(p.cartier || p.oras)}</span>` : ''
    ];
    priceTxt = p.pretTotal ? formatPrice(p.pretTotal) : (p.pret ? formatPrice(p.pret) + '<span class="per-month"> €/mp/lună</span>' : 'Preț la cerere');
  } else { // terenuri
    const tipLbl = escapeHtml((p.tip || 'Teren').replace(/-/g, ' '));
    tagTxt = `Teren · ${tipLbl}`;
    metaParts = [
      p.suprafata ? `<span><i class="fa-solid fa-vector-square"></i>${p.suprafata} ${p.unitate || 'mp'}</span>` : '',
      (p.localitate || p.judet) ? `<span><i class="fa-solid fa-location-dot"></i>${escapeHtml(p.localitate || p.judet)}</span>` : ''
    ];
    priceTxt = p.pretTotal ? formatPrice(p.pretTotal) : 'Preț la cerere';
  }
  const meta = metaParts.filter(Boolean).join('<span class="hp-meta-rule"></span>');

  const photo = (p.imagini && p.imagini[0]) ? p.imagini[0] : '';
  const imgStyle = photo ? ` style="background-image:url('${photo.replace(/'/g, "%27")}')"` : '';
  const imgClass = photo ? 'hp-feature-image has-photo' : 'hp-feature-image';

  wrap.innerHTML = `
    <a class="hp-feature-card" href="${link}" style="text-decoration:none;color:inherit;display:block">
      <div class="hp-feature-eyebrow">
        <span>Selecție · Nº ${num}</span>
        <span class="hp-feature-mark">●</span>
      </div>
      <div class="${imgClass}"${imgStyle} role="img" aria-label="${escapeHtml(p.titlu || '')}">
        <span class="hp-feature-tag">${tagTxt}</span>
      </div>
      <div class="hp-feature-body">
        <h3 class="hp-feature-title">${escapeHtml(p.titlu || '')}</h3>
        <div class="hp-feature-meta">${meta}</div>
        <div class="hp-feature-foot">
          <span class="hp-feature-price">${priceTxt}</span>
          <span class="hp-feature-cta">Detalii <i class="fa-solid fa-arrow-up-right-from-square"></i></span>
        </div>
      </div>
    </a>
  `;
}

async function renderFeaturedProperties() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  try {
    const props = await loadHomeProperties('rezidential');
    grid.innerHTML = props.slice(0, 4).map(p => renderHomePropCard(p)).join('');
    if (typeof applyFavStates === 'function') applyFavStates(grid);
    setTimeout(() => {
      grid.querySelectorAll('.prop-card').forEach((card, i) => {
        card.classList.add('reveal');
        if (i < 4) card.classList.add(`reveal-delay-${i + 1}`);
      });
      if (typeof initScrollReveal === 'function') initScrollReveal();
    }, 20);
  } catch (err) {
    console.error('Featured properties error:', err);
    grid.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:24px">Proprietățile nu au putut fi încărcate.</p>';
  }
}

// shortPropNum, pricePerSqm, formatStatus, formatLivrare — în cards.js
// renderHomePropCard → renderRezCard din cards.js
function renderHomePropCard(p) { return renderRezCard(p); }

function applyFluxTabVisibility(counts) {
  if (!counts) return;
  const PROPERTY_CATEGORIES = ['rezidential', 'comercial', 'terenuri'];
  let firstVisible = null;

  document.querySelectorAll('.flux-tab').forEach(tab => {
    const flux = tab.dataset.flux;
    if (PROPERTY_CATEGORIES.includes(flux) && counts[flux] === 0) {
      tab.style.display = 'none';
    } else if (!firstVisible) {
      firstVisible = flux;
    }
  });

  if (counts[activeFlux] === 0 && firstVisible) {
    setFluxTab(firstVisible);
  }
}

// ============================================
// Hero scroll-scrub — video advances with scroll; page stays pinned until video ends.
// Desktop only; mobile / reduced-motion falls back to autoplay loop.
// ============================================
// Mobile: zoom discret pe cover image la scroll. State binar (on/off), nu scroll-linked.
function initMobileCoverZoom() {
  const cover = document.querySelector('.hp-hero-cover');
  if (!cover) return;
  const THRESHOLD = 60;          // px scroll down ca să se activeze zoom-ul
  let isZoomed = false;
  let ticking = false;

  function update() {
    ticking = false;
    const should = window.scrollY > THRESHOLD;
    if (should !== isZoomed) {
      isZoomed = should;
      cover.classList.toggle('is-zoomed', should);
    }
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  update();
}

function initHeroScrub() {
  const pin = document.getElementById('hpHeroPin');
  const video = document.getElementById('heroVideo');
  if (!pin || !video) return;

  // Mobile breakpoint aliniat cu CSS (.hp-hero-cover visible at <880px)
  const mq = window.matchMedia('(max-width: 880px), (prefers-reduced-motion: reduce)');
  // Pe mobile, nu descărcăm videoul de 18MB — cover-ul JPG/WebP face treaba.
  // Activăm zoom-ul discret pe cover image.
  if (mq.matches) {
    const src = video.querySelector('source');
    if (src) src.removeAttribute('src');
    video.removeAttribute('src');
    video.load();
    initMobileCoverZoom();
    return;
  }
  let raf = null;
  let scrollBound = false;

  function update() {
    raf = null;
    const rect = pin.getBoundingClientRect();
    const total = pin.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const scrolled = Math.min(Math.max(0, -rect.top), total);
    const progress = scrolled / total;
    const dur = video.duration;
    if (dur && isFinite(dur)) {
      const target = progress * dur;
      // Clamp inside [0, duration - 1 frame] to avoid stalling on the last frame
      video.currentTime = Math.min(Math.max(target, 0), Math.max(0, dur - 0.04));
    }
  }

  function onScroll() {
    if (raf == null) raf = requestAnimationFrame(update);
  }

  function ensureLoaded(cb) {
    if (video.readyState >= 1 && video.duration && isFinite(video.duration)) cb();
    else video.addEventListener('loadedmetadata', cb, { once: true });
  }

  function applyMode() {
    if (mq.matches) {
      // Mobile or reduced-motion: autoplay loop, no pinning
      pin.classList.remove('is-pinned');
      if (scrollBound) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        scrollBound = false;
      }
      video.setAttribute('loop', '');
      video.setAttribute('autoplay', '');
      video.play().catch(() => {});
    } else {
      // Desktop: scrub on scroll
      pin.classList.add('is-pinned');
      video.removeAttribute('autoplay');
      video.removeAttribute('loop');
      video.pause();
      if (!scrollBound) {
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        scrollBound = true;
      }
      ensureLoaded(() => onScroll());
    }
  }

  // Trigger full buffering at first scroll or load — preload="metadata" keeps initial load light
  let bufferTriggered = false;
  function triggerBuffer() {
    if (bufferTriggered || mq.matches) return;
    bufferTriggered = true;
    video.preload = 'auto';
    video.load();
  }
  window.addEventListener('scroll', triggerBuffer, { once: true, passive: true });
  window.addEventListener('load', triggerBuffer, { once: true });

  applyMode();
  if (mq.addEventListener) mq.addEventListener('change', applyMode);
  else if (mq.addListener) mq.addListener(applyMode);
}

function initScrollReveal() {
  const nums = document.querySelectorAll('.hp-figure-num[data-target]');
  const run = el => {
    const target = +el.dataset.target;
    const dur = 1800, t0 = performance.now();
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    };
    requestAnimationFrame(tick);
  };
  const ioFig = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { run(e.target); ioFig.unobserve(e.target); }
    });
  }, { threshold: 0.4 });
  nums.forEach(n => ioFig.observe(n));

  const reveals = document.querySelectorAll('[data-reveal]');
  const ioRev = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-revealed');
        ioRev.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });
  reveals.forEach(el => ioRev.observe(el));
}

document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.flux-tab').forEach(tab => {
    tab.addEventListener('click', () => setFluxTab(tab.dataset.flux));
  });

  // Roving tabindex keyboard nav (WAI-ARIA Tabs pattern)
  const tabList = document.querySelector('.hp-catalog-tabs');
  if (tabList) {
    tabList.addEventListener('keydown', e => {
      const tabs = [...tabList.querySelectorAll('.flux-tab:not([style*="display: none"])')];
      const idx = tabs.indexOf(document.activeElement);
      if (idx === -1) return;
      let next = -1;
      if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
      if (e.key === 'ArrowLeft')  next = (idx - 1 + tabs.length) % tabs.length;
      if (next !== -1) {
        e.preventDefault();
        setFluxTab(tabs[next].dataset.flux);
        tabs[next].focus();
      }
    });
  }
  renderFilters();
  renderInlineResults(activeFlux);

  initHeroScrub();

  const [counts] = await Promise.all([
    fetchCategoryCounts(),
    renderHeroFeature(),
    renderFeaturedProperties(),
  ]);
  applyFluxTabVisibility(counts);
  renderInlineResults(activeFlux);
  setTimeout(() => initScrollReveal(), 50);
});
