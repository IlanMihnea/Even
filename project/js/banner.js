// ============================================
// BANNER.JS — QR landing page
// Always shows the property currently flagged
// `banner = true` in the DB. The physical QR
// code points here permanently; you change the
// property from the admin panel, not the QR.
// ============================================

// ---- Contact shown on the page (the number printed on the banner) ----
// Edit these if your phone / details change.
const BANNER_CONTACT = {
  name:     'Ilan',
  role:     'EVEN Real Estate · București',
  phoneTxt: '0745 609 366',
  phoneTel: '+40745609366',
  whatsapp: '40745609366',
  email:    'ilan@even-imobiliare.ro'
};

// ---------- HELPERS ----------
function bnEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function bnNum(n) {
  if (n == null || n === '') return '-';
  return new Intl.NumberFormat('ro-RO').format(n);
}

function bnCurrency(moneda) {
  return moneda === 'RON' ? 'lei' : '€';
}

function bnCategoryLabel(cat) {
  return { rezidential: 'Rezidențial', comercial: 'Comercial', terenuri: 'Teren' }[cat] || 'Proprietate';
}

function bnDetailHref(p) {
  const file = {
    rezidential: 'property-rezidential.html',
    comercial:   'property-comercial.html',
    terenuri:    'property-teren.html'
  }[p.categorie];
  return file ? `${file}?id=${encodeURIComponent(p.id)}` : null;
}

// ---------- PRICE ----------
function bnPriceBlock(p) {
  const cur = bnCurrency(p.moneda);
  let main = '', sub = '';

  if (p.categorie === 'terenuri') {
    if (p.pret_total != null) {
      main = `${bnNum(p.pret_total)} ${cur}`;
      if (p.pret_mp != null) sub = `${bnNum(p.pret_mp)} ${cur}/mp`;
    } else if (p.pret_mp != null) {
      main = `${bnNum(p.pret_mp)} ${cur}`;
      sub = 'per mp';
    }
  } else if (p.categorie === 'comercial' && p.regim === 'inchiriere' && p.pret != null) {
    main = `${bnNum(p.pret)} ${cur}`;
    sub = 'pe mp / lună';
  } else {
    const val = p.pret != null ? p.pret : p.pret_total;
    if (val != null) {
      main = `${bnNum(val)} ${cur}`;
      if (p.regim === 'inchiriere') sub = 'pe lună';
    }
  }

  if (!main) main = 'Preț la cerere';
  const tva = p.plus_tva ? ' <span class="bn-price-tva">+ TVA</span>' : '';
  return `
    <div class="bn-price">
      <span class="bn-price-main">${main}${tva}</span>
      ${sub ? `<span class="bn-price-sub">${sub}</span>` : ''}
      ${p.pret_negociabil ? '<span class="bn-price-neg">Negociabil</span>' : ''}
    </div>`;
}

// ---------- SPEC STRIP ----------
function bnSpecs(p) {
  const specs = [];
  const add = (icon, value, label) => {
    if (value == null || value === '' || value === 0) return;
    specs.push({ icon, value, label });
  };

  if (p.categorie === 'rezidential') {
    add('fa-door-open', p.camere, p.camere == 1 ? 'cameră' : 'camere');
    add('fa-vector-square', p.suprafata != null ? `${bnNum(p.suprafata)} mp` : null, 'suprafață');
    add('fa-bed', p.dormitoare, p.dormitoare == 1 ? 'dormitor' : 'dormitoare');
    add('fa-bath', p.bai, p.bai == 1 ? 'baie' : 'băi');
    if (p.etaj != null) add('fa-building', p.etaj_total ? `${p.etaj} / ${p.etaj_total}` : p.etaj, 'etaj');
    add('fa-calendar', p.an_constructie, 'an construcție');
  } else if (p.categorie === 'comercial') {
    add('fa-vector-square', p.suprafata_totala != null ? `${bnNum(p.suprafata_totala)} mp` : null, 'suprafață totală');
    add('fa-ruler-combined', p.suprafata_utila != null ? `${bnNum(p.suprafata_utila)} mp` : null, 'suprafață utilă');
    add('fa-star', p.clasa_cladire ? `Clasă ${String(p.clasa_cladire).toUpperCase()}` : null, 'clădire');
    if (p.etaj != null) add('fa-building', p.etaj, 'etaj');
    add('fa-car', p.locuri_parcare, 'locuri parcare');
    add('fa-up-down', p.inaltime_libera != null ? `${p.inaltime_libera} m` : null, 'înălțime liberă');
  } else {
    add('fa-vector-square', p.suprafata != null ? `${bnNum(p.suprafata)} ${p.unitate || 'mp'}` : null, 'suprafață');
    add('fa-road', p.front_stradal != null ? `${p.front_stradal} m` : null, 'front stradal');
    add('fa-map', p.zonare_pug, 'zonare PUG');
    add('fa-percent', p.pot != null ? `${p.pot}%` : null, 'POT');
    add('fa-layer-group', p.cut, 'CUT');
    add('fa-route', p.acces_drum, 'acces drum');
  }

  if (!specs.length) return '';
  return `
    <div class="bn-specs">
      ${specs.map(s => `
        <div class="bn-spec">
          <i class="fa-solid ${s.icon}"></i>
          <div>
            <span class="bn-spec-val">${bnEsc(s.value)}</span>
            <span class="bn-spec-lbl">${bnEsc(s.label)}</span>
          </div>
        </div>`).join('')}
    </div>`;
}

