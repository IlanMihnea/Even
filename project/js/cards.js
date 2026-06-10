// ============================================
// CARDS.JS - Utilități comune pentru carduri
// Folosit de: homepage.js, listings.js, favorite.js
// Trebuie încărcat înainte de scriptul de pagină.
// Depinde de: formatPrice() din main.js
// ============================================

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function shortPropNum(id) {
  return String(id || '').replace(/-/g, '').slice(0, 4).toUpperCase() || '----';
}

function cardImageUrl(url) {
  const parts = url.split('/');
  const file = parts.pop();
  return [...parts, 'card-' + file].join('/');
}

function cardPhoto(imagini, titlu) {
  if (!imagini || !imagini[0]) return `<div class="img-placeholder"></div>`;
  const full = imagini[0];
  const card = cardImageUrl(full);
  return `<img src="${card}" alt="${escapeHtml(titlu || '')}" loading="lazy" width="800" height="600" onerror="this.onerror=null;this.src='${full.replace(/'/g, '%27')}'">`;
}

function favBtn(id) {
  return `
    <button class="prop-card-fav" type="button" data-prop-id="${id}"
            aria-label="Salvează la favorite">
      <i class="fa-regular fa-heart"></i>
    </button>`;
}

function pricePerSqm(pret, suprafata) {
  if (!pret || !suprafata) return '';
  return new Intl.NumberFormat('ro-RO').format(Math.round(pret / suprafata)) + ' €/m²';
}

function buildPropCard({ link, id, titlu, eyebrow, meta, price, sub, utilsHtml, photo }) {
  return `
    <article class="prop-card">
      <a class="prop-card-link" href="${link}" aria-label="${escapeHtml(titlu)}">
        <figure class="prop-card-media">
          <div class="prop-card-img">${photo}</div>
        </figure>
        <div class="prop-card-body">
          <div class="prop-card-eyebrow">
            <span>${eyebrow}</span>
            <span class="prop-card-num">Nº ${shortPropNum(id)}</span>
          </div>
          <h3 class="prop-card-title">${escapeHtml(titlu)}</h3>
          <p class="prop-card-meta">${meta}</p>
          ${utilsHtml ? `<div class="prop-card-utils">${utilsHtml}</div>` : ''}
          <div class="prop-card-foot">
            <div>
              <span class="prop-card-price">${price}</span>
              ${sub ? `<span class="prop-card-price-sub">${sub}</span>` : ''}
            </div>
            <span class="prop-card-cta">Detalii <i class="fa-solid fa-arrow-right"></i></span>
          </div>
        </div>
      </a>
      ${favBtn(id)}
    </article>`;
}

function renderRezCard(p, link) {
  link = link || `property-rezidential.html?id=${p.id}`;
  const eyebrow = `${p.regim === 'vanzare' ? 'Vânzare' : 'Închiriere'} · ${escapeHtml(p.cartier || '')}`;
  const meta = [
    p.camere != null ? `${p.camere} cam.` : null,
    p.suprafata ? `${p.suprafata} m²` : null,
    p.etaj != null ? `Et. ${p.etaj}${p.etajTotal ? '/' + p.etajTotal : ''}` : null
  ].filter(Boolean).join('<span class="sep"> · </span>');
  const price = formatPrice(p.pret) + (p.regim === 'inchiriere' ? '<span class="per-month">/lună</span>' : '');
  const sub = p.regim === 'vanzare' ? pricePerSqm(p.pret, p.suprafata) : '';
  return buildPropCard({ link, id: p.id, titlu: p.titlu, eyebrow, meta, price, sub, photo: cardPhoto(p.imagini, p.titlu) });
}

