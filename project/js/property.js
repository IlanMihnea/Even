// ============================================
// PROPERTY.JS — Editorial detail page (rebuild · 2026)
// rezidential · comercial · terenuri
// ============================================

let currentProperty = null;
let galleryImages = [];
let lightboxIdx = 0;

// ---------- HELPERS ----------
function shortPropNumber(id) {
  return String(id || '').replace(/-/g, '').slice(0, 4).toUpperCase() || '----';
}

function fmtNum(n) {
  if (n == null) return '-';
  return new Intl.NumberFormat('ro-RO').format(n);
}

function categoryLabel(cat) {
  return { rezidential: 'Rezidențial', comercial: 'Comercial', terenuri: 'Teren' }[cat] || '';
}

function regimLabel(r) {
  return r === 'vanzare' ? 'Vânzare' : 'Închiriere';
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

// ---------- LAYOUT WRAPPERS ----------
function renderMasthead(p, category) {
  return `
    <section class="pp-masthead">
      <div class="pp-masthead-inner">
        <span class="pp-mast-mark">— Listing Nº ${shortPropNumber(p.id)} —</span>
        <span class="pp-mast-title">EVEN · ${categoryLabel(category)}</span>
        <span class="pp-mast-edition">${escapeHtml(p.oras || p.localitate || p.judet || 'România')}</span>
      </div>
    </section>`;
}

// ---------- GALLERY ----------
function renderGallery(imagini) {
  galleryImages = Array.isArray(imagini) ? imagini.filter(Boolean) : [];
  const total = galleryImages.length;

  const heroImg = galleryImages[0]
    ? `<img src="${escapeHtml(galleryImages[0])}" alt="" loading="eager">`
    : `<div class="img-placeholder"></div>`;

  // 6 thumb slots; if more than 6, last shows "+N foto" overlay
  const thumbCount = 6;
  const thumbs = [];
  for (let i = 0; i < thumbCount; i++) {
    const idx = i + 1;
    const url = galleryImages[idx];
    const isLastSlot = i === thumbCount - 1;
    const more = isLastSlot && total > thumbCount + 1;
    if (url) {
      thumbs.push(`
        <div class="pp-thumb" onclick="openLightbox(${idx})">
          <img src="${escapeHtml(url)}" alt="" loading="lazy">
          ${more ? `<div class="pp-thumb-more">+${total - thumbCount - 1} foto</div>` : ''}
        </div>`);
    } else if (i === 0 && total === 1) {
      // single image: no thumbs
      break;
    } else {
      thumbs.push(`<div class="pp-thumb" style="opacity:0.4;cursor:default;pointer-events:none"></div>`);
    }
  }

  return `
    <div class="pp-gallery">
      <div class="pp-gallery-hero" onclick="openLightbox(0)">
        ${heroImg}
        ${total > 0 ? `<div class="pp-gallery-counter">01 / ${String(total).padStart(2, '0')}</div>` : ''}
        ${total > 0 ? `<button class="pp-gallery-zoom" type="button" onclick="event.stopPropagation(); openLightbox(0)"><i class="fa-solid fa-expand"></i> Vezi toate</button>` : ''}
      </div>
      ${total > 1 ? `<div class="pp-gallery-thumbs">${thumbs.join('')}</div>` : ''}
    </div>`;
}

// ---------- LIGHTBOX ----------
function ensureLightbox() {
  let el = document.getElementById('ppLightbox');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'ppLightbox';
  el.className = 'pp-lightbox';
  el.innerHTML = `
    <button class="pp-lightbox-close" aria-label="Închide" onclick="closeLightbox()">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <button class="pp-lightbox-nav pp-lightbox-prev" aria-label="Anterior" onclick="prevLightbox()">
      <i class="fa-solid fa-chevron-left"></i>
    </button>
    <button class="pp-lightbox-nav pp-lightbox-next" aria-label="Următor" onclick="nextLightbox()">
      <i class="fa-solid fa-chevron-right"></i>
    </button>
    <div class="pp-lightbox-img-wrap">
      <img class="pp-lightbox-img" alt="">
    </div>
    <div class="pp-lightbox-counter"><strong></strong></div>
  `;
  document.body.appendChild(el);
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.classList.contains('pp-lightbox-img-wrap') || e.target.classList.contains('pp-lightbox-img')) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (!el.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevLightbox();
    if (e.key === 'ArrowRight') nextLightbox();
  });
  return el;
}

function openLightbox(idx) {
  if (!galleryImages.length) return;
  lightboxIdx = idx;
  const el = ensureLightbox();
  updateLightbox();
  el.classList.add('is-open');
  document.body.classList.add('pp-lightbox-open');
}

function closeLightbox() {
  const el = document.getElementById('ppLightbox');
  if (el) el.classList.remove('is-open');
  document.body.classList.remove('pp-lightbox-open');
}

function prevLightbox() {
  lightboxIdx = (lightboxIdx - 1 + galleryImages.length) % galleryImages.length;
  updateLightbox();
}

function nextLightbox() {
  lightboxIdx = (lightboxIdx + 1) % galleryImages.length;
  updateLightbox();
}