// ---------- LOCATION ----------
function bnLocation(p) {
  const parts = [p.adresa, p.cartier, p.oras || p.localitate, p.judet].filter(Boolean);
  return parts.join(', ');
}

function bnMapsLink(p) {
  if (p.lat != null && p.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
  }
  const q = encodeURIComponent(bnLocation(p) + ' România');
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// ---------- GALLERY ----------
let bnGallery = [];

function bnRenderGallery(imagini) {
  bnGallery = Array.isArray(imagini) ? imagini.filter(Boolean) : [];
  if (!bnGallery.length) {
    return '<div class="bn-hero-img bn-hero-empty"><i class="fa-solid fa-image"></i></div>';
  }
  const hero = `
    <button class="bn-hero-img" type="button" onclick="bnOpenLightbox(0)">
      <img src="${bnEsc(bnGallery[0])}" alt="" loading="eager">
      <span class="bn-hero-count"><i class="fa-solid fa-expand"></i> ${bnGallery.length} foto</span>
    </button>`;
  if (bnGallery.length === 1) return hero;
  const thumbs = bnGallery.slice(1).map((url, i) => `
    <button class="bn-thumb" type="button" onclick="bnOpenLightbox(${i + 1})">
      <img src="${bnEsc(url)}" alt="" loading="lazy">
    </button>`).join('');
  return hero + `<div class="bn-thumbs">${thumbs}</div>`;
}

// ---------- LIGHTBOX ----------
let bnLbIdx = 0;

function bnEnsureLightbox() {
  let el = document.getElementById('bnLightbox');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'bnLightbox';
  el.className = 'bn-lightbox';
  el.innerHTML = `
    <button class="bn-lb-close" aria-label="Închide" onclick="bnCloseLightbox()"><i class="fa-solid fa-xmark"></i></button>
    <button class="bn-lb-nav bn-lb-prev" aria-label="Anterior" onclick="bnLbStep(-1)"><i class="fa-solid fa-chevron-left"></i></button>
    <button class="bn-lb-nav bn-lb-next" aria-label="Următor" onclick="bnLbStep(1)"><i class="fa-solid fa-chevron-right"></i></button>
    <img class="bn-lb-img" alt="">
    <div class="bn-lb-counter"></div>`;
  document.body.appendChild(el);
  el.addEventListener('click', e => { if (e.target === el) bnCloseLightbox(); });
  document.addEventListener('keydown', e => {
    if (!el.classList.contains('is-open')) return;
    if (e.key === 'Escape') bnCloseLightbox();
    if (e.key === 'ArrowLeft') bnLbStep(-1);
    if (e.key === 'ArrowRight') bnLbStep(1);
  });
  return el;
}

function bnOpenLightbox(idx) {
  if (!bnGallery.length) return;
  const el = bnEnsureLightbox();
  bnLbIdx = idx;
  bnLbUpdate();
  el.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function bnCloseLightbox() {
  const el = document.getElementById('bnLightbox');
  if (el) el.classList.remove('is-open');
  document.body.style.overflow = '';
}

function bnLbStep(d) {
  bnLbIdx = (bnLbIdx + d + bnGallery.length) % bnGallery.length;
  bnLbUpdate();
}

function bnLbUpdate() {
  const el = document.getElementById('bnLightbox');
  if (!el) return;
  el.querySelector('.bn-lb-img').src = bnGallery[bnLbIdx];
  el.querySelector('.bn-lb-counter').textContent = `${bnLbIdx + 1} / ${bnGallery.length}`;
  const multi = bnGallery.length > 1;
  el.querySelector('.bn-lb-prev').style.display = multi ? '' : 'none';
  el.querySelector('.bn-lb-next').style.display = multi ? '' : 'none';
}

// ---------- CONTACT / FACILITIES ----------
function bnFacilities(p) {
  const list = Array.isArray(p.facilitati) ? p.facilitati.filter(Boolean)
            : Array.isArray(p.utilitati) ? p.utilitati.filter(Boolean) : [];
  if (!list.length) return '';
  return `
    <section class="bn-block">
      <h2 class="bn-h2">Dotări &amp; utilități</h2>
      <ul class="bn-facilities">
        ${list.map(f => `<li><i class="fa-solid fa-check"></i> ${bnEsc(f)}</li>`).join('')}
      </ul>
    </section>`;
}

function bnContactCard(p) {
  const c = BANNER_CONTACT;
  const waText = encodeURIComponent(`Bună, am scanat codul QR de pe banner. Sunt interesat(ă) de: ${p.titlu}`);
  return `
    <section class="bn-block bn-contact" id="bnContact">
      <div class="bn-contact-card">
        <span class="bn-eyebrow">— Contact direct</span>
        <div class="bn-contact-name">${bnEsc(c.name)}</div>
        <div class="bn-contact-role">${bnEsc(c.role)}</div>
        <div class="bn-contact-actions">
          <a class="bn-btn bn-btn-primary" href="tel:${c.phoneTel}">
            <i class="fa-solid fa-phone"></i> Sună ${bnEsc(c.phoneTxt)}
          </a>
          <a class="bn-btn bn-btn-wa" href="https://wa.me/${c.whatsapp}?text=${waText}" target="_blank" rel="noopener">
            <i class="fa-brands fa-whatsapp"></i> Scrie pe WhatsApp
          </a>
          <a class="bn-btn bn-btn-ghost" href="mailto:${c.email}?subject=${encodeURIComponent('Interes proprietate: ' + p.titlu)}">
            <i class="fa-solid fa-envelope"></i> Trimite un email
          </a>
        </div>
      </div>

      <div class="bn-form-card">
        <span class="bn-eyebrow">— Lasă-ți datele</span>
        <h3 class="bn-form-title">Te sun eu <em>înapoi</em></h3>
        <form id="bnLeadForm" onsubmit="bnSubmitLead(event)">
          <input type="text"  name="nume"    required placeholder="Numele tău">
          <input type="tel"   name="telefon" required placeholder="Telefon (07xx xxx xxx)">
          <input type="email" name="email"   required placeholder="Email">
          <textarea name="mesaj" rows="2" placeholder="Mesaj (opțional)"></textarea>
          <button type="submit" class="bn-btn bn-btn-primary bn-btn-block">
            <i class="fa-solid fa-paper-plane"></i> Trimite cererea
          </button>
        </form>
        <p class="bn-form-note">Răspuns în maxim 2 ore lucrătoare.</p>
      </div>
    </section>`;
}

// ---------- MAIN RENDER ----------
function bnRender(p) {
  const main = document.getElementById('bnContent');
  const detailHref = bnDetailHref(p);
  const loc = bnLocation(p);

  main.innerHTML = `
    <article class="bn-property">
      <div class="bn-gallery">${bnRenderGallery(p.imagini)}</div>

      <div class="bn-head">
        <div class="bn-badges">
          <span class="bn-badge">${bnCategoryLabel(p.categorie)}</span>
          ${p.regim ? `<span class="bn-badge bn-badge-soft">${p.regim === 'inchiriere' ? 'De închiriat' : 'De vânzare'}</span>` : ''}
        </div>
        <h1 class="bn-title">${bnEsc(p.titlu)}</h1>
        ${loc ? `<p class="bn-loc"><i class="fa-solid fa-location-dot"></i> ${bnEsc(loc)}
          &nbsp;·&nbsp;<a href="${bnMapsLink(p)}" target="_blank" rel="noopener">Vezi pe hartă</a></p>` : ''}
        ${bnPriceBlock(p)}
      </div>

      ${bnSpecs(p)}

      ${p.descriere ? `
        <section class="bn-block">
          <h2 class="bn-h2">Despre proprietate</h2>
          <p class="bn-desc">${bnEsc(p.descriere).replace(/\n/g, '<br>')}</p>
        </section>` : ''}

      ${bnFacilities(p)}

      ${bnContactCard(p)}

      ${detailHref ? `
        <a class="bn-full-link" href="${detailHref}">
          <span><i class="fa-solid fa-file-lines"></i> Vezi pagina completă a proprietății</span>
          <i class="fa-solid fa-arrow-right"></i>
        </a>` : ''}
    </article>

    <!-- Sticky mobile call bar -->
    <div class="bn-sticky">
      <a class="bn-sticky-call" href="tel:${BANNER_CONTACT.phoneTel}">
        <i class="fa-solid fa-phone"></i> Sună acum
      </a>
      <a class="bn-sticky-wa" href="https://wa.me/${BANNER_CONTACT.whatsapp}?text=${encodeURIComponent('Bună, am scanat codul QR. Sunt interesat(ă) de: ' + p.titlu)}" target="_blank" rel="noopener">
        <i class="fa-brands fa-whatsapp"></i> WhatsApp
      </a>
    </div>
  `;

  document.title = `${p.titlu} · EVEN`;
  window._bnProperty = p;
}

// ---------- EMPTY STATE ----------
function bnRenderEmpty() {
  const main = document.getElementById('bnContent');
  main.innerHTML = `
    <div class="bn-empty">
      <div class="bn-empty-mark"><i class="fa-solid fa-house-circle-check"></i></div>
      <h1>Momentan nicio proprietate activă</h1>
      <p>Proprietatea de pe acest banner se actualizează în curând.
         Între timp, sună-ne sau vezi tot portofoliul EVEN.</p>
      <div class="bn-empty-actions">
        <a class="bn-btn bn-btn-primary" href="tel:${BANNER_CONTACT.phoneTel}">
          <i class="fa-solid fa-phone"></i> Sună ${bnEsc(BANNER_CONTACT.phoneTxt)}
        </a>
        <a class="bn-btn bn-btn-ghost" href="index.html">
          <i class="fa-solid fa-arrow-right"></i> Vezi portofoliul
        </a>
      </div>
    </div>`;
}

function bnRenderError() {
  const main = document.getElementById('bnContent');
  main.innerHTML = `
    <div class="bn-empty">
      <div class="bn-empty-mark"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <h1>Nu am putut încărca proprietatea</h1>
      <p>Verifică conexiunea la internet și reîncarcă pagina, sau contactează-ne direct.</p>
      <div class="bn-empty-actions">
        <a class="bn-btn bn-btn-primary" href="tel:${BANNER_CONTACT.phoneTel}">
          <i class="fa-solid fa-phone"></i> Sună ${bnEsc(BANNER_CONTACT.phoneTxt)}
        </a>
        <button class="bn-btn bn-btn-ghost" type="button" onclick="location.reload()">
          <i class="fa-solid fa-rotate-right"></i> Reîncarcă
        </button>
      </div>
    </div>`;
}

// ---------- LEAD FORM ----------
async function bnSubmitLead(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const p = window._bnProperty || {};
  const data = Object.fromEntries(new FormData(form));
  const payload = {
    nume: data.nume,
    email: data.email,
    telefon: data.telefon,
    mesaj: data.mesaj && data.mesaj.trim()
      ? data.mesaj.trim()
      : `Cerere de la bannerul QR pentru: ${p.titlu || 'proprietate'}`,
    property_id: p.id || null,
    agent_id: p.agent_id || null,
    tip: 'vizionare',
    sursa: 'banner-qr'
  };

  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Se trimite…';

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
    form.outerHTML = `
      <div class="bn-form-done">
        <i class="fa-solid fa-circle-check"></i>
        <strong>Cererea a ajuns la noi.</strong>
        <span>Te contactăm în maxim 2 ore lucrătoare.</span>
      </div>`;
  } catch (err) {
    try {
      const queue = JSON.parse(localStorage.getItem('even_lead_queue') || '[]');
      queue.push({ ...payload, created_at: new Date().toISOString() });
      localStorage.setItem('even_lead_queue', JSON.stringify(queue));
    } catch (_) {}
    btn.disabled = false;
    btn.innerHTML = orig;
    alert('Trimiterea automată nu a funcționat. Sună-ne direct la ' + BANNER_CONTACT.phoneTxt + '.');
  }
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const p = await getBannerProperty();
    if (p) bnRender(p);
    else bnRenderEmpty();
  } catch (err) {
    console.error('Banner load error:', err);
    bnRenderError();
  }
});
