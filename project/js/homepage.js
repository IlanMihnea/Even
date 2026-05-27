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
        { v: 'showroom', l: 'Showroom' }
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
      <button class="btn btn-gold btn-full" onclick="searchFlux()"><i class="fa-solid fa-magnifying-glass"></i> Caută</button>
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
  document.querySelectorAll('.flux-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.flux === flux);
  });
  renderFilters();
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
    const tipLbl = (p.tip || '').charAt(0).toUpperCase() + (p.tip || '').slice(1);
    tagTxt = `${tipLbl}${p.camere ? ' · ' + p.camere + ' camere' : ''}`;
    metaParts = [
      p.suprafata ? `<span><i class="fa-solid fa-vector-square"></i>${p.suprafata} m²</span>` : '',
      p.camere ? `<span><i class="fa-solid fa-bed"></i>${p.camere} cam.</span>` : '',
      (p.cartier || p.oras) ? `<span><i class="fa-solid fa-location-dot"></i>${p.cartier || p.oras}</span>` : ''
    ];
    priceTxt = formatPrice(p.pret) + (p.regim === 'inchiriere' ? '<span class="per-month">/lună</span>' : '');
  } else if (cat === 'comercial') {
    const tipLbl = (p.tipSpatiu || 'Spațiu comercial').charAt(0).toUpperCase() + (p.tipSpatiu || 'Spațiu comercial').slice(1);
    tagTxt = `${tipLbl}${p.clasaCladire ? ' · Clasa ' + p.clasaCladire : ''}`;
    metaParts = [
      p.suprafataTotala ? `<span><i class="fa-solid fa-vector-square"></i>${p.suprafataTotala} m²</span>` : '',
      (p.cartier || p.oras) ? `<span><i class="fa-solid fa-location-dot"></i>${p.cartier || p.oras}</span>` : ''
    ];
    priceTxt = p.pretTotal ? formatPrice(p.pretTotal) : (p.pret ? formatPrice(p.pret) + '<span class="per-month"> €/mp/lună</span>' : 'Preț la cerere');
  } else { // terenuri
    const tipLbl = (p.tip || 'Teren').replace(/-/g, ' ');
    tagTxt = `Teren · ${tipLbl}`;
    metaParts = [
      p.suprafata ? `<span><i class="fa-solid fa-vector-square"></i>${p.suprafata} ${p.unitate || 'mp'}</span>` : '',
      (p.localitate || p.judet) ? `<span><i class="fa-solid fa-location-dot"></i>${p.localitate || p.judet}</span>` : ''
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
      <div class="${imgClass}"${imgStyle} role="img" aria-label="${(p.titlu || '').replace(/"/g, '&quot;')}">
        <span class="hp-feature-tag">${tagTxt}</span>
      </div>
      <div class="hp-feature-body">
        <h3 class="hp-feature-title">${p.titlu || ''}</h3>
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
    const props = await getProperties('rezidential');
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

function shortPropNum(id) {
  return String(id || '').replace(/-/g, '').slice(0, 4).toUpperCase() || '----';
}

function pricePerSqm(pret, suprafata) {
  if (!pret || !suprafata) return '';
  return new Intl.NumberFormat('ro-RO').format(Math.round(pret / suprafata)) + ' €/m²';
}