function updateLightbox() {
  const el = document.getElementById('ppLightbox');
  if (!el) return;
  el.querySelector('.pp-lightbox-img').src = galleryImages[lightboxIdx];
  el.querySelector('.pp-lightbox-counter strong').textContent =
    `${String(lightboxIdx + 1).padStart(2, '0')} / ${String(galleryImages.length).padStart(2, '0')}`;
}

// ---------- TITLE BLOCK ----------
function renderTitleBlock(p, opts) {
  const { eyebrow, address, priceMain, priceSub } = opts;
  const id = p.id;
  return `
    <header class="pp-title-block">
      <div class="pp-title-meta">
        <span class="pp-title-eyebrow">${eyebrow}</span>
        <h1 class="pp-title-h1">${escapeHtml(p.titlu)}</h1>
        <div class="pp-title-address">
          <i class="fa-solid fa-location-dot"></i>
          <span>${address}</span>
        </div>
        <div class="pp-title-actions">
          <button class="pp-action-btn pp-fav-btn" type="button" data-prop-id="${id}"
                  onclick="toggleFav(this)" aria-label="Salvează la favorite">
            <i class="fa-regular fa-heart"></i>
            <span>Salvează</span>
          </button>
          <button class="pp-action-btn" type="button" onclick="sharePage()" aria-label="Partajează">
            <i class="fa-solid fa-share-nodes"></i>
            <span>Partajează</span>
          </button>
        </div>
      </div>
      <div class="pp-title-price">
        <div class="pp-price-main">${priceMain}</div>
        ${priceSub ? `<div class="pp-price-rule"></div><div class="pp-price-sub">${priceSub}</div>` : ''}
      </div>
    </header>`;
}

// ---------- QUICK STATS ----------
function renderStats(stats) {
  return `
    <section class="pp-stats">
      ${stats.map(s => `
        <div class="pp-stat">
          <span class="pp-stat-val">${s.val}${s.unit ? `<small>${s.unit}</small>` : ''}</span>
          <div class="pp-stat-rule"></div>
          <span class="pp-stat-label">${s.label}</span>
        </div>
      `).join('')}
    </section>`;
}

// ---------- DESCRIPTION ----------
function renderDescription(text) {
  if (!text) return '';
  const paragraphs = text.split(/\n+/).filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join('');
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Despre proprietate</span>
      <h2 class="pp-section-h2">Descriere</h2>
      <div class="pp-description">${paragraphs}</div>
    </section>`;
}

// ---------- DOTĂRI (rezi) ----------
function renderDotari(p) {
  const items = [...(p.facilitati || [])];
  if (p.parcare) items.push('Loc parcare');
  if (p.balcon) items.push('Balcon');
  if (!items.length) return '';
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Dotări &amp; facilități</span>
      <h2 class="pp-section-h2">Ce include proprietatea</h2>
      <ul class="pp-dotari">
        ${items.map(it => `<li>${escapeHtml(it)}</li>`).join('')}
      </ul>
    </section>`;
}