function renderComCard(p, link) {
  link = link || `property-comercial.html?id=${p.id}`;
  const tipLabels = { birouri: 'Birouri', retail: 'Retail', depozit: 'Depozit', industrial: 'Industrial', showroom: 'Showroom', hotel: 'Hotel / Pensiune' };
  const eyebrow = `${p.regim === 'vanzare' ? 'Vânzare' : 'Închiriere'} · ${tipLabels[p.tipSpatiu] || ''}`;
  const meta = [
    p.suprafataTotala ? `${p.suprafataTotala} m²` : null,
    p.tipSpatiu !== 'hotel' && p.clasaCladire ? `Clasa ${p.clasaCladire}` : null,
    p.etaj != null ? `Et. ${p.etaj}` : null
  ].filter(Boolean).join('<span class="sep"> · </span>');
  const price = p.pret
    ? `${p.pret} €<span class="per-month">/m²/lună</span>`
    : formatPrice(p.pretTotal);
  const sub = p.pret && p.suprafataTotala
    ? `~ ${new Intl.NumberFormat('ro-RO').format(p.pret * p.suprafataTotala)} €/lună`
    : '';
  return buildPropCard({ link, id: p.id, titlu: p.titlu, eyebrow, meta, price, sub, photo: cardPhoto(p.imagini, p.titlu) });
}

function renderTerCard(p, link) {
  link = link || `property-teren.html?id=${p.id}`;
  const tipLabels = {
    'intravilan-rezidential': 'Intravilan rez.',
    'intravilan-comercial':   'Intravilan com.',
    'extravilan-agricol':     'Extravilan agricol',
    'industrial':             'Industrial'
  };
  const eyebrow = `${tipLabels[p.tip] || 'Teren'} · ${escapeHtml(p.localitate || p.judet || '')}`;
  const utilsAll = [
    { k: 'apa',       i: 'fa-droplet', t: 'Apă'    },
    { k: 'curent',    i: 'fa-bolt',    t: 'Curent'  },
    { k: 'gaz',       i: 'fa-fire',    t: 'Gaz'     },
    { k: 'canalizare',i: 'fa-toilet',  t: 'Canal.'  }
  ];
  const meta = [
    p.suprafata    ? `${p.suprafata} ${p.unitate || 'mp'}` : null,
    p.frontStradal ? `Front ${p.frontStradal}m`            : null,
    p.accesDrum    ? `Acces ${p.accesDrum}`                : null
  ].filter(Boolean).join('<span class="sep"> · </span>');
  const utilsHtml = utilsAll.map(u =>
    `<span class="prop-card-util ${(p.utilitati || []).includes(u.k) ? 'active' : ''}"><i class="fa-solid ${u.i}"></i>${u.t}</span>`
  ).join('');
  const price = formatPrice(p.pretTotal);
  const sub = p.pretMp ? `${p.pretMp} €/m²` : '';
  return buildPropCard({ link, id: p.id, titlu: p.titlu, eyebrow, meta, price, sub, utilsHtml, photo: cardPhoto(p.imagini, p.titlu) });
}

function formatStatus(s) {
  return { 'pre-vanzare': 'Pre-vânzare', 'construire': 'În construcție', 'finalizat': 'Finalizat' }[s] || s;
}

function formatLivrare(d) {
  return new Date(d).toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' });
}

function projectCardHTML(p) {
  const hasPret = p.intervalPret && p.intervalPret.min != null && p.intervalPret.min > 0;
  const photo = cardPhoto(p.imagini, p.nume);
  return `
    <a class="project-card project-compact" href="project-detail.html?id=${p.id}">
      <div class="project-card-img">
        ${photo}
        <div class="status-tag">
          <span class="status-dot status-${p.status}"></span> ${formatStatus(p.status)}
        </div>
        <div class="available-tag">${p.unitatiDisponibile} unități disponibile</div>
      </div>
      <div class="project-card-body">
        <div class="project-dev">${escapeHtml(p.dezvoltator)}</div>
        <h3>${escapeHtml(p.nume)}</h3>
        <div class="project-loc"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(p.cartier)}, ${escapeHtml(p.oras)}</div>
        <div class="project-price-range">
          ${hasPret
            ? `${formatPrice(p.intervalPret.min)} - ${formatPrice(p.intervalPret.max)}<span>preț unitate</span>`
            : `Preț la cerere<span>consultant dedicat</span>`}
        </div>
        <div class="project-meta">
          <span>Livrare <strong>${formatLivrare(p.dataLivrare)}</strong></span>
          <span>Progres <strong>${p.progres}%</strong></span>
        </div>
      </div>
    </a>`;
}