function renderHomePropCard(p) {
  const link = `property-rezidential.html?id=${p.id}`;
  const eyebrow = `${p.regim === 'vanzare' ? 'Vânzare' : 'Închiriere'} · ${p.cartier}`;
  const meta = [
    `${p.camere} cam.`,
    `${p.suprafata} m²`,
    p.etaj != null ? `Et. ${p.etaj}${p.etajTotal ? '/' + p.etajTotal : ''}` : null
  ].filter(Boolean).join('<span class="sep"> · </span>');
  const price = formatPrice(p.pret) + (p.regim === 'inchiriere' ? '<span class="per-month">/lună</span>' : '');
  const sub = p.regim === 'vanzare' ? pricePerSqm(p.pret, p.suprafata) : '';
  const photo = (p.imagini && p.imagini[0])
    ? `<img src="${p.imagini[0]}" alt="${p.titlu}" loading="lazy">`
    : `<div class="img-placeholder"></div>`;

  return `
    <a class="prop-card" href="${link}" aria-label="${p.titlu}">
      <figure class="prop-card-media">
        <div class="prop-card-img">${photo}</div>
        <button class="prop-card-fav" type="button" data-prop-id="${p.id}"
                onclick="event.preventDefault(); event.stopPropagation(); toggleFav(this)"
                aria-label="Salvează la favorite">
          <i class="fa-regular fa-heart"></i>
        </button>
      </figure>
      <div class="prop-card-body">
        <div class="prop-card-eyebrow">
          <span>${eyebrow}</span>
          <span class="prop-card-num">Nº ${shortPropNum(p.id)}</span>
        </div>
        <h3 class="prop-card-title">${p.titlu}</h3>
        <p class="prop-card-meta">${meta}</p>
        <div class="prop-card-foot">
          <div>
            <span class="prop-card-price">${price}</span>
            ${sub ? `<span class="prop-card-price-sub">${sub}</span>` : ''}
          </div>
          <span class="prop-card-cta">Detalii <i class="fa-solid fa-arrow-right"></i></span>
        </div>
      </div>
    </a>
  `;
}

async function renderHomeProjects() {
  const grid = document.getElementById('projectsHomeGrid');
  if (!grid) return;
  try {
    const projects = await getProjects();
    grid.innerHTML = projects.map(p => `
      <a class="project-card project-compact" href="project-detail.html?id=${p.id}">
        <div class="project-card-img">
          <div class="img-placeholder"></div>
          <div class="status-tag">
            <span class="status-dot status-${p.status}"></span> ${formatStatus(p.status)}
          </div>
          <div class="available-tag">${p.unitatiDisponibile} unități disponibile</div>
        </div>
        <div class="project-card-body">
          <div class="project-dev">${p.dezvoltator}</div>
          <h3>${p.nume}</h3>
          <div class="project-loc"><i class="fa-solid fa-location-dot"></i> ${p.cartier}, ${p.oras}</div>
          <div class="project-price-range">
            ${formatPrice(p.intervalPret.min)} - ${formatPrice(p.intervalPret.max)}
            <span>preț unitate</span>
          </div>
          <div class="project-meta">
            <span>Livrare <strong>${formatLivrare(p.dataLivrare)}</strong></span>
            <span>Progres <strong>${p.progres}%</strong></span>
          </div>
        </div>
      </a>
    `).join('');
  } catch (err) {
    console.error('Projects error:', err);
  }
}

function formatStatus(s) {
  return { 'pre-vanzare': 'Pre-vânzare', 'construire': 'În construcție', 'finalizat': 'Finalizat' }[s] || s;
}

function formatLivrare(d) {
  const date = new Date(d);
  return date.toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' });
}

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
function initHeroScrub() {
  const pin = document.getElementById('hpHeroPin');
  const video = document.getElementById('heroVideo');
  if (!pin || !video) return;

  // Mobile breakpoint aliniat cu CSS (.hp-hero-cover visible at <880px)
  const mq = window.matchMedia('(max-width: 880px), (prefers-reduced-motion: reduce)');
  // Pe mobile, nu descărcăm videoul de 18MB — cover-ul JPG/WebP face treaba
  if (mq.matches) {
    const src = video.querySelector('source');
    if (src) src.removeAttribute('src');
    video.removeAttribute('src');
    video.load();
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

  applyMode();
  if (mq.addEventListener) mq.addEventListener('change', applyMode);
  else if (mq.addListener) mq.addListener(applyMode);
}

document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.flux-tab').forEach(tab => {
    tab.addEventListener('click', () => setFluxTab(tab.dataset.flux));
  });
  renderFilters();

  initHeroScrub();

  const [counts] = await Promise.all([
    fetchCategoryCounts(),
    renderHeroFeature(),
    renderFeaturedProperties(),
    renderHomeProjects(),
  ]);
  applyFluxTabVisibility(counts);
  setTimeout(() => initScrollReveal(), 50);
});