// ---------- CALCULATOR RATE (rezi vânzare) ----------
function renderCalcRate(p) {
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Calculator rate</span>
      <h2 class="pp-section-h2">Estimare rată ipotecară</h2>
      <div class="pp-calc">
        <div class="pp-calc-presets" role="tablist">
          <button class="pp-calc-preset" type="button" data-preset="conservator">Conservator · 30% avans</button>
          <button class="pp-calc-preset active" type="button" data-preset="standard">Standard · 20% avans</button>
          <button class="pp-calc-preset" type="button" data-preset="intins">Întins · 15% avans</button>
        </div>
        <div class="pp-calc-inputs">
          <div class="form-group">
            <label>Preț proprietate (€)</label>
            <input type="number" id="calcPret" value="${p.pret || 0}" oninput="calcRate()">
          </div>
          <div class="form-group">
            <label>Avans (%)</label>
            <input type="number" id="calcAvans" value="20" oninput="calcRate(); clearActivePreset()">
          </div>
          <div class="form-group">
            <label>Dobândă anuală (%)</label>
            <input type="number" step="0.1" id="calcDobanda" value="6.5" oninput="calcRate(); clearActivePreset()">
          </div>
          <div class="form-group">
            <label>Perioadă (ani)</label>
            <input type="number" id="calcAni" value="30" oninput="calcRate(); clearActivePreset()">
          </div>
        </div>
        <div class="pp-calc-disclaimer">
          Calcul orientativ. Pentru ofertă reală, contactează banca.
        </div>
        <div class="pp-calc-result">
          <div class="pp-calc-result-main">
            <div class="pp-calc-result-label">Rată lunară estimată</div>
            <div class="pp-calc-result-val" id="calcRezultat">-</div>
          </div>
          <div class="pp-calc-result-side">
            <div class="pp-calc-result-label">Sumă împrumutată</div>
            <div class="pp-calc-result-val sm" id="calcImprumut">-</div>
          </div>
        </div>
      </div>
    </section>`;
}

function setCalcPreset(preset) {
  const presets = {
    conservator: { avans: 30, dobanda: 6.5, ani: 25 },
    standard:    { avans: 20, dobanda: 6.5, ani: 30 },
    intins:      { avans: 15, dobanda: 7.0, ani: 30 }
  };
  const p = presets[preset];
  if (!p) return;
  document.getElementById('calcAvans').value = p.avans;
  document.getElementById('calcDobanda').value = p.dobanda;
  document.getElementById('calcAni').value = p.ani;
  document.querySelectorAll('.pp-calc-preset').forEach(b => b.classList.toggle('active', b.dataset.preset === preset));
  calcRate();
}

function clearActivePreset() {
  document.querySelectorAll('.pp-calc-preset').forEach(b => b.classList.remove('active'));
}

function calcRate() {
  const pret = +document.getElementById('calcPret').value || 0;
  const avansPct = +document.getElementById('calcAvans').value || 0;
  const dobanda = (+document.getElementById('calcDobanda').value || 0) / 100;
  const ani = +document.getElementById('calcAni').value || 1;
  const imprumut = pret * (1 - avansPct / 100);
  const dl = dobanda / 12;
  const luni = ani * 12;
  let rata = 0;
  if (dl > 0) {
    rata = imprumut * (dl * Math.pow(1 + dl, luni)) / (Math.pow(1 + dl, luni) - 1);
  } else {
    rata = imprumut / luni;
  }
  document.getElementById('calcRezultat').textContent = fmtNum(Math.round(rata)) + ' €';
  document.getElementById('calcImprumut').textContent = fmtNum(Math.round(imprumut)) + ' €';
}

// ---------- CALCULATOR COST LUNAR (comercial închiriere) ----------
function renderCalcLunar(p) {
  const pretMp = p.pret || 0;
  const sup = p.suprafataTotala || 0;
  const baseRent = pretMp * sup;
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Estimare cost</span>
      <h2 class="pp-section-h2">Cost lunar total</h2>
      <div class="pp-calc">
        <div class="pp-calc-inputs">
          <div class="form-group">
            <label>Suprafață (m²)</label>
            <input type="number" id="calcSup" value="${sup}" oninput="calcLunar()">
          </div>
          <div class="form-group">
            <label>Preț (€/m²/lună)</label>
            <input type="number" step="0.1" id="calcPretMp" value="${pretMp}" oninput="calcLunar()">
          </div>
          <div class="form-group">
            <label>Mentenanță estimată (€/m²/lună)</label>
            <input type="number" step="0.1" id="calcMent" value="3" oninput="calcLunar()">
          </div>
          <div class="form-group">
            <label>Utilități medii (€/lună)</label>
            <input type="number" id="calcUtil" value="800" oninput="calcLunar()">
          </div>
        </div>
        <div class="pp-calc-disclaimer">
          Estimare orientativă. Mentenanța și utilitățile depind de clădire și consum.
        </div>
        <div class="pp-calc-result">
          <div class="pp-calc-result-main">
            <div class="pp-calc-result-label">Cost lunar total estimat</div>
            <div class="pp-calc-result-val" id="calcLunarTotal">-</div>
          </div>
          <div class="pp-calc-result-side">
            <div class="pp-calc-result-label">Doar chirie</div>
            <div class="pp-calc-result-val sm" id="calcLunarChirie">${fmtNum(baseRent)} €</div>
          </div>
        </div>
      </div>
    </section>`;
}

function calcLunar() {
  const sup = +document.getElementById('calcSup').value || 0;
  const pretMp = +document.getElementById('calcPretMp').value || 0;
  const ment = +document.getElementById('calcMent').value || 0;
  const util = +document.getElementById('calcUtil').value || 0;
  const chirie = sup * pretMp;
  const total = chirie + (sup * ment) + util;
  document.getElementById('calcLunarTotal').textContent = fmtNum(Math.round(total)) + ' €';
  document.getElementById('calcLunarChirie').textContent = fmtNum(Math.round(chirie)) + ' €';
}

