// ============================================
// PREZENTARE.JS
// ============================================

const CAT = { r: 'rezidential', c: 'comercial', t: 'terenuri' };

function decodeToken(tok) {
  try {
    let b64 = tok.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const raw = decodeURIComponent(escape(atob(b64)));
    const branded = raw[0] === '1';
    const categorie = CAT[raw[1]] || 'rezidential';
    const id = raw.slice(2);
    if (!id) return null;
    return { id, categorie, branded };
  } catch { return null; }
}

function getToken() {
  const m = location.pathname.match(/\/p\/([^\/?#]+)/);
  if (m) return decodeURIComponent(m[1]);
  return new URLSearchParams(location.search).get('t');
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function fmtPrice(v, currency) {
  if (!v && v !== 0) return '';
  return new Intl.NumberFormat('ro-RO').format(+v) + ' ' + (currency || '€');
}

function buildFacts(p) {
  const f = [];
  if (p.categorie === 'rezidential') {
    if (p.camere) f.push(['Camere', p.camere]);
    if (p.suprafata) f.push(['Suprafață', p.suprafata + ' mp']);
    if (p.etaj != null) f.push(['Etaj', p.etaj + (p.etajTotal ? '/' + p.etajTotal : '')]);
    if (p.bai) f.push(['Băi', p.bai]);
    if (p.anConstructie) f.push(['An', p.anConstructie]);
    if (p.compartimentare) f.push(['Compartim.', p.compartimentare]);
  } else if (p.categorie === 'comercial') {
    if (p.tipSpatiu) f.push(['Tip spațiu', p.tipSpatiu]);
    if (p.suprafataTotala) f.push(['Suprafață', p.suprafataTotala + ' mp']);
    if (p.suprafataUtila) f.push(['Suprafață utilă', p.suprafataUtila + ' mp']);
    if (p.clasaCladire) f.push(['Clasă', p.clasaCladire]);
    if (p.etaj != null) f.push(['Etaj', p.etaj]);
    if (p.locuriParcare) f.push(['Parcare', p.locuriParcare + ' locuri']);
  } else if (p.categorie === 'terenuri') {
    if (p.tip) f.push(['Tip', p.tip]);
    if (p.suprafata) f.push(['Suprafață', p.suprafata + ' ' + (p.unitate || 'mp')]);
    if (p.frontStradal) f.push(['Front stradal', p.frontStradal + ' ml']);
    if (p.zonarePUG) f.push(['PUG', p.zonarePUG]);
    if (p.POT) f.push(['POT', p.POT + '%']);
    if (p.CUT) f.push(['CUT', p.CUT]);
  }
  return f;
}

let GALLERY = [], lbIdx = 0;
function openLb(i) { lbIdx = i; document.getElementById('lbImg').src = GALLERY[i]; document.getElementById('lb').classList.add('open'); }
function closeLb() { document.getElementById('lb').classList.remove('open'); }
function lbStep(d) { lbIdx = (lbIdx + d + GALLERY.length) % GALLERY.length; document.getElementById('lbImg').src = GALLERY[lbIdx]; }

document.addEventListener('keydown', e => {
  if (!document.getElementById('lb').classList.contains('open')) return;
  if (e.key === 'Escape') closeLb();
  if (e.key === 'ArrowRight') lbStep(1);
  if (e.key === 'ArrowLeft') lbStep(-1);
});
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if (a === 'lb-close') { closeLb(); return; }
  if (a === 'lb-step')  { lbStep(+el.dataset.dir); return; }
  if (a === 'lb-open')  { openLb(+el.dataset.idx); return; }
});

function render(p, branded) {
  const catLabel = { rezidential:'Rezidențial', comercial:'Comercial', terenuri:'Teren' }[p.categorie] || '';
  const regim = p.regim === 'inchiriere' ? 'De închiriat' : (p.regim === 'vanzare' ? 'De vânzare' : '');
  const loc = [p.cartier, p.oras || p.localitate || p.judet].filter(Boolean).join(', ');
  const imgs = p.imagini || [];
  const cover = imgs[0] || '';
  GALLERY = imgs.slice();

  const price = p.pret ?? p.pretTotal;
  const unit = (p.regim === 'inchiriere' && p.categorie === 'rezidential') ? '/lună'
             : (p.categorie === 'comercial' && p.regim === 'inchiriere') ? '€/mp/lună' : '';

  const facts = buildFacts(p);
  const feats = p.facilitati || p.utilitati || [];

  document.title = branded ? `${p.titlu || 'Prezentare'} · EVEN` : (p.titlu || 'Prezentare proprietate');

  const a = p.agent || {};
  const waNum = (a.telefon || '').replace(/[^\d]/g, '').replace(/^0/, '40');
  document.getElementById('topbar').outerHTML = branded ? `
    <div class="topbar" id="topbar">
      <div class="tb-brand">EVEN<small>IMOBILIARE</small></div>
      <a class="tb-cta" href="#contact"><i class="fa-solid fa-calendar-check"></i> Programează vizionare</a>
    </div>` : '<div class="topbar hidden" id="topbar"></div>';

  const heroScript = branded ? `<div class="hero-script">prezentare exclusivă</div>` : '';
  const hero = `
    <div class="hero" style="${cover ? `background-image:url('${esc(cover)}')` : ''}">
      <div class="hero-inner">
        ${heroScript}
        <span class="hero-tag">${esc([catLabel, regim].filter(Boolean).join(' · '))}</span>
        <h1>${esc(p.titlu || 'Proprietate')}</h1>
        ${loc ? `<div class="hero-loc"><i class="fa-solid fa-location-dot"></i> ${esc(loc)}${p.adresa ? ' · ' + esc(p.adresa) : ''}</div>` : ''}
        ${price ? `<div class="hero-price">${fmtPrice(price, p.moneda || '€')}${unit ? `<small>${unit}</small>` : ''}</div>` : ''}
      </div>
      ${imgs.length ? '<a class="hero-scroll" href="#detalii"><i class="fa-solid fa-chevron-down"></i></a>' : ''}
    </div>`;

  const factsBlock = facts.length ? `
    <section class="block" id="detalii"><div class="wrap">
      <div class="eyebrow">Caracteristici</div>
      <div class="facts">
        ${facts.map(([l, v]) => `<div class="fact"><div class="fact-label">${esc(l)}</div><div class="fact-val">${esc(String(v))}</div></div>`).join('')}
      </div>
    </div></section>` : '';

  const descBlock = (p.descriere || feats.length) ? `
    <section class="block" style="padding-top:0"><div class="wrap">
      ${p.descriere ? `<div class="eyebrow">Descriere</div><h2>Despre proprietate</h2><div class="desc">${esc(p.descriere)}</div>` : ''}
      ${feats.length ? `<div class="feats">${feats.map(x => `<span class="feat"><i class="fa-solid fa-check"></i>${esc(x)}</span>`).join('')}</div>` : ''}
    </div></section>` : '';

  const rest = imgs.slice(1);
  const galleryBlock = rest.length ? `
    <section class="block" style="padding-top:0"><div class="wrap">
      <div class="eyebrow">Galerie</div><h2>Imagini</h2>
      <div class="gallery">
        ${rest.map((url, i) => `<div class="g${(i % 5 === 0 && rest.length > 3) ? ' wide' : ''}" style="background-image:url('${esc(url)}')" data-action="lb-open" data-idx="${i + 1}"></div>`).join('')}
      </div>
    </div></section>` : '';

  let contactBlock = '';
  if (branded) {
    const photo = a.foto ? `<div class="agent-photo" style="background-image:url('${esc(a.foto)}')"></div>` : '<div class="agent-photo"></div>';
    const actions = [];
    if (a.telefon && waNum) actions.push(`<a class="a-wa" href="https://wa.me/${waNum}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>`);
    if (a.telefon) actions.push(`<a class="a-call" href="tel:${esc(a.telefon)}"><i class="fa-solid fa-phone"></i> ${esc(a.telefon)}</a>`);
    if (a.email) actions.push(`<a class="a-mail" href="mailto:${esc(a.email)}?subject=${encodeURIComponent('Interes: ' + (p.titlu || 'proprietate'))}"><i class="fa-solid fa-envelope"></i> Email</a>`);
    contactBlock = `
      <section class="block" id="contact"><div class="wrap">
        <div class="contact">
          <div class="c-left">
            <div class="eyebrow">Hai să vorbim</div>
            <h3>Programează o vizionare</h3>
            <p>Contactează agentul pentru detalii sau o vizită la fața locului.</p>
          </div>
          <div class="agent-card">
            ${photo}
            <div>
              <div class="agent-name">${esc(a.nume || 'Agent EVEN')}</div>
              <div class="agent-role">${esc(a.rol || 'Agent imobiliar')}</div>
              <div class="agent-actions">${actions.join('')}</div>
            </div>
          </div>
        </div>
      </div></section>`;
  }

  const footer = branded
    ? `<footer><div class="f-brand">EVEN IMOBILIARE</div><div>even-imobiliare.ro</div></footer>`
    : `<footer class="neutral"><div>Prezentare proprietate</div></footer>`;

  document.getElementById('root').innerHTML = hero + factsBlock + descBlock + galleryBlock + contactBlock + footer;
}

async function init() {
  const tok = getToken();
  const data = tok && decodeToken(tok);
  if (!data) {
    document.getElementById('root').innerHTML = '<div class="state"><div class="f-brand">Link invalid</div><div>Acest link de prezentare nu este valid.</div></div>';
    return;
  }
  try {
    const p = await getPropertyById(data.id, data.categorie);
    if (!p || p.activ === false) {
      document.getElementById('root').innerHTML = '<div class="state"><div class="f-brand">Indisponibil</div><div>Această proprietate nu mai este disponibilă.</div></div>';
      return;
    }
    render(p, data.branded);
  } catch (err) {
    document.getElementById('root').innerHTML = '<div class="state"><div class="f-brand">Eroare</div><div>Nu am putut încărca proprietatea.</div></div>';
  }
}

init();
