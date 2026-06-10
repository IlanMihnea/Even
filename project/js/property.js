// ============================================
// PROPERTY.JS — Rebuild · EVEN 2026
// rezidential · comercial · terenuri
// ============================================

let currentProperty = null;
let galleryImages   = [];
let lightboxIdx     = 0;

// ---------- HELPERS ----------
function shortPropNumber(id) {
  return String(id || '').replace(/-/g, '').slice(0, 4).toUpperCase() || '----';
}
function waNumber(tel) {
  const d = String(tel || '').replace(/\D/g, '');
  if (!d) return '40745609366';
  if (d.startsWith('40')) return d;
  if (d.startsWith('0')) return '40' + d.slice(1);
  return d;
}
function waLink(tel, title) {
  const num = waNumber(tel);
  const txt = encodeURIComponent(`Bună, sunt interesat(ă) de ${title || 'această proprietate'}. Aș vrea mai multe detalii.`);
  return `https://wa.me/${num}?text=${txt}`;
}
function fmtNum(n) {
  if (n == null) return '-';
  return new Intl.NumberFormat('ro-RO').format(n);
}
function formatPrice(v) {
  if (!v) return '—';
  return fmtNum(v) + ' €';
}
function categoryLabel(cat) {
  return { rezidential: 'Rezidențial', comercial: 'Comercial', terenuri: 'Teren' }[cat] || '';
}
function regimLabel(r) {
  return r === 'vanzare' ? 'Vânzare' : 'Închiriere';
}
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, ch =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
}
function getQueryParam(k) {
  return new URLSearchParams(window.location.search).get(k);
}

// ---------- GALLERY MOSAIC ----------
function setGallery(imagini) {
  galleryImages = Array.isArray(imagini) ? imagini.filter(Boolean) : [];
}

function renderMosaic(p, opts) {
  const { eyebrow, address, priceMain, priceSub } = opts;
  const imgs = galleryImages;
  const total = imgs.length;
  const id = p.id;

  const mainImg = imgs[0]
    ? `<img src="${escapeHtml(imgs[0])}" alt="" loading="eager">`
    : '';

  const side1 = imgs[1] ? `<img src="${escapeHtml(imgs[1])}" alt="" loading="eager">` : '';
  const moreCount = total > 3 ? total - 3 : 0;
  let side2Html = '';
  if (imgs[2]) {
    side2Html = `<img src="${escapeHtml(imgs[2])}" alt="" loading="lazy">`;
    if (moreCount > 0) {
      side2Html += `<div class="pp-mosaic-more"><strong>+${moreCount}</strong>foto</div>`;
    }
  }

  const hasSides = imgs.length >= 2;

  return `
    <div class="pp-mosaic"${imgs[0] ? ' data-action="open-lightbox" data-idx="0"' : ''}>
      <div class="pp-mosaic-main">
        ${mainImg}
        <div class="pp-mosaic-overlay" aria-hidden="true"></div>
        <div class="pp-mosaic-grain"   aria-hidden="true"></div>
        <div class="pp-mosaic-frame"   aria-hidden="true">
          <div class="pp-mosaic-corner pp-mosaic-corner-tl"></div>
          <div class="pp-mosaic-corner pp-mosaic-corner-tr"></div>
          <div class="pp-mosaic-corner pp-mosaic-corner-bl"></div>
          <div class="pp-mosaic-corner pp-mosaic-corner-br"></div>
        </div>
        <div class="pp-mosaic-actions">
          <button class="pp-mosaic-btn pp-fav-btn prop-card-fav" data-prop-id="${id}" aria-label="Salvează">
            <i class="fa-regular fa-heart"></i><span>Salvează</span>
          </button>
          ${total > 1 ? `
          <button class="pp-mosaic-btn" data-action="open-lightbox" data-idx="0" aria-label="Galerie">
            <i class="fa-solid fa-expand"></i><span>${total} foto</span>
          </button>` : ''}
          <button class="pp-mosaic-btn" data-action="share" aria-label="Partajează">
            <i class="fa-solid fa-share-nodes"></i><span>Share</span>
          </button>
        </div>
        <div class="pp-mosaic-info">
          <div class="pp-mosaic-eyebrow">${eyebrow}</div>
          <h1 class="pp-mosaic-title">${escapeHtml(p.titlu)}</h1>
          <div class="pp-mosaic-price">${priceMain}${priceSub ? `<div style="font-size:.45em;font-weight:500;opacity:.7;margin-top:6px;letter-spacing:.04em">${priceSub}</div>` : ''}</div>
          <div class="pp-mosaic-addr">
            <i class="fa-solid fa-location-dot"></i>
            <span>${address}</span>
          </div>
        </div>
      </div>
      ${hasSides ? `
      <div class="pp-mosaic-side" data-action="open-lightbox" data-idx="1">${side1}</div>
      <div class="pp-mosaic-side" data-action="open-lightbox" data-idx="2">${side2Html}</div>
      ` : ''}
    </div>`;
}