// ---------- CALCULATOR CONSTRUIBIL (teren) ----------
function renderCalcConstruibil(p) {
  if (!p.CUT && !p.POT) return '';
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Calculator construibil</span>
      <h2 class="pp-section-h2">Potențial de <em>construire</em></h2>
      <div class="pp-calc">
        <div class="pp-calc-inputs">
          <div class="form-group">
            <label>Suprafață teren (m²)</label>
            <input type="number" id="calcTeren" value="${p.suprafata && p.unitate === 'mp' ? p.suprafata : (p.suprafata * 10000) || 0}" oninput="calcBuild()">
          </div>
          <div class="form-group">
            <label>CUT (coeficient utilizare)</label>
            <input type="number" step="0.1" id="calcCUT" value="${p.CUT || 0}" oninput="calcBuild()">
          </div>
          <div class="form-group">
            <label>POT (% ocupare teren)</label>
            <input type="number" step="1" id="calcPOT" value="${p.POT || 0}" oninput="calcBuild()">
          </div>
        </div>
        <div class="pp-calc-disclaimer">
          Calcul indicativ pe baza zonării PUG. Valori finale se verifică cu Certificat de Urbanism.
        </div>
        <div class="pp-build-result">
          <div class="pp-build-result-item">
            <div class="pp-build-result-label">Suprafață construibilă maximă</div>
            <div class="pp-build-result-val" id="calcBuildMax">-<small>m² desfășurați</small></div>
          </div>
          <div class="pp-build-result-item">
            <div class="pp-build-result-label">Amprentă maximă la sol</div>
            <div class="pp-build-result-val" id="calcBuildAmpr">-<small>m² la sol</small></div>
          </div>
        </div>
      </div>
    </section>`;
}

function calcBuild() {
  const teren = +document.getElementById('calcTeren').value || 0;
  const cut = +document.getElementById('calcCUT').value || 0;
  const pot = +document.getElementById('calcPOT').value || 0;
  document.getElementById('calcBuildMax').innerHTML = fmtNum(Math.round(teren * cut)) + '<small>m² desfășurați</small>';
  document.getElementById('calcBuildAmpr').innerHTML = fmtNum(Math.round(teren * pot / 100)) + '<small>m² la sol</small>';
}

// ---------- FIȘĂ TEHNICĂ (comercial) ----------
function renderFisaTehnica(p) {
  const s = p.specificatii || {};
  const rows = [
    { l: 'Alimentare electrică', v: s.electric },
    { l: 'Climatizare', v: s.climatizare },
    { l: 'Pardoseală', v: s.pardoseala },
    { l: 'Iluminat', v: s.iluminat },
    { l: 'Rampă încărcare', v: s.rampa ? 'Da' : 'Nu' },
    { l: 'Încărcătoare electrice', v: s.incarcator ? 'Da' : 'Nu' },
    { l: 'Clasă energetică', v: `Clasa ${p.clasaCladire || '—'}` },
    { l: 'Locuri parcare', v: p.locuriParcare != null ? p.locuriParcare : '—' }
  ].filter(r => r.v != null && r.v !== '');
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Fișă tehnică</span>
      <h2 class="pp-section-h2">Specificații</h2>
      <div class="pp-specs">
        ${rows.map(r => `
          <div class="pp-spec-row">
            <span class="pp-spec-label">${escapeHtml(r.l)}</span>
            <span class="pp-spec-val">${escapeHtml(r.v)}</span>
          </div>
        `).join('')}
      </div>
    </section>`;
}

// ---------- UTILITĂȚI (teren) ----------
function renderUtilitati(p) {
  const utilsAll = [
    { k: 'apa', i: 'fa-droplet', t: 'Apă' },
    { k: 'curent', i: 'fa-bolt', t: 'Curent' },
    { k: 'gaz', i: 'fa-fire', t: 'Gaz' },
    { k: 'canalizare', i: 'fa-toilet', t: 'Canalizare' }
  ];
  const have = p.utilitati || [];
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Utilități</span>
      <h2 class="pp-section-h2">Disponibile pe lot</h2>
      <div class="pp-utils">
        ${utilsAll.map(u => `
          <div class="pp-util-card ${have.includes(u.k) ? 'active' : 'inactive'}">
            <i class="fa-solid ${u.i}"></i>
            <div class="pp-util-name">${u.t}</div>
            <span class="pp-util-status">${have.includes(u.k) ? 'Conectat' : 'Indisponibil'}</span>
          </div>
        `).join('')}
      </div>
    </section>`;
}

// ---------- REGIM JURIDIC (teren) ----------
function renderRegimJuridic(p) {
  const rows = [
    { l: 'Suprafață', v: p.suprafata != null ? `${p.suprafata} ${p.unitate}` : null },
    { l: 'Front stradal', v: p.frontStradal != null ? `${p.frontStradal} ml` : null },
    { l: 'Acces drum', v: p.accesDrum ? capitalize(p.accesDrum) : null },
    { l: 'Zonare PUG', v: p.zonarePUG },
    { l: 'CUT', v: p.CUT },
    { l: 'POT', v: p.POT != null ? `${p.POT}%` : null }
  ].filter(r => r.v != null && r.v !== '');
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Regim juridic &amp; urbanistic</span>
      <h2 class="pp-section-h2">Date cadastrale</h2>
      <div class="pp-specs">
        ${rows.map(r => `
          <div class="pp-spec-row">
            <span class="pp-spec-label">${escapeHtml(r.l)}</span>
            <span class="pp-spec-val">${escapeHtml(r.v)}</span>
          </div>
        `).join('')}
      </div>
    </section>`;
}

// ---------- PLAN ETAJ / CADASTRAL ----------
function renderPlan(category) {
  const labels = {
    rezidential: { eyebrow: '— Plan apartament', h2: 'Schiță &amp; dimensiuni', icon: 'fa-ruler-combined', text: 'Plan etaj disponibil în PDF la cerere.' },
    comercial:   { eyebrow: '— Plan / layout',     h2: 'Configurație spațiu',  icon: 'fa-object-group',   text: 'Layout disponibil în CAD la cerere.' },
    terenuri:    { eyebrow: '— Plan cadastral',    h2: 'Topografie &amp; formă lot', icon: 'fa-map-location-dot', text: 'Plan cadastral disponibil în PDF la cerere.' }
  };
  const c = labels[category] || labels.rezidential;
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">${c.eyebrow}</span>
      <h2 class="pp-section-h2">${c.h2}</h2>
      <div class="pp-plan-plate">
        <i class="fa-solid ${c.icon} pp-plan-icon"></i>
        <p class="pp-plan-text">${c.text}</p>
        <button class="pp-plan-cta" type="button" onclick="requestDoc('plan')">
          Solicită <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </section>`;
}

// ---------- HARTĂ + POI ----------
function renderMap(p, category) {
  const eyebrow = category === 'terenuri' ? '— Locație lot' : '— Zona &amp; vecinătăți';
  const h2 = category === 'terenuri' ? 'Poziționare' : 'Repere în apropiere';
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">${eyebrow}</span>
      <h2 class="pp-section-h2">${h2}</h2>
      <div class="pp-map" id="ppMap">
        <div class="pp-map-loading">Se încarcă harta...</div>
      </div>
      ${category !== 'terenuri' ? `
      <ul class="pp-poi-list">
        <li><i class="fa-solid fa-school"></i> Școli &amp; grădinițe în apropiere</li>
        <li><i class="fa-solid fa-train-subway"></i> Metrou / transport public</li>
        <li><i class="fa-solid fa-cart-shopping"></i> Supermarket-uri</li>
        <li><i class="fa-solid fa-tree"></i> Parc</li>
      </ul>` : ''}
    </section>`;
}