// ---------- PARALLAX (mosaic main image) ----------
function initParallax() {
  const img = document.querySelector('.pp-mosaic-main img');
  if (!img) return;
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = img.closest('.pp-mosaic').getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const offset = Math.max(-50, Math.min(80, window.scrollY * 0.18));
        img.style.transform = `translate3d(0,${offset}px,0) scale(1.06)`;
      }
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ---------- SCROLL PROGRESS ----------
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'pp-scroll-progress';
  document.body.prepend(bar);
  const update = () => {
    const doc   = document.documentElement;
    const total = doc.scrollHeight - doc.clientHeight;
    bar.style.height = (total > 0 ? (window.scrollY / total) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ---------- COUNT-UP ----------
function animateNumber(el, target) {
  const isFloat = /\./.test(String(target));
  const num = parseFloat(String(target).replace(/[^\d.\-]/g, ''));
  if (!isFinite(num)) { el.textContent = target; return; }
  const duration = 900;
  const start = performance.now();
  const fmt = v => isFloat ? v.toFixed(1) : new Intl.NumberFormat('ro-RO').format(Math.round(v));
  const step = now => {
    const t = Math.min(1, (now - start) / duration);
    const e = 1 - Math.pow(1 - t, 3);
    el.textContent = fmt(num * e);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initCountUp() {
  const nums = document.querySelectorAll('.pp-stat-num[data-value]');
  if (!('IntersectionObserver' in window) || !nums.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      animateNumber(en.target, en.target.dataset.value);
      io.unobserve(en.target);
    });
  }, { threshold: 0.4 });
  nums.forEach(el => io.observe(el));
}

// ---------- LIGHTBOX ----------
function ensureLightbox() {
  let el = document.getElementById('ppLightbox');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'ppLightbox';
  el.className = 'pp-lightbox';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `
    <button class="pp-lightbox-close" aria-label="Închide" data-action="close-lightbox">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <button class="pp-lightbox-nav pp-lightbox-prev" aria-label="Anterior" data-action="prev-lightbox">
      <i class="fa-solid fa-chevron-left"></i>
    </button>
    <button class="pp-lightbox-nav pp-lightbox-next" aria-label="Următor" data-action="next-lightbox">
      <i class="fa-solid fa-chevron-right"></i>
    </button>
    <div class="pp-lightbox-img-wrap">
      <img class="pp-lightbox-img" alt="">
    </div>
    <div class="pp-lightbox-counter"><strong></strong></div>`;
  document.body.appendChild(el);
  el.addEventListener('click', e => {
    if (e.target === el ||
        e.target.classList.contains('pp-lightbox-img-wrap') ||
        e.target.classList.contains('pp-lightbox-img')) closeLightbox();
  });
  document.addEventListener('keydown', e => {
    if (!el.classList.contains('is-open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  prevLightbox();
    if (e.key === 'ArrowRight') nextLightbox();
  });

  // --- Touch swipe (mobile) ---
  const imgWrap = el.querySelector('.pp-lightbox-img-wrap');
  const imgEl   = el.querySelector('.pp-lightbox-img');
  let tStartX = 0, tStartY = 0, tStartT = 0, tracking = false;
  const onStart = e => {
    if (e.touches.length !== 1) { tracking = false; return; }
    tracking = true;
    tStartX = e.touches[0].clientX;
    tStartY = e.touches[0].clientY;
    tStartT = Date.now();
    if (imgEl) imgEl.style.transition = 'none';
  };
  const onMove = e => {
    if (!tracking || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - tStartX;
    const dy = e.touches[0].clientY - tStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
      if (imgEl) imgEl.style.transform = `translateX(${dx}px)`;
    }
  };
  const onEnd = e => {
    if (!tracking) return;
    tracking = false;
    const t = (e.changedTouches && e.changedTouches[0]) || null;
    if (imgEl) { imgEl.style.transition = ''; imgEl.style.transform = ''; }
    if (!t) return;
    const dx = t.clientX - tStartX;
    const dy = t.clientY - tStartY;
    const dt = Date.now() - tStartT;
    if (Math.abs(dx) > Math.abs(dy) && (Math.abs(dx) > 50 || (Math.abs(dx) > 30 && dt < 300))) {
      if (dx < 0) nextLightbox(); else prevLightbox();
    }
  };
  [el, imgWrap].forEach(t => {
    if (!t) return;
    t.addEventListener('touchstart', onStart, { passive: true });
    t.addEventListener('touchmove',  onMove,  { passive: false });
    t.addEventListener('touchend',   onEnd,   { passive: true });
    t.addEventListener('touchcancel',onEnd,   { passive: true });
  });
  return el;
}
function openLightbox(idx) {
  if (!galleryImages.length) return;
  lightboxIdx = idx;
  ensureLightbox();
  updateLightbox();
  document.getElementById('ppLightbox').classList.add('is-open');
  document.body.classList.add('pp-lb-open');
}
function closeLightbox() {
  const el = document.getElementById('ppLightbox');
  if (el) el.classList.remove('is-open');
  document.body.classList.remove('pp-lb-open');
}
function prevLightbox() { lightboxIdx = (lightboxIdx - 1 + galleryImages.length) % galleryImages.length; updateLightbox(); }
function nextLightbox() { lightboxIdx = (lightboxIdx + 1) % galleryImages.length; updateLightbox(); }
function updateLightbox() {
  const el = document.getElementById('ppLightbox');
  if (!el) return;
  el.querySelector('.pp-lightbox-img').src = galleryImages[lightboxIdx];
  el.querySelector('.pp-lightbox-counter strong').textContent =
    `${String(lightboxIdx + 1).padStart(2,'0')} / ${String(galleryImages.length).padStart(2,'0')}`;
}

// ---------- STATS ----------
function renderStats(stats) {
  if (!stats.length) return '';
  return `
    <div class="pp-stats">
      ${stats.map(s => {
        const raw = String(s.val);
        const isNum = typeof s.val === 'number' || /^-?\d[\d.,]*$/.test(raw);
        const numEl = isNum
          ? `<span class="pp-stat-num" data-value="${escapeHtml(raw)}">0</span>`
          : `<span class="pp-stat-num">${escapeHtml(raw)}</span>`;
        const unit = s.unit ? `<small>${escapeHtml(s.unit)}</small>` : '';
        return `
          <div class="pp-stat">
            <span class="pp-stat-val">${numEl}${unit}</span>
            <span class="pp-stat-label">${escapeHtml(s.label)}</span>
          </div>`;
      }).join('')}
    </div>`;
}

// ---------- TITLE ROW ----------
function renderTitleRow(p, opts) {
  const { eyebrow, address, priceMain, priceSub } = opts;
  return `
    <div class="pp-title-row">
      <div>
        <span class="pp-title-eyebrow">${eyebrow}</span>
        <h1>${escapeHtml(p.titlu)}</h1>
        <div class="pp-title-addr">
          <i class="fa-solid fa-location-dot"></i>
          <span>${address}</span>
        </div>
        <div class="pp-title-actions">
          <button class="pp-btn-ghost pp-fav-btn prop-card-fav" data-prop-id="${p.id}">
            <i class="fa-regular fa-heart"></i> Salvează
          </button>
          <button class="pp-btn-ghost" data-action="share">
            <i class="fa-solid fa-share-nodes"></i> Partajează
          </button>
        </div>
      </div>
      <div class="pp-title-price">
        <div class="pp-price-main">${priceMain}</div>
        ${priceSub ? `<div class="pp-price-sub">${priceSub}</div>` : ''}
      </div>
    </div>`;
}

// ---------- DESCRIPTION ----------
function renderDescription(text) {
  if (!text) return '';
  const cleaned = String(text)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/?p[^>]*>/gi, '\n')
    .replace(/<\/?(strong|b)>/gi, '__B__')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

  const blocks = cleaned.split(/\r?\n\s*\r?\n|\r?\n/).map(p => p.trim()).filter(Boolean);
  if (!blocks.length) return '';

  const html = blocks.map((b, i) => {
    const content = escapeHtml(b)
      .replace(/__B__(.+?)__B__/g, '<strong>$1</strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const cls = i === 0 ? ' class="pp-description-lead"' : '';
    return `<p${cls}>${content}</p>`;
  }).join('');

  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Despre proprietate</span>
      <h2 class="pp-section-h2">Descriere</h2>
      <div class="pp-description-wrap is-collapsed" data-collapsible="pending">
        <div class="pp-description">${html}</div>
        <div class="pp-description-fade" aria-hidden="true"></div>
      </div>
      <button type="button" class="pp-description-toggle" data-action="toggle-description" hidden>
        <span class="pp-desc-toggle-label">Vezi mai mult</span>
        <i class="fa-solid fa-chevron-down"></i>
      </button>
    </section>`;
}

function toggleDescription(btn) {
  const section = btn.closest('section');
  const wrap = section && section.querySelector('.pp-description-wrap');
  if (!wrap) return;
  const collapsed = wrap.classList.toggle('is-collapsed');
  const label = btn.querySelector('.pp-desc-toggle-label');
  const icon  = btn.querySelector('i');
  if (label) label.textContent = collapsed ? 'Vezi mai mult' : 'Vezi mai puțin';
  if (icon)  icon.className = collapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
}

function initDescriptionClamp() {
  document.querySelectorAll('.pp-description-wrap[data-collapsible="pending"]').forEach(wrap => {
    wrap.dataset.collapsible = 'done';
    const inner = wrap.querySelector('.pp-description');
    if (!inner) return;
    // Measure full natural height by temporarily un-clamping
    wrap.classList.remove('is-collapsed');
    const fullH = inner.getBoundingClientRect().height;
    wrap.classList.add('is-collapsed');
    // CSS clamp = 360px. If content overflows, expose the toggle.
    const limit = 360;
    if (fullH > limit + 40) {
      const btn = wrap.parentElement.querySelector('.pp-description-toggle');
      if (btn) btn.hidden = false;
    } else {
      wrap.classList.remove('is-collapsed');
    }
  });
}

// ---------- FEATURES / DOTĂRI ----------
function renderFeatures(p) {
  const items = [...(p.facilitati || [])];
  if (p.parcare) items.push('Loc parcare');
  if (p.balcon)  items.push('Balcon');
  if (!items.length) return '';
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Dotări &amp; facilități</span>
      <h2 class="pp-section-h2">Ce <em>include</em> proprietatea</h2>
      <ul class="pp-features">
        ${items.map(it => `<li>${escapeHtml(it)}</li>`).join('')}
      </ul>
    </section>`;
}

// ---------- CTA STRIP ----------
function renderCtaStrip(p, agent) {
  if (!agent) return '';
  const fname = (agent.nume || '').split(' ')[0] || 'Ilan';
  return `
    <aside class="pp-cta-strip">
      <div>
        <span class="pp-cta-strip-label">— Te interesează?</span>
        <p class="pp-cta-strip-text">
          Scrie-i lui ${escapeHtml(fname)} direct sau <em>programează o vizionare</em>.
        </p>
      </div>
      <div class="pp-cta-strip-btns">
        <a href="${waLink(agent.telefon, p.titlu)}" target="_blank" rel="noopener" class="pp-cta-wa">
          <i class="fa-brands fa-whatsapp"></i> WhatsApp
        </a>
        <a href="#ppForm" class="pp-cta-book" data-action="scroll-to-form">
          <i class="fa-solid fa-calendar-check"></i> Programează
        </a>
      </div>
    </aside>`;
}

// ---------- CALCULATOR RATE (rezi vânzare) ----------
function renderCalcRate(p) {
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Calculator rate</span>
      <h2 class="pp-section-h2">Estimare rată <em>ipotecară</em></h2>
      <div class="pp-calc">
        <div class="pp-calc-tabs">
          <button class="pp-calc-tab" data-preset="conservator" type="button">Conservator · 30%</button>
          <button class="pp-calc-tab active" data-preset="standard" type="button">Standard · 20%</button>
          <button class="pp-calc-tab" data-preset="intins" type="button">Întins · 15%</button>
        </div>
        <div class="pp-calc-grid">
          <div class="pp-calc-field">
            <label>Preț proprietate (€)</label>
            <input type="number" id="calcPret" value="${p.pret || 0}" oninput="calcRate()">
          </div>
          <div class="pp-calc-field">
            <label>Avans (%)</label>
            <input type="number" id="calcAvans" value="20" oninput="calcRate(); clearActivePreset()">
          </div>
          <div class="pp-calc-field">
            <label>Dobândă anuală (%)</label>
            <input type="number" step="0.1" id="calcDobanda" value="6.5" oninput="calcRate(); clearActivePreset()">
          </div>
          <div class="pp-calc-field">
            <label>Perioadă (ani)</label>
            <input type="number" id="calcAni" value="30" oninput="calcRate(); clearActivePreset()">
          </div>
        </div>
        <p class="pp-calc-note">Calcul orientativ. Pentru ofertă reală, contactează banca.</p>
        <div class="pp-calc-result">
          <div>
            <div class="pp-calc-result-label">Rată lunară estimată</div>
            <div class="pp-calc-result-val" id="calcRezultat">—</div>
          </div>
          <div class="pp-calc-result-side">
            <div class="pp-calc-result-label">Sumă împrumutată</div>
            <div class="pp-calc-result-val sm" id="calcImprumut">—</div>
          </div>
        </div>
      </div>
    </section>`;
}

function setCalcPreset(preset) {
  const presets = {
    conservator: { avans:30, dobanda:6.5, ani:25 },
    standard:    { avans:20, dobanda:6.5, ani:30 },
    intins:      { avans:15, dobanda:7.0, ani:30 }
  };
  const p = presets[preset]; if (!p) return;
  document.getElementById('calcAvans').value   = p.avans;
  document.getElementById('calcDobanda').value = p.dobanda;
  document.getElementById('calcAni').value     = p.ani;
  document.querySelectorAll('.pp-calc-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.preset === preset));
  calcRate();
}
function clearActivePreset() {
  document.querySelectorAll('.pp-calc-tab').forEach(b => b.classList.remove('active'));
}
function calcRate() {
  const pret   = +document.getElementById('calcPret').value || 0;
  const avPct  = +document.getElementById('calcAvans').value || 0;
  const dob    = (+document.getElementById('calcDobanda').value || 0) / 100;
  const ani    = +document.getElementById('calcAni').value || 1;
  const impr   = pret * (1 - avPct / 100);
  const dl     = dob / 12;
  const luni   = ani * 12;
  let rata = dl > 0
    ? impr * (dl * Math.pow(1+dl,luni)) / (Math.pow(1+dl,luni) - 1)
    : impr / luni;
  document.getElementById('calcRezultat').textContent = fmtNum(Math.round(rata)) + ' €';
  document.getElementById('calcImprumut').textContent = fmtNum(Math.round(impr))  + ' €';
}

// ---------- CALCULATOR COST LUNAR (comercial) ----------
function renderCalcLunar(p) {
  const pretMp = p.pret || 0;
  const sup    = p.suprafataTotala || 0;
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Estimare cost</span>
      <h2 class="pp-section-h2">Cost <em>lunar</em> total</h2>
      <div class="pp-calc">
        <div class="pp-calc-grid">
          <div class="pp-calc-field">
            <label>Suprafață (m²)</label>
            <input type="number" id="calcSup" value="${sup}" oninput="calcLunar()">
          </div>
          <div class="pp-calc-field">
            <label>Preț (€/m²/lună)</label>
            <input type="number" step="0.1" id="calcPretMp" value="${pretMp}" oninput="calcLunar()">
          </div>
          <div class="pp-calc-field">
            <label>Mentenanță (€/m²/lună)</label>
            <input type="number" step="0.1" id="calcMent" value="3" oninput="calcLunar()">
          </div>
          <div class="pp-calc-field">
            <label>Utilități medii (€/lună)</label>
            <input type="number" id="calcUtil" value="800" oninput="calcLunar()">
          </div>
        </div>
        <p class="pp-calc-note">Estimare orientativă. Valorile depind de clădire și consum.</p>
        <div class="pp-calc-result">
          <div>
            <div class="pp-calc-result-label">Cost lunar total</div>
            <div class="pp-calc-result-val" id="calcLunarTotal">—</div>
          </div>
          <div class="pp-calc-result-side">
            <div class="pp-calc-result-label">Doar chirie</div>
            <div class="pp-calc-result-val sm" id="calcLunarChirie">${fmtNum(pretMp * sup)} €</div>
          </div>
        </div>
      </div>
    </section>`;
}
function calcLunar() {
  const sup    = +document.getElementById('calcSup').value    || 0;
  const pretMp = +document.getElementById('calcPretMp').value || 0;
  const ment   = +document.getElementById('calcMent').value   || 0;
  const util   = +document.getElementById('calcUtil').value   || 0;
  const chirie = sup * pretMp;
  const total  = chirie + sup * ment + util;
  document.getElementById('calcLunarTotal').textContent  = fmtNum(Math.round(total))  + ' €';
  document.getElementById('calcLunarChirie').textContent = fmtNum(Math.round(chirie)) + ' €';
}

// ---------- CALCULATOR CONSTRUIBIL (teren) ----------
function renderCalcConstruibil(p) {
  if (!p.CUT && !p.POT) return '';
  const initSup = p.suprafata && p.unitate === 'mp' ? p.suprafata : (p.suprafata * 10000) || 0;
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Calculator construibil</span>
      <h2 class="pp-section-h2">Potențial de <em>construire</em></h2>
      <div class="pp-calc">
        <div class="pp-calc-grid">
          <div class="pp-calc-field">
            <label>Suprafață teren (m²)</label>
            <input type="number" id="calcTeren" value="${initSup}" oninput="calcBuild()">
          </div>
          <div class="pp-calc-field">
            <label>CUT</label>
            <input type="number" step="0.1" id="calcCUT" value="${p.CUT || 0}" oninput="calcBuild()">
          </div>
          <div class="pp-calc-field">
            <label>POT (%)</label>
            <input type="number" step="1" id="calcPOT" value="${p.POT || 0}" oninput="calcBuild()">
          </div>
        </div>
        <p class="pp-calc-note">Calcul indicativ. Valorile finale se verifică cu Certificat de Urbanism.</p>
        <div class="pp-calc-result">
          <div>
            <div class="pp-calc-result-label">Suprafață construibilă max.</div>
            <div class="pp-calc-result-val" id="calcBuildMax">—</div>
          </div>
          <div class="pp-calc-result-side">
            <div class="pp-calc-result-label">Amprentă la sol</div>
            <div class="pp-calc-result-val sm" id="calcBuildAmpr">—</div>
          </div>
        </div>
      </div>
    </section>`;
}
function calcBuild() {
  const teren = +document.getElementById('calcTeren').value || 0;
  const cut   = +document.getElementById('calcCUT').value   || 0;
  const pot   = +document.getElementById('calcPOT').value   || 0;
  document.getElementById('calcBuildMax').textContent  = fmtNum(Math.round(teren * cut))       + ' m²';
  document.getElementById('calcBuildAmpr').textContent = fmtNum(Math.round(teren * pot / 100)) + ' m²';
}

// ---------- FIȘĂ TEHNICĂ (comercial) ----------
function renderFisaTehnica(p) {
  const s = p.specificatii || {};
  const rows = [
    { l: 'Alimentare electrică', v: s.electric },
    { l: 'Climatizare',          v: s.climatizare },
    { l: 'Pardoseală',           v: s.pardoseala },
    { l: 'Iluminat',             v: s.iluminat },
    { l: 'Rampă încărcare',      v: s.rampa ? 'Da' : null },
    { l: 'Încărcătoare EV',      v: s.incarcator ? 'Da' : null },
    { l: 'Clasă energetică',     v: p.tipSpatiu !== 'hotel' && p.clasaCladire ? `Clasa ${p.clasaCladire}` : null },
    { l: 'Locuri parcare',       v: p.locuriParcare != null ? String(p.locuriParcare) : null }
  ].filter(r => r.v != null && r.v !== '');
  if (!rows.length) return '';
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Fișă tehnică</span>
      <h2 class="pp-section-h2">Specificații <em>spațiu</em></h2>
      <table class="pp-spec-table">
        ${rows.map(r => `
          <tr>
            <td>${escapeHtml(r.l)}</td>
            <td>${escapeHtml(r.v)}</td>
          </tr>`).join('')}
      </table>
    </section>`;
}

// ---------- UTILITĂȚI (teren) ----------
function renderUtilitati(p) {
  const all  = [
    { k:'apa',       i:'fa-droplet', t:'Apă' },
    { k:'curent',    i:'fa-bolt',    t:'Curent' },
    { k:'gaz',       i:'fa-fire',    t:'Gaz' },
    { k:'canalizare',i:'fa-toilet',  t:'Canalizare' }
  ];
  const have = p.utilitati || [];
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Utilități</span>
      <h2 class="pp-section-h2">Disponibile pe <em>lot</em></h2>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:4px">
        ${all.map(u => `
          <div style="text-align:center;padding:20px 12px;background:${have.includes(u.k)?'var(--pebble)':'rgba(28,35,64,.04)'};border-radius:4px;border:1px solid var(--ink-08)">
            <i class="fa-solid ${u.i}" style="font-size:1.4rem;color:${have.includes(u.k)?'var(--sage-dk)':'var(--ink-20)'};margin-bottom:10px;display:block"></i>
            <div style="font-family:var(--font-body);font-size:12px;font-weight:600;color:${have.includes(u.k)?'var(--ink)':'var(--ink-50)'}">${u.t}</div>
            <div style="font-family:var(--font-body);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${have.includes(u.k)?'var(--sage-dk)':'var(--ink-20)'};margin-top:4px">${have.includes(u.k)?'Conectat':'—'}</div>
          </div>`).join('')}
      </div>
    </section>`;
}

// ---------- REGIM JURIDIC (teren) ----------
function renderRegimJuridic(p) {
  const rows = [
    { l: 'Suprafață',      v: p.suprafata != null ? `${p.suprafata} ${p.unitate}` : null },
    { l: 'Front stradal',  v: p.frontStradal != null ? `${p.frontStradal} ml` : null },
    { l: 'Acces drum',     v: p.accesDrum ? capitalize(p.accesDrum) : null },
    { l: 'Zonare PUG',     v: p.zonarePUG },
    { l: 'CUT',            v: p.CUT },
    { l: 'POT',            v: p.POT != null ? `${p.POT}%` : null }
  ].filter(r => r.v != null && r.v !== '');
  if (!rows.length) return '';
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Regim juridic &amp; urbanistic</span>
      <h2 class="pp-section-h2">Date <em>cadastrale</em></h2>
      <table class="pp-spec-table">
        ${rows.map(r => `
          <tr>
            <td>${escapeHtml(r.l)}</td>
            <td>${escapeHtml(String(r.v))}</td>
          </tr>`).join('')}
      </table>
    </section>`;
}

// ---------- PLAN ETAJ / CADASTRAL ----------
function renderPlan(category) {
  const cfg = {
    rezidential: { eye:'— Plan apartament',  h2:'Schiță &amp; <em>dimensiuni</em>',     icon:'fa-ruler-combined',    txt:'Plan etaj disponibil în PDF la cerere.' },
    comercial:   { eye:'— Plan / layout',    h2:'Configurație <em>spațiu</em>',          icon:'fa-object-group',      txt:'Layout disponibil în CAD la cerere.' },
    terenuri:    { eye:'— Plan cadastral',   h2:'Topografie &amp; <em>formă lot</em>',   icon:'fa-map-location-dot',  txt:'Plan cadastral disponibil în PDF la cerere.' }
  }[category] || {};
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">${cfg.eye}</span>
      <h2 class="pp-section-h2">${cfg.h2}</h2>
      <div class="pp-plan-plate">
        <i class="fa-solid ${cfg.icon}"></i>
        <p>${cfg.txt}</p>
        <div class="pp-docs" style="margin-top:0">
          <button class="pp-doc-btn" type="button" data-action="request-doc" data-doc="plan">
            <i class="fa-solid fa-file-pdf"></i> Solicită PDF
          </button>
        </div>
      </div>
    </section>`;
}

// ---------- HARTĂ ----------
function renderMap(p, category) {
  const eye = category === 'terenuri' ? '— Locație lot' : '— Zona &amp; vecinătăți';
  const h2  = category === 'terenuri' ? 'Poziționare' : 'Repere în <em>apropiere</em>';
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">${eye}</span>
      <h2 class="pp-section-h2">${h2}</h2>
      <div class="pp-map-wrap">
        <div id="pp-map" style="height:340px;background:var(--pebble)"></div>
      </div>
      ${category !== 'terenuri' ? `
      <ul class="pp-poi-list">
        <li><i class="fa-solid fa-school"></i>Școli &amp; grădinițe</li>
        <li><i class="fa-solid fa-train-subway"></i>Metrou / transport</li>
        <li><i class="fa-solid fa-cart-shopping"></i>Supermarket</li>
        <li><i class="fa-solid fa-tree"></i>Parc &amp; spații verzi</li>
      </ul>` : ''}
    </section>`;
}

async function initPropertyMap(p, category) {
  const mapEl = document.getElementById('pp-map');
  if (!mapEl || typeof L === 'undefined') return;
  const addr = [p.adresa, p.cartier, p.localitate, p.oras, p.judet].filter(Boolean).join(', ');
  let lat, lng, exact = false;
  // Prefer the exact point the agent placed in admin; geocode only as fallback.
  if (p.lat != null && p.lng != null) {
    lat = +p.lat; lng = +p.lng; exact = true;
  }
  if (!exact) {
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr+', Romania')}`, { headers:{'Accept-Language':'ro'} });
      const data = await res.json();
      if (data && data[0]) { lat = +data[0].lat; lng = +data[0].lon; }
    } catch(_) {}
  }
  if (!lat) {
    const fb = { 'București':[44.4268,26.1025],'Cluj-Napoca':[46.7712,23.6236],'Timișoara':[45.7489,21.2087],'Brașov':[45.6427,25.5887],'Iași':[47.1585,27.6014] };
    [lat,lng] = fb[p.oras || p.localitate || 'București'] || fb['București'];
  }
  mapEl.innerHTML = '';
  const map = L.map(mapEl, { scrollWheelZoom:false }).setView([lat,lng], category==='terenuri'?14:15);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom:19, attribution:'© OpenStreetMap, © CARTO' }).addTo(map);
  L.marker([lat,lng], { icon: L.divIcon({ className:'', html:'<div class="pp-map-marker"></div>', iconSize:[32,32], iconAnchor:[16,16] }) })
    .addTo(map).bindPopup(`<strong>${escapeHtml(p.titlu)}</strong><br>${escapeHtml(addr)}`);
}

// ---------- DOCUMENTE (teren) ----------
function renderDocs() {
  return `
    <section class="pp-section">
      <span class="pp-section-eyebrow">— Documente disponibile</span>
      <h2 class="pp-section-h2">La <em>solicitare</em></h2>
      <div class="pp-docs">
        <button class="pp-doc-btn" type="button" data-action="request-doc" data-doc="CF">
          <i class="fa-solid fa-file-lines"></i> Extras CF
        </button>
        <button class="pp-doc-btn" type="button" data-action="request-doc" data-doc="CU">
          <i class="fa-solid fa-stamp"></i> Certificat Urbanism
        </button>
        <button class="pp-doc-btn" type="button" data-action="request-doc" data-doc="PUZ">
          <i class="fa-solid fa-map"></i> PUZ / PUG zonă
        </button>
      </div>
    </section>`;
}

// ---------- SIDEBAR ----------
function renderSidebar(agent, p) {
  if (!agent) return '<aside class="pp-sidebar"></aside>';
  const initials = (agent.nume || '').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  const avatar   = agent.foto
    ? `<img src="${escapeHtml(agent.foto)}" alt="${escapeHtml(agent.nume)}">`
    : initials;
  return `
    <aside class="pp-sidebar">
      <div class="pp-agent-card">
        <span class="pp-agent-label">— Agent EVEN</span>
        <div class="pp-agent-row">
          <div class="pp-agent-photo">${avatar}</div>
          <div>
            <div class="pp-agent-name">${escapeHtml(agent.nume)}</div>
            <div class="pp-agent-role">${escapeHtml(agent.rol || 'Agent imobiliar')}</div>
          </div>
        </div>
        <hr class="pp-agent-divider">
        <div class="pp-agent-contacts">
          <a href="tel:${escapeHtml(agent.telefon)}"><i class="fa-solid fa-phone"></i>${escapeHtml(agent.telefon)}</a>
          <a href="mailto:${escapeHtml(agent.email)}"><i class="fa-solid fa-envelope"></i>${escapeHtml(agent.email)}</a>
        </div>
        <div class="pp-cta-pair">
          <a href="tel:${escapeHtml(agent.telefon)}" class="pp-btn-call">
            <i class="fa-solid fa-phone"></i> Sună
          </a>
          <a href="${waLink(agent.telefon, p && p.titlu)}" target="_blank" rel="noopener" class="pp-btn-wa">
            <i class="fa-brands fa-whatsapp"></i> WhatsApp
          </a>
        </div>
      </div>

      <div class="pp-form-card" id="ppForm">
        <span class="pp-form-label-top">— Programează</span>
        <h3 class="pp-form-h3">Rezervă o <em>vizionare</em></h3>
        <form onsubmit="submitVizionare(event)" novalidate>
          <div class="pp-form-field">
            <label>Nume</label>
            <input type="text" name="nume" required placeholder="Numele tău">
          </div>
          <div class="pp-form-field">
            <label>Telefon</label>
            <input type="tel" name="telefon" required placeholder="07xx xxx xxx">
          </div>
          <div class="pp-form-field">
            <label>Email</label>
            <input type="email" name="email" required placeholder="email@exemplu.ro">
          </div>
          <div class="pp-form-field">
            <label>Mesaj (opțional)</label>
            <textarea name="mesaj" placeholder="Sunt disponibil în weekend / oricând..."></textarea>
          </div>
          <button class="pp-form-submit" type="submit">Trimite cererea</button>
        </form>
        <p class="pp-form-note">Răspuns în maxim 2 ore lucrătoare.</p>
      </div>

      <div class="pp-trust">
        <div class="pp-trust-mark">
          <span></span><span></span><span></span>
        </div>
        <div class="pp-trust-text">
          <strong>Verificat de EVEN</strong>
          <small>Documente · vizionare · predare</small>
        </div>
      </div>
    </aside>`;
}

// ---------- MOBILE BAR ----------
function renderMobileBar(agent, p) {
  if (!agent) return '';
  return `
    <div class="pp-mobile-bar">
      <a class="pp-mb-btn wa" href="${waLink(agent.telefon, p && p.titlu)}" target="_blank" rel="noopener">
        <i class="fa-brands fa-whatsapp"></i> WhatsApp
      </a>
      <a class="pp-mb-btn" href="tel:${escapeHtml(agent.telefon)}">
        <i class="fa-solid fa-phone"></i> Sună
      </a>
      <button class="pp-mb-btn book" type="button" data-action="scroll-to-form">
        <i class="fa-solid fa-calendar-check"></i> Vizionare
      </button>
    </div>`;
}

// ---------- BREADSTRIP ----------
function renderBreadstrip(p, categoryPath, categoryLabel) {
  return `
    <div class="pp-breadstrip">
      <div class="pp-breadstrip-inner">
        <div class="pp-breadcrumb">
          <a href="index.html">Acasă</a>
          <span>·</span>
          <a href="${categoryPath}">${categoryLabel}</a>
          <span>·</span>
          ${escapeHtml(p.titlu)}
        </div>
        <span class="pp-listing-id">Nº ${shortPropNumber(p.id)}</span>
      </div>
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
  el.innerHTML = `
    <div class="pp-toast-icon"><i class="fa-solid fa-check"></i></div>
    <div>
      <span class="pp-toast-title">${escapeHtml(title)}</span>
      <div class="pp-toast-body">${escapeHtml(body)}</div>
    </div>`;
  el.classList.remove('is-visible');
  void el.offsetWidth;
  el.classList.add('is-visible');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('is-visible'), 4500);
}

// ---------- ACTIONS ----------
async function submitVizionare(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form));
  const payload = {
    nume: data.nume, email: data.email, telefon: data.telefon,
    mesaj: data.mesaj || `Cerere vizionare: ${currentProperty?.titlu || ''}`,
    property_id: currentProperty?.id || null,
    agent_id:    currentProperty?.agent?.id || null,
    tip: 'vizionare', sursa: 'website'
  };
  if (btn) { btn.disabled = true; btn.textContent = 'Se trimite...'; }
  try {
    const res = await fetch('/api/leads', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('server');
    form.reset();
    showToast('Cererea a ajuns la Ilan.', 'Răspuns în maxim 2 ore. Te contactăm la telefonul indicat.');
  } catch(_) {
    try {
      const q = JSON.parse(localStorage.getItem('even_lead_queue') || '[]');
      q.push({ ...payload, created_at: new Date().toISOString() });
      localStorage.setItem('even_lead_queue', JSON.stringify(q));
    } catch(_) {}
    showToast('Trimitere automată indisponibilă.', 'Sună-ne direct: 0745 609 366.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Trimite cererea'; }
  }
}