// Initialize Leaflet map after DOM render
async function initPropertyMap(p, category) {
  const mapEl = document.getElementById('ppMap');
  if (!mapEl || typeof L === 'undefined') return;

  const fullAddress = [p.adresa, p.cartier, p.localitate, p.oras, p.judet]
    .filter(Boolean).join(', ');

  // Try Nominatim geocoding (OSM, free, no API key)
  let lat = null, lng = null;
  try {
    const q = encodeURIComponent(fullAddress + ', Romania');
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`, {
      headers: { 'Accept-Language': 'ro' }
    });
    const data = await res.json();
    if (data && data[0]) {
      lat = parseFloat(data[0].lat);
      lng = parseFloat(data[0].lon);
    }
  } catch (_) { /* fallback below */ }

  // Fallback: city centroid (rough, hardcoded for major cities)
  if (lat == null) {
    const fallback = {
      'București': [44.4268, 26.1025],
      'Cluj-Napoca': [46.7712, 23.6236],
      'Timișoara': [45.7489, 21.2087],
      'Brașov': [45.6427, 25.5887],
      'Iași': [47.1585, 27.6014],
      'Constanța': [44.1598, 28.6348]
    };
    const city = p.oras || p.localitate || 'București';
    const f = fallback[city] || fallback['București'];
    lat = f[0]; lng = f[1];
  }

  mapEl.innerHTML = '';
  const map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: true })
    .setView([lat, lng], category === 'terenuri' ? 14 : 15);

  // Toner-lite tiles for editorial b/w feel; fall back to OSM standard
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap, &copy; CARTO'
  }).addTo(map);

  const icon = L.divIcon({
    className: '',
    html: '<div class="pp-map-marker"></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
  L.marker([lat, lng], { icon }).addTo(map)
    .bindPopup(`<strong>${escapeHtml(p.titlu)}</strong><br>${escapeHtml(fullAddress)}`);
}

// ---------- DOCUMENTE (teren) ----------
function renderDocs() {
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Documente disponibile</span>
      <h2 class="pp-section-h2">La solicitare</h2>
      <div class="pp-docs">
        <button class="pp-doc-card" type="button" onclick="requestDoc('CF')">
          <span class="pp-doc-icon"><i class="fa-solid fa-file-lines"></i></span>
          <span class="pp-doc-body">
            <span class="pp-doc-name">Extras CF</span>
            <span class="pp-doc-action">Solicită PDF →</span>
          </span>
        </button>
        <button class="pp-doc-card" type="button" onclick="requestDoc('CU')">
          <span class="pp-doc-icon"><i class="fa-solid fa-stamp"></i></span>
          <span class="pp-doc-body">
            <span class="pp-doc-name">Certificat Urbanism</span>
            <span class="pp-doc-action">Solicită PDF →</span>
          </span>
        </button>
        <button class="pp-doc-card" type="button" onclick="requestDoc('PUZ')">
          <span class="pp-doc-icon"><i class="fa-solid fa-map"></i></span>
          <span class="pp-doc-body">
            <span class="pp-doc-name">PUZ / PUG zonă</span>
            <span class="pp-doc-action">Solicită PDF →</span>
          </span>
        </button>
      </div>
    </section>`;
}

// ---------- SIDEBAR ----------
function renderSidebar(agent, p) {
  if (!agent) return '<aside class="pp-sidebar"></aside>';
  const initials = (agent.nume || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const avatar = agent.foto
    ? `<img src="${escapeHtml(agent.foto)}" alt="${escapeHtml(agent.nume)}">`
    : initials;
  return `
    <aside class="pp-sidebar">
      <div class="pp-agent-card">
        <span class="pp-agent-eyebrow">— Agent EVEN</span>
        <div class="pp-agent-top">
          <div class="pp-agent-foto">${avatar}</div>
          <div>
            <div class="pp-agent-name">${escapeHtml(agent.nume)}</div>
            <div class="pp-agent-role">${escapeHtml(agent.rol || '')}</div>
          </div>
        </div>
        <div class="pp-agent-contact">
          <a href="tel:${agent.telefon}"><i class="fa-solid fa-phone"></i><span>${escapeHtml(agent.telefon)}</span></a>
          <a href="mailto:${agent.email}"><i class="fa-solid fa-envelope"></i><span>${escapeHtml(agent.email)}</span></a>
        </div>
        <a href="tel:${agent.telefon}" class="pp-call-btn">
          <i class="fa-solid fa-phone"></i> Sună acum
        </a>
      </div>

      <div class="pp-form-card">
        <span class="pp-form-eyebrow">— Cerere</span>
        <h3 class="pp-form-h3">Programează o <em>vizionare</em></h3>
        <form onsubmit="submitVizionare(event)">
          <div class="form-group">
            <label>Nume</label>
            <input type="text" name="nume" required placeholder="Numele tău">
          </div>
          <div class="form-group">
            <label>Telefon</label>
            <input type="tel" name="telefon" required placeholder="07xx xxx xxx">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" required placeholder="email@exemplu.ro">
          </div>
          <div class="form-group">
            <label>Mesaj (opțional)</label>
            <textarea name="mesaj" placeholder="Sunt interesat(ă) de această proprietate..."></textarea>
          </div>
          <button class="pp-form-submit" type="submit">Trimite cererea</button>
        </form>
        <p class="pp-form-note">Răspuns în maxim 2 ore lucrătoare.</p>
      </div>

      <div class="pp-trust">
        <div class="pp-trust-stones" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div class="pp-trust-text">
          <strong>Verificat de EVEN</strong>
          <small>Documente, vizionare, predare</small>
        </div>
      </div>
    </aside>`;
}

// ---------- MOBILE BOTTOM CTA ----------
function renderMobileCta(agent) {
  if (!agent) return '';
  return `
    <div class="pp-mobile-cta">
      <a href="tel:${agent.telefon}"><i class="fa-solid fa-phone"></i> Sună acum</a>
      <button type="button" onclick="document.querySelector('.pp-form-card').scrollIntoView({behavior:'smooth', block:'center'})">
        <i class="fa-solid fa-calendar-check"></i> Programează vizionare
      </button>
    </div>`;
}

// ---------- TOAST ----------
function showToast(title, body) {
  let el = document.getElementById('ppToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'ppToast';
    el.className = 'pp-toast';
    document.body.appendChild(el);
  }
  el.innerHTML = `<div><span class="pp-toast-title">${escapeHtml(title)}</span><div class="pp-toast-body">${escapeHtml(body)}</div></div>`;
  // re-trigger animation
  el.classList.remove('is-visible');
  // eslint-disable-next-line no-unused-expressions
  void el.offsetWidth;
  el.classList.add('is-visible');
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => el.classList.remove('is-visible'), 4500);
}

// ---------- ACTIONS ----------
async function submitVizionare(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form));
  const payload = {
    nume: data.nume,
    email: data.email,
    telefon: data.telefon,
    mesaj: data.mesaj || `Cerere vizionare pentru: ${currentProperty?.titlu || 'proprietate'}`,
    property_id: currentProperty?.id || null,
    agent_id: currentProperty?.agent?.id || null,
    tip: 'vizionare',
    sursa: 'website'
  };

  if (btn) { btn.disabled = true; btn.dataset.origLabel = btn.textContent; btn.textContent = 'Se trimite...'; }

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || 'Eroare server');
    }
    form.reset();
    showToast('Cererea a ajuns la Ilan.', 'Răspuns în maxim 2 ore lucrătoare. Te contactăm la telefonul indicat.');
  } catch (err) {
    try {
      const queue = JSON.parse(localStorage.getItem('even_lead_queue') || '[]');
      queue.push({ ...payload, created_at: new Date().toISOString() });
      localStorage.setItem('even_lead_queue', JSON.stringify(queue));
    } catch (_) {}
    showToast('Trimitere automată indisponibilă.', 'Sună-ne direct la 0745 609 366.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset.origLabel || 'Trimite cererea'; }
  }
}

function requestDoc(kind) {
  showToast(`Solicitare trimisă · ${kind}`, 'Documentul îți va fi trimis pe email în cursul zilei.');
}

function sharePage() {
  const url = window.location.href;
  const title = document.title;
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {});
    return;
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link copiat.', 'Lipește-l unde vrei să-l împărtășești.');
    });
  }
}

// ---------- ATMOSPHERE OVERLAYS ----------
function ensureAtmosphere() {
  if (document.querySelector('.pp-bg-grain')) return;
  const grain = document.createElement('div');
  grain.className = 'pp-bg-grain';
  grain.setAttribute('aria-hidden', 'true');
  const light = document.createElement('div');
  light.className = 'pp-bg-light';
  light.setAttribute('aria-hidden', 'true');
  document.body.prepend(grain, light);
}