function requestDoc(kind) {
  showToast(`Solicitare trimisă · ${kind}`, 'Documentul va fi trimis pe email în cursul zilei.');
}

function sharePage() {
  const url = window.location.href;
  if (navigator.share) { navigator.share({ title: document.title, url }).catch(() => {}); return; }
  if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => showToast('Link copiat.', 'Lipește-l unde vrei să-l împărtășești.'));
}

// ---------- FAV (delegate to main.js toggleFav) ----------
// toggleFav is defined in main.js — no-op guard
if (typeof toggleFav === 'undefined') window.toggleFav = function(btn) {
  btn.classList.toggle('is-active');
};

// ---------- SCROLL REVEAL ----------
function initScrollReveal() {
  const targets = document.querySelectorAll('.pp-section, .pp-title-row, .pp-stats, .pp-cta-strip');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-revealed')); return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-revealed'); io.unobserve(en.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  targets.forEach(el => io.observe(el));
}

// ---------- ATMOSPHERE GRAIN ----------
function ensureAtmosphere() {
  if (document.querySelector('.pp-bg-grain')) return;
  const g = document.createElement('div');
  g.className = 'pp-bg-grain';
  g.setAttribute('aria-hidden','true');
  document.body.prepend(g);
}

// ---------- PER-CATEGORY RENDERS ----------
function renderRezidential(p) {
  const eyebrow   = `${regimLabel(p.regim)} · ${escapeHtml(p.cartier || '')} · ${escapeHtml(p.oras || '')}`;
  const address   = escapeHtml([p.adresa, p.cartier, p.oras].filter(Boolean).join(', '));
  const priceMain = formatPrice(p.pret) + (p.regim === 'inchiriere' ? '<small>/lună</small>' : '');
  const priceSub  = p.regim === 'vanzare' && p.pret && p.suprafata
    ? `${fmtNum(Math.round(p.pret / p.suprafata))} €/m²` : null;

  const stats = [
    { val: p.camere,         label: 'Camere' },
    { val: p.suprafata, unit:'m²', label: 'Suprafață' },
    p.etaj != null  ? { val:`${p.etaj}/${p.etajTotal}`, label:'Etaj' }    : null,
    p.anConstructie ? { val: p.anConstructie,            label:'An' }      : null,
    p.orientare     ? { val: p.orientare,                label:'Orientare'}: null
  ].filter(Boolean);

  document.title = `${p.titlu} · EVEN`;
  setGallery(p.imagini);

  const html = `
    ${renderMosaic(p, { eyebrow, address, priceMain, priceSub })}
    ${renderBreadstrip(p, 'listings-rezidential.html', 'Rezidențial')}
    <div class="pp-wrap">
      ${renderStats(stats)}
      ${renderTitleRow(p, { eyebrow, address, priceMain, priceSub })}
      <div class="pp-layout">
        <div class="pp-main">
          ${renderDescription(p.descriere)}
          ${renderFeatures(p)}
          ${renderCtaStrip(p, p.agent)}
          ${p.regim === 'vanzare' ? renderCalcRate(p) : ''}
          ${renderPlan('rezidential')}
          ${renderMap(p, 'rezidential')}
        </div>
        ${renderSidebar(p.agent, p)}
      </div>
    </div>
    ${renderMobileBar(p.agent, p)}`;

  // Replace existing content
  const brEl = document.querySelector('.page-header');
  if (brEl) brEl.remove();
  const main = document.querySelector('main.prop-detail');
  if (main) main.outerHTML = html;
  else document.getElementById('detailContent').innerHTML = html;

  // Wire up
  document.querySelectorAll('.pp-calc-tab').forEach(btn =>
    btn.addEventListener('click', () => setCalcPreset(btn.dataset.preset)));
  if (typeof applyFavStates === 'function') applyFavStates(document);
  if (p.regim === 'vanzare') calcRate();
  setTimeout(() => initPropertyMap(p, 'rezidential'), 300);
  initScrollReveal();
  initParallax();
  initCountUp();
  initDescriptionClamp();
}