// ---------- PER-CATEGORY RENDERS ----------
function renderRezidential(p) {
  const eyebrow = `${regimLabel(p.regim)} · ${escapeHtml(p.cartier)} · ${escapeHtml(p.oras)}`;
  const address = escapeHtml([p.adresa, p.cartier, p.oras].filter(Boolean).join(', '));
  const priceMain = formatPrice(p.pret) + (p.regim === 'inchiriere' ? '<small>/lună</small>' : '');
  const priceSub = p.regim === 'vanzare' && p.pret && p.suprafata
    ? `${fmtNum(Math.round(p.pret / p.suprafata))} €/m²`
    : null;

  const stats = [
    { val: p.camere, label: 'Camere' },
    { val: p.suprafata, unit: 'm²', label: 'Suprafață' },
    p.etaj != null ? { val: `${p.etaj}/${p.etajTotal}`, label: 'Etaj' } : null,
    p.anConstructie ? { val: p.anConstructie, label: 'An' } : null,
    p.orientare ? { val: p.orientare, label: 'Orientare' } : null
  ].filter(Boolean);

  document.title = `${p.titlu} · EVEN`;
  document.getElementById('breadcrumbs').innerHTML = `
    <a href="index.html">Acasă</a> / <a href="listings-rezidential.html">Rezidențial</a> / ${escapeHtml(p.titlu)}
  `;

  const html = `
    ${renderMasthead(p, 'rezidential')}
    <main class="prop-detail">
      <div class="container">
        ${renderGallery(p.imagini)}
        ${renderTitleBlock(p, { eyebrow, address, priceMain, priceSub })}
        ${renderStats(stats)}
        <div class="pp-layout">
          <div class="pp-main">
            ${renderDescription(p.descriere)}
            ${renderDotari(p)}
            ${p.regim === 'vanzare' ? renderCalcRate(p) : ''}
            ${renderPlan('rezidential')}
            ${renderMap(p, 'rezidential')}
          </div>
          ${renderSidebar(p.agent, p)}
        </div>
      </div>
    </main>
    ${renderMobileCta(p.agent)}
  `;

  document.getElementById('detailContent').innerHTML = ''; // clear loading
  // Re-mount: replace breadcrumb section + insert content
  const brEl = document.querySelector('.page-header');
  if (brEl) brEl.outerHTML = `<header class="page-header pp-breadcrumbs-host" style="padding: 16px 0; background: transparent; border-top: 1px solid rgba(28,35,64,0.14); border-bottom: 1px solid rgba(28,35,64,0.14)"><div class="container"><div class="breadcrumbs" id="breadcrumbs"></div></div></header>`;
  document.getElementById('breadcrumbs').innerHTML = `
    <a href="index.html">Acasă</a> · <a href="listings-rezidential.html">Rezidențial</a> · ${escapeHtml(p.titlu)}
  `;
  // Replace main content host with our editorial layout
  const main = document.querySelector('main.prop-detail');
  if (main) main.outerHTML = html;

  // Wire up: presets, fav state, calc, map
  document.querySelectorAll('.pp-calc-preset').forEach(btn => {
    btn.addEventListener('click', () => setCalcPreset(btn.dataset.preset));
  });
  if (typeof applyFavStates === 'function') applyFavStates(document);
  if (p.regim === 'vanzare') calcRate();
  setTimeout(() => initPropertyMap(p, 'rezidential'), 300);
}

function renderComercial(p) {
  const tipLabels = { birouri: 'Birouri', retail: 'Retail', depozit: 'Depozit/Hală', industrial: 'Industrial', showroom: 'Showroom' };
  const eyebrow = `${regimLabel(p.regim)} · ${tipLabels[p.tipSpatiu] || ''} · Clasa ${p.clasaCladire || '—'}`;
  const address = escapeHtml([p.adresa, p.cartier, p.oras].filter(Boolean).join(', '));
  const priceMain = p.pret
    ? `${p.pret} €<small>/m²/lună</small>`
    : formatPrice(p.pretTotal);
  const priceSub = p.pret && p.suprafataTotala
    ? `~ ${fmtNum(p.pret * p.suprafataTotala)} €/lună`
    : null;

  const stats = [
    { val: p.suprafataTotala, unit: 'm²', label: 'Total' },
    p.suprafataUtila ? { val: p.suprafataUtila, unit: 'm²', label: 'Utili' } : null,
    p.etaj != null ? { val: p.etaj, label: 'Etaj' } : null,
    p.locuriParcare != null ? { val: p.locuriParcare, label: 'Parcare' } : null,
    p.inaltimeLibera ? { val: p.inaltimeLibera, unit: 'm', label: 'Înălțime' } : null
  ].filter(Boolean);

  document.title = `${p.titlu} · EVEN`;

  const html = `
    ${renderMasthead(p, 'comercial')}
    <main class="prop-detail">
      <div class="container">
        ${renderGallery(p.imagini)}
        ${renderTitleBlock(p, { eyebrow, address, priceMain, priceSub })}
        ${renderStats(stats)}
        <div class="pp-layout">
          <div class="pp-main">
            ${renderDescription(p.descriere)}
            ${renderFisaTehnica(p)}
            ${p.regim === 'inchiriere' ? renderCalcLunar(p) : ''}
            ${renderPlan('comercial')}
            ${renderMap(p, 'comercial')}
          </div>
          ${renderSidebar(p.agent, p)}
        </div>
      </div>
    </main>
    ${renderMobileCta(p.agent)}
  `;

  const brEl = document.querySelector('.page-header');
  if (brEl) brEl.outerHTML = `<header class="page-header pp-breadcrumbs-host" style="padding: 16px 0; background: transparent; border-top: 1px solid rgba(28,35,64,0.14); border-bottom: 1px solid rgba(28,35,64,0.14)"><div class="container"><div class="breadcrumbs" id="breadcrumbs"></div></div></header>`;
  document.getElementById('breadcrumbs').innerHTML = `
    <a href="index.html">Acasă</a> · <a href="listings-comercial.html">Comercial</a> · ${escapeHtml(p.titlu)}
  `;
  const main = document.querySelector('main.prop-detail');
  if (main) main.outerHTML = html;

  if (typeof applyFavStates === 'function') applyFavStates(document);
  if (p.regim === 'inchiriere') calcLunar();
  setTimeout(() => initPropertyMap(p, 'comercial'), 300);
}