function renderComercial(p) {
  const tipMap    = { birouri:'Birouri', retail:'Retail', depozit:'Depozit/Hală', industrial:'Industrial', showroom:'Showroom', hotel:'Hotel / Pensiune' };
  const eyebrow   = [regimLabel(p.regim), tipMap[p.tipSpatiu] || '', p.tipSpatiu !== 'hotel' ? `Clasa ${p.clasaCladire||'—'}` : null].filter(Boolean).join(' · ');
  const address   = escapeHtml([p.adresa, p.cartier, p.oras].filter(Boolean).join(', '));
  const priceMain = p.pret ? `${p.pret} €<small>/m²/lună</small>` : formatPrice(p.pretTotal);
  const priceSub  = p.pret && p.suprafataTotala ? `~ ${fmtNum(p.pret * p.suprafataTotala)} €/lună` : null;

  const stats = [
    { val: p.suprafataTotala, unit:'m²', label:'Total' },
    p.suprafataUtila  ? { val: p.suprafataUtila, unit:'m²', label:'Utili' }       : null,
    p.etaj != null    ? { val: p.etaj,                       label:'Etaj' }        : null,
    p.locuriParcare != null ? { val: p.locuriParcare,         label:'Parcare' }    : null,
    p.inaltimeLibera  ? { val: p.inaltimeLibera, unit:'m',   label:'Înălțime' }   : null
  ].filter(Boolean);

  document.title = `${p.titlu} · EVEN`;
  setGallery(p.imagini);

  const html = `
    ${renderMosaic(p, { eyebrow, address, priceMain, priceSub })}
    ${renderBreadstrip(p, 'listings-comercial.html', 'Comercial')}
    <div class="pp-wrap">
      ${renderStats(stats)}
      ${renderTitleRow(p, { eyebrow, address, priceMain, priceSub })}
      <div class="pp-layout">
        <div class="pp-main">
          ${renderDescription(p.descriere)}
          ${renderFisaTehnica(p)}
          ${renderCtaStrip(p, p.agent)}
          ${p.regim === 'inchiriere' ? renderCalcLunar(p) : ''}
          ${renderPlan('comercial')}
          ${renderMap(p, 'comercial')}
        </div>
        ${renderSidebar(p.agent, p)}
      </div>
    </div>
    ${renderMobileBar(p.agent, p)}`;

  const brEl = document.querySelector('.page-header');
  if (brEl) brEl.remove();
  const main = document.querySelector('main.prop-detail');
  if (main) main.outerHTML = html;
  else document.getElementById('detailContent').innerHTML = html;

  if (typeof applyFavStates === 'function') applyFavStates(document);
  if (p.regim === 'inchiriere') calcLunar();
  setTimeout(() => initPropertyMap(p, 'comercial'), 300);
  initScrollReveal();
  initParallax();
  initCountUp();
  initDescriptionClamp();
}