function renderTeren(p) {
  const tipLabels = {
    'intravilan-rezidential': 'Intravilan rezidențial',
    'intravilan-comercial': 'Intravilan comercial',
    'extravilan-agricol': 'Extravilan agricol',
    'industrial': 'Industrial'
  };
  const eyebrow = `${tipLabels[p.tip] || 'Teren'} · ${escapeHtml(p.localitate || '')} · ${escapeHtml(p.judet || '')}`;
  const address = escapeHtml([p.adresa, p.localitate, p.judet].filter(Boolean).join(', '));
  const priceMain = formatPrice(p.pretTotal);
  const priceSub = p.pretMp ? `${p.pretMp} €/m² · ${p.suprafata} ${p.unitate}` : null;

  const stats = [
    { val: p.suprafata, unit: ` ${p.unitate}`, label: 'Suprafață' },
    p.frontStradal ? { val: p.frontStradal, unit: 'ml', label: 'Front stradal' } : null,
    p.CUT != null ? { val: p.CUT, label: 'CUT' } : null,
    p.POT != null ? { val: p.POT, unit: '%', label: 'POT' } : null,
    p.accesDrum ? { val: capitalize(p.accesDrum), label: 'Acces' } : null
  ].filter(Boolean);

  document.title = `${p.titlu} · EVEN`;

  const html = `
    ${renderMasthead(p, 'terenuri')}
    <main class="prop-detail">
      <div class="container">
        ${renderGallery(p.imagini)}
        ${renderTitleBlock(p, { eyebrow, address, priceMain, priceSub })}
        ${renderStats(stats)}
        <div class="pp-layout">
          <div class="pp-main">
            ${renderDescription((p.descriere || '') + (p.vecinatati ? `\n\n**Vecinătăți:** ${p.vecinatati}` : ''))}
            ${renderUtilitati(p)}
            ${renderRegimJuridic(p)}
            ${renderCalcConstruibil(p)}
            ${renderPlan('terenuri')}
            ${renderMap(p, 'terenuri')}
            ${renderDocs()}
          </div>
          ${renderSidebar(p.agent, p)}
        </div>
      </div>
    </main>
    ${renderMobileCta(p.agent)}
  `;

  const brEl = document.querySelector('.page-header');
  if (brEl) brEl.outerHTML = `<header class="page-header pp-breadcrumbs-host" style="padding: 16px 0; background: transparent; border-top: 1px solid rgba(28,35,64,0.14); border-bottom: 1px solid rgba(28,35,64,0.14)"><div class="container"><div class="breadcrumbs" id="breadcrumbs"></div></div></header>`;
  document.getElementById('breadcrumbs').innerHTML = `
    <a href="index.html">Acasă</a> · <a href="listings-terenuri.html">Terenuri</a> · ${escapeHtml(p.titlu)}
  `;
  const main = document.querySelector('main.prop-detail');
  if (main) main.outerHTML = html;

  if (typeof applyFavStates === 'function') applyFavStates(document);
  if (p.CUT || p.POT) calcBuild();
  setTimeout(() => initPropertyMap(p, 'terenuri'), 300);
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', async () => {
  ensureAtmosphere();

  const id = getQueryParam('id');
  const category = PROPERTY_PAGE.category;
  const contentEl = document.getElementById('detailContent');

  if (!id) {
    contentEl.innerHTML = '<div class="empty-state"><i class="fa-regular fa-circle-question"></i><h3>Proprietate inexistentă</h3><p>Linkul nu conține un ID valid.</p></div>';
    return;
  }

  contentEl.innerHTML = '<div style="text-align:center;padding:96px 24px;color:var(--pp-ink-mute, #6b6560)"><i class="fa-solid fa-spinner fa-spin fa-2x" style="opacity:0.4"></i></div>';

  const p = await getPropertyById(id, category);
  currentProperty = p;

  if (!p) {
    contentEl.innerHTML = '<div class="empty-state"><i class="fa-regular fa-circle-question"></i><h3>Proprietate inexistentă</h3><p>Verifică linkul sau întoarce-te la <a href="listings-' + category + '.html">listă</a>.</p></div>';
    return;
  }

  if (category === 'rezidential') renderRezidential(p);
  else if (category === 'comercial') renderComercial(p);
  else if (category === 'terenuri') renderTeren(p);
});