function renderTeren(p) {
  const tipMap  = { 'intravilan-rezidential':'Intravilan rezidențial','intravilan-comercial':'Intravilan comercial','extravilan-agricol':'Extravilan agricol','industrial':'Industrial' };
  const eyebrow = `${tipMap[p.tip]||'Teren'} · ${escapeHtml(p.localitate||'')} · ${escapeHtml(p.judet||'')}`;
  const address = escapeHtml([p.adresa, p.localitate, p.judet].filter(Boolean).join(', '));
  const priceMain = formatPrice(p.pretTotal);
  const priceSub  = p.pretMp ? `${p.pretMp} €/m² · ${p.suprafata} ${p.unitate}` : null;

  const stats = [
    { val: p.suprafata, unit:` ${p.unitate}`, label:'Suprafață' },
    p.frontStradal ? { val: p.frontStradal, unit:'ml', label:'Front stradal' } : null,
    p.CUT  != null ? { val: p.CUT,                     label:'CUT' }           : null,
    p.POT  != null ? { val: p.POT, unit:'%',            label:'POT' }          : null,
    p.accesDrum    ? { val: capitalize(p.accesDrum),    label:'Acces' }        : null
  ].filter(Boolean);

  document.title = `${p.titlu} · EVEN`;
  setGallery(p.imagini);

  const html = `
    ${renderMosaic(p, { eyebrow, address, priceMain, priceSub })}
    ${renderBreadstrip(p, 'listings-terenuri.html', 'Terenuri')}
    <div class="pp-wrap">
      ${renderStats(stats)}
      ${renderTitleRow(p, { eyebrow, address, priceMain, priceSub })}
      <div class="pp-layout">
        <div class="pp-main">
          ${renderDescription((p.descriere||'') + (p.vecinatati ? `\n\n**Vecinătăți:** ${p.vecinatati}` : ''))}
          ${renderUtilitati(p)}
          ${renderRegimJuridic(p)}
          ${renderCtaStrip(p, p.agent)}
          ${renderCalcConstruibil(p)}
          ${renderPlan('terenuri')}
          ${renderMap(p, 'terenuri')}
          ${renderDocs()}
        </div>
        ${renderSidebar(p.agent, p)}
      </div>
    </div>
    ${renderMobileBar(p.agent, p)}`;

  const brEl = document.querySelector('.page-header');
  if (brEl) brEl.remove();
  const main = document.querySelector('main.prop-detail');
  if (main) main.outerHTML = html;
  else document.getElementById('detailContent').innerHTML = html;

  if (typeof applyFavStates === 'function') applyFavStates(document);
  if (p.CUT || p.POT) calcBuild();
  setTimeout(() => initPropertyMap(p, 'terenuri'), 300);
  initScrollReveal();
  initParallax();
  initCountUp();
  initDescriptionClamp();
}

// ---------- INIT ----------
function showFatal(contentEl, title, detail, backHref) {
  contentEl.innerHTML = `
    <div style="text-align:center;padding:96px 24px;font-family:var(--font-body);color:var(--ink-50);max-width:520px;margin:0 auto">
      <p style="font-size:1.15rem;color:var(--ink);margin-bottom:8px">${escapeHtml(title)}</p>
      ${detail ? `<p style="font-size:.85rem;color:var(--ink-50);margin-bottom:24px">${escapeHtml(detail)}</p>` : ''}
      <a href="${backHref}" style="color:var(--sage-dk);text-decoration:none;font-size:.9rem">← Înapoi</a>
    </div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const contentEl = document.getElementById('detailContent');
  if (!contentEl) return;

  try {
    ensureAtmosphere();
    initScrollProgress();
  } catch (e) {
    console.warn('[property] init effects failed', e);
  }

  const id       = getQueryParam('id');
  const category = document.body.dataset.propertyCategory;

  if (!id) {
    showFatal(contentEl, 'Link invalid — lipsește ID-ul proprietății.', null, 'index.html');
    return;
  }
  if (!category) {
    showFatal(contentEl, 'Configurare pagină invalidă.', 'data-property-category nu este setat pe body.', 'index.html');
    return;
  }
  if (typeof getPropertyById !== 'function') {
    showFatal(contentEl, 'Nu s-a putut conecta la baza de date.', 'Reîncarcă pagina sau verifică conexiunea.', 'index.html');
    return;
  }

  contentEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:60vh;color:rgba(28,35,64,.4)">
    <i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;

  let p;
  try {
    const fetchPromise = getPropertyById(id, category);
    const timeoutPromise = new Promise((_, rej) =>
      setTimeout(() => rej(new Error('timeout')), 15000));
    p = await Promise.race([fetchPromise, timeoutPromise]);
  } catch (e) {
    console.error('[property] fetch failed', e);
    showFatal(contentEl,
      'Nu s-a putut încărca proprietatea.',
      e.message === 'timeout' ? 'Cererea a depășit 15 secunde. Verifică conexiunea.' : (e.message || ''),
      `listings-${category}.html`);
    return;
  }

  currentProperty = p;

  // Fire-and-forget analytics: bump the view counter once per page load.
  // No await — page render is independent of this.
  if (typeof recordPropertyView === 'function') recordPropertyView(id);

  if (!p) {
    showFatal(contentEl,
      'Proprietatea nu mai există sau linkul este incorect.',
      null,
      `listings-${category}.html`);
    return;
  }

  try {
    if (category === 'rezidential') renderRezidential(p);
    else if (category === 'comercial') renderComercial(p);
    else if (category === 'terenuri')  renderTeren(p);
    else showFatal(contentEl, `Categorie necunoscută: ${category}`, null, 'index.html');
  } catch (e) {
    console.error('[property] render failed', e);
    showFatal(contentEl,
      'Eroare la afișarea proprietății.',
      e.message || 'Verifică consola pentru detalii.',
      `listings-${category}.html`);
  }
});
