// ============================================
// PROPERTY.JS - Detail page (rezidential, comercial, teren)
// ============================================

let currentProperty = null;
let currentImageIdx = 0;

async function getPropById(id, category) {
  return await getPropertyById(id, category);
}

// ---------- RENDER REZIDENTIAL ----------
function renderRezidential(p) {
  const agent = p.agent;
  document.title = `${p.titlu} - EVEN`;

  document.getElementById('breadcrumbs').innerHTML = `
    <a href="index.html">Acasă</a> / <a href="listings-rezidential.html">Rezidențial</a> / ${p.titlu}
  `;

  document.getElementById('detailContent').innerHTML = `
    ${renderGallery(p.imagini)}
    <div class="prop-layout">
      <div class="prop-main">
        <div class="prop-title-row">
          <div>
            <span class="badge badge-${p.regim}" style="margin-bottom:8px;display:inline-block">${p.regim === 'vanzare' ? 'Vânzare' : 'Închiriere'}</span>
            <h1>${p.titlu}</h1>
            <div class="prop-location"><i class="fa-solid fa-location-dot"></i> ${p.adresa}, ${p.cartier}, ${p.oras}</div>
          </div>
          <div class="prop-price">
            ${formatPrice(p.pret)}${p.regim === 'inchiriere' ? '<span class="per-month"> / lună</span>' : ''}
          </div>
        </div>

        <div class="prop-quickmeta">
          <div class="meta-item"><i class="fa-solid fa-bed"></i><div class="meta-val">${p.camere}</div><div class="meta-label">Camere</div></div>
          <div class="meta-item"><i class="fa-solid fa-vector-square"></i><div class="meta-val">${p.suprafata} mp</div><div class="meta-label">Utili</div></div>
          ${p.etaj != null ? `<div class="meta-item"><i class="fa-solid fa-stairs"></i><div class="meta-val">${p.etaj}/${p.etajTotal}</div><div class="meta-label">Etaj</div></div>` : ''}
          <div class="meta-item"><i class="fa-solid fa-calendar"></i><div class="meta-val">${p.anConstructie}</div><div class="meta-label">An</div></div>
          <div class="meta-item"><i class="fa-solid fa-compass"></i><div class="meta-val">${p.orientare}</div><div class="meta-label">Orientare</div></div>
        </div>

        <div class="prop-section">
          <h2>Descriere</h2>
          <p class="prop-description">${p.descriere}</p>
        </div>

        <div class="prop-section">
          <h2>Facilități și dotări</h2>
          <ul class="facilitati-list">
            ${p.facilitati.map(f => `<li><i class="fa-solid fa-check"></i> ${f}</li>`).join('')}
            ${p.parcare ? '<li><i class="fa-solid fa-check"></i> Loc parcare</li>' : ''}
            ${p.balcon ? '<li><i class="fa-solid fa-check"></i> Balcon</li>' : ''}
          </ul>
        </div>

        ${p.regim === 'vanzare' ? `
        <div class="prop-section">
          <h2><i class="fa-solid fa-calculator" style="color:var(--gold);margin-right:8px"></i>Calculator rate ipotecare</h2>
          <div class="calculator-box">
            <div class="calc-inputs">
              <div class="form-group">
                <label>Preț proprietate (€)</label>
                <input type="number" id="calcPret" value="${p.pret}" oninput="calcRate()">
              </div>
              <div class="form-group">
                <label>Avans (%)</label>
                <input type="number" id="calcAvans" value="20" oninput="calcRate()">
              </div>
              <div class="form-group">
                <label>Dobândă anuală (%)</label>
                <input type="number" step="0.1" id="calcDobanda" value="6.5" oninput="calcRate()">
              </div>
              <div class="form-group">
                <label>Perioadă (ani)</label>
                <input type="number" id="calcAni" value="30" oninput="calcRate()">
              </div>
            </div>
            <div class="calc-result">
              <div>
                <div class="result-label">Rată lunară estimată</div>
                <div class="result-val" id="calcRezultat">-</div>
              </div>
              <div>
                <div class="result-label">Suma împrumutată</div>
                <div class="result-val sm" id="calcImprumut">-</div>
              </div>
            </div>
            <div class="calc-disclaimer">* Calcul orientativ. Pentru ofertă reală contactează banca.</div>
          </div>
        </div>` : ''}

        <div class="prop-section">
          <h2>Plan etaj</h2>
          <div class="floorplan">
            <i class="fa-solid fa-ruler-combined"></i>
            <div>Plan etaj disponibil la cerere</div>
          </div>
        </div>

        <div class="prop-section">
          <h2>Zonă: școli & transport</h2>
          <div class="map-placeholder">
            <i class="fa-solid fa-location-dot map-pin"></i>
            <div class="map-poi poi-1"><i class="fa-solid fa-school"></i> Școala Gimnazială</div>
            <div class="map-poi poi-2"><i class="fa-solid fa-train-subway"></i> Stație metrou</div>
            <div class="map-poi poi-3"><i class="fa-solid fa-cart-shopping"></i> Supermarket</div>
            <div class="map-poi poi-4"><i class="fa-solid fa-tree"></i> Parc</div>
          </div>
        </div>
      </div>

      ${renderSidebar(agent, p)}
    </div>
  `;

  if (p.regim === 'vanzare') calcRate();
}

// ---------- RENDER COMERCIAL ----------
function renderComercial(p) {
  const agent = p.agent;
  const tipLabels = { birouri: 'Birouri', retail: 'Retail', depozit: 'Depozit/Hală', industrial: 'Industrial', showroom: 'Showroom' };
  document.title = `${p.titlu} - EVEN`;

  document.getElementById('breadcrumbs').innerHTML = `
    <a href="index.html">Acasă</a> / <a href="listings-comercial.html">Comercial</a> / ${p.titlu}
  `;

  document.getElementById('detailContent').innerHTML = `
    ${renderGallery(p.imagini)}
    <div class="prop-layout">
      <div class="prop-main">
        <div class="prop-title-row">
          <div>
            <span class="badge badge-comercial" style="margin-bottom:8px;display:inline-block">${tipLabels[p.tipSpatiu]} · Clasa ${p.clasaCladire}</span>
            <h1>${p.titlu}</h1>
            <div class="prop-location"><i class="fa-solid fa-location-dot"></i> ${p.adresa}, ${p.oras}</div>
          </div>
          <div class="prop-price">
            ${p.pret ? `${p.pret} €<span class="per-month">/mp/lună</span>` : formatPrice(p.pretTotal)}
          </div>
        </div>

        <div class="prop-quickmeta">
          <div class="meta-item"><i class="fa-solid fa-vector-square"></i><div class="meta-val">${p.suprafataTotala} mp</div><div class="meta-label">Total</div></div>
          <div class="meta-item"><i class="fa-solid fa-square"></i><div class="meta-val">${p.suprafataUtila} mp</div><div class="meta-label">Utili</div></div>
          <div class="meta-item"><i class="fa-solid fa-stairs"></i><div class="meta-val">Et. ${p.etaj}</div><div class="meta-label">Nivel</div></div>
          <div class="meta-item"><i class="fa-solid fa-square-parking"></i><div class="meta-val">${p.locuriParcare}</div><div class="meta-label">Parcare</div></div>
          <div class="meta-item"><i class="fa-solid fa-arrows-up-down"></i><div class="meta-val">${p.inaltimeLibera}m</div><div class="meta-label">Înălțime</div></div>
        </div>

        <div class="prop-section">
          <h2>Descriere</h2>
          <p class="prop-description">${p.descriere}</p>
        </div>

        <div class="prop-section">
          <h2><i class="fa-solid fa-clipboard-list" style="color:var(--accent-comercial);margin-right:8px"></i>Fișă tehnică</h2>
          <div class="specs-grid">
            <div class="spec-row"><span class="spec-label">Alimentare electrică</span><span class="spec-val">${p.specificatii.electric}</span></div>
            <div class="spec-row"><span class="spec-label">Climatizare</span><span class="spec-val">${p.specificatii.climatizare}</span></div>
            <div class="spec-row"><span class="spec-label">Pardoseală</span><span class="spec-val">${p.specificatii.pardoseala}</span></div>
            <div class="spec-row"><span class="spec-label">Iluminat</span><span class="spec-val">${p.specificatii.iluminat}</span></div>
            <div class="spec-row"><span class="spec-label">Rampă încărcare</span><span class="spec-val">${p.specificatii.rampa ? 'Da' : 'Nu'}</span></div>
            <div class="spec-row"><span class="spec-label">Încărcătoare electrice</span><span class="spec-val">${p.specificatii.incarcator ? 'Da' : 'Nu'}</span></div>
            <div class="spec-row"><span class="spec-label">Clasă energetică clădire</span><span class="spec-val">Clasa ${p.clasaCladire}</span></div>
            <div class="spec-row"><span class="spec-label">Locuri parcare</span><span class="spec-val">${p.locuriParcare}</span></div>
          </div>
        </div>

        <div class="prop-section">
          <h2>Plan etaj / layout spațiu</h2>
          <div class="floorplan">
            <i class="fa-solid fa-object-group"></i>
            <div>Layout disponibil în CAD la cerere</div>
          </div>
        </div>
      </div>

      ${renderSidebar(agent, p)}
    </div>
  `;
}

// ---------- RENDER TEREN ----------
function renderTeren(p) {
  const agent = p.agent;
  const tipLabels = {
    'intravilan-rezidential': 'Intravilan rezidențial',
    'intravilan-comercial': 'Intravilan comercial',
    'extravilan-agricol': 'Extravilan agricol',
    'industrial': 'Industrial'
  };
  const utilsAll = [
    { k: 'apa', i: 'fa-droplet', t: 'Apă' },
    { k: 'curent', i: 'fa-bolt', t: 'Curent' },
    { k: 'gaz', i: 'fa-fire', t: 'Gaz' },
    { k: 'canalizare', i: 'fa-toilet', t: 'Canalizare' }
  ];
  document.title = `${p.titlu} - EVEN`;

  document.getElementById('breadcrumbs').innerHTML = `
    <a href="index.html">Acasă</a> / <a href="listings-terenuri.html">Terenuri</a> / ${p.titlu}
  `;

  document.getElementById('detailContent').innerHTML = `
    ${renderGallery(p.imagini)}
    <div class="prop-layout">
      <div class="prop-main">
        <div class="prop-title-row">
          <div>
            <span class="badge badge-teren" style="margin-bottom:8px;display:inline-block">${tipLabels[p.tip]}</span>
            <h1>${p.titlu}</h1>
            <div class="prop-location"><i class="fa-solid fa-location-dot"></i> ${p.adresa}, ${p.localitate}, ${p.judet}</div>
          </div>
          <div>
            <div class="prop-price">${formatPrice(p.pretTotal)}</div>
            <div style="text-align:right;color:var(--gray-500);font-size:14px;margin-top:4px">${p.pretMp} €/mp · ${p.suprafata} ${p.unitate}</div>
          </div>
        </div>

        <div class="prop-section">
          <h2>Utilități disponibile</h2>
          <div class="utils-grid">
            ${utilsAll.map(u => `
              <div class="util-card ${p.utilitati.includes(u.k) ? 'active' : ''}">
                <i class="fa-solid ${u.i}"></i>
                <div class="util-name">${u.t}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="prop-section">
          <h2>Regim juridic & urbanistic</h2>
          <div class="legal-grid">
            <div class="legal-card">
              <div class="legal-label">Suprafață</div>
              <div class="legal-val">${p.suprafata} ${p.unitate}</div>
            </div>
            <div class="legal-card">
              <div class="legal-label">Front stradal</div>
              <div class="legal-val">${p.frontStradal} ml</div>
            </div>
            <div class="legal-card">
              <div class="legal-label">Acces drum</div>
              <div class="legal-val">${capitalize(p.accesDrum)}</div>
            </div>
            <div class="legal-card">
              <div class="legal-label">Zonare PUG</div>
              <div class="legal-val">${p.zonarePUG}</div>
            </div>
            ${p.CUT != null ? `
            <div class="legal-card">
              <div class="legal-label">CUT</div>
              <div class="legal-val">${p.CUT}</div>
            </div>` : ''}
            ${p.POT != null ? `
            <div class="legal-card">
              <div class="legal-label">POT</div>
              <div class="legal-val">${p.POT}%</div>
            </div>` : ''}
          </div>
        </div>

        <div class="prop-section">
          <h2>Descriere</h2>
          <p class="prop-description">${p.descriere}</p>
          <p class="prop-description" style="margin-top:12px"><strong>Vecinătăți:</strong> ${p.vecinatati}</p>
          <p class="prop-description" style="margin-top:12px"><strong>Documente:</strong> Extras CF disponibil la solicitare. CU și PUZ se pot obține în baza identificării cadastrale.</p>
        </div>

        <div class="prop-section">
          <h2>Plan cadastral</h2>
          <div class="floorplan">
            <i class="fa-solid fa-map-location-dot"></i>
            <div>Plan cadastral disponibil în PDF la cerere</div>
          </div>
        </div>
      </div>

      ${renderSidebar(agent, p)}
    </div>
  `;
}

// ---------- HELPERS COMMON ----------
function renderGallery(imagini) {
  const imgs = Array.isArray(imagini) ? imagini : [];
  const cell = (idx, withOverlay = false) => {
    const url = imgs[idx];
    const inner = url
      ? `<img src="${url}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block">`
      : `<div class="img-placeholder"></div>`;
    const overlay = withOverlay && imgs.length > 4
      ? `<div class="more-overlay">+${imgs.length - 4} foto</div>`
      : '';
    return `${inner}${overlay}`;
  };
  return `
    <div class="gallery">
      <div class="gallery-main" id="galMain">${cell(0)}</div>
      <div class="gallery-thumb">${cell(1)}</div>
      <div class="gallery-thumb">${cell(2)}</div>
      <div class="gallery-thumb">${cell(3)}</div>
      <div class="gallery-thumb">${cell(4, true)}</div>
    </div>
  `;
}

function renderSidebar(agent, p) {
  if (!agent) return '';
  const initials = agent.nume.split(' ').map(n => n[0]).join('').slice(0, 2);
  return `
    <aside class="prop-sidebar">
      <div class="agent-card">
        <div class="agent-top">
          <div class="agent-foto">${initials}</div>
          <div>
            <div class="agent-nume">${agent.nume}</div>
            <div class="agent-rol">${agent.rol}</div>
          </div>
        </div>
        <div class="agent-contact">
          <a href="tel:${agent.telefon}"><i class="fa-solid fa-phone"></i> ${agent.telefon}</a>
          <a href="mailto:${agent.email}"><i class="fa-solid fa-envelope"></i> Trimite email</a>
        </div>
        <button class="btn btn-primary btn-full" onclick="alert('Apel către ' + '${agent.nume}' + ' inițiat')"><i class="fa-solid fa-phone"></i> Sună acum</button>
      </div>

      <div class="contact-form-card">
        <h3>Programează vizionare</h3>
        <form onsubmit="submitVizionare(event)">
          <div class="form-group">
            <label>Nume</label>
            <input type="text" required placeholder="Numele tău">
          </div>
          <div class="form-group">
            <label>Telefon</label>
            <input type="tel" required placeholder="07xx xxx xxx">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" required placeholder="email@exemplu.ro">
          </div>
          <div class="form-group">
            <label>Mesaj</label>
            <textarea placeholder="Sunt interesat(ă) de această proprietate..."></textarea>
          </div>
          <button class="btn btn-gold btn-full" type="submit">Trimite cererea</button>
        </form>
      </div>

      <div style="text-align:center;font-size:13px;color:var(--gray-500)">
        <i class="fa-solid fa-shield-halved" style="color:var(--gold)"></i> Anunț verificat de echipa EVEN
      </div>
    </aside>
  `;
}

function submitVizionare(e) {
  e.preventDefault();
  alert('Cererea ta a fost trimisă! Te vom contacta în maxim 2 ore.');
  e.target.reset();
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

// ---------- CALCULATOR RATE ----------
function calcRate() {
  const pret = +document.getElementById('calcPret').value || 0;
  const avansPct = +document.getElementById('calcAvans').value || 0;
  const dobanda = (+document.getElementById('calcDobanda').value || 0) / 100;
  const ani = +document.getElementById('calcAni').value || 1;

  const imprumut = pret * (1 - avansPct / 100);
  const dobandaLunara = dobanda / 12;
  const luni = ani * 12;

  let rata = 0;
  if (dobandaLunara > 0) {
    rata = imprumut * (dobandaLunara * Math.pow(1 + dobandaLunara, luni)) / (Math.pow(1 + dobandaLunara, luni) - 1);
  } else {
    rata = imprumut / luni;
  }

  document.getElementById('calcRezultat').textContent = formatPrice(Math.round(rata)) + ' / lună';
  document.getElementById('calcImprumut').textContent = formatPrice(Math.round(imprumut));
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', async () => {
  const id = getQueryParam('id');
  const category = PROPERTY_PAGE.category;
  const contentEl = document.getElementById('detailContent');

  if (!id) {
    contentEl.innerHTML = '<div class="empty-state"><i class="fa-regular fa-circle-question"></i><h3>Proprietate inexistentă</h3></div>';
    return;
  }

  contentEl.innerHTML = '<div style="text-align:center;padding:80px;color:var(--gray-500)"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

  const p = await getPropById(id, category);
  currentProperty = p;

  if (!p) {
    contentEl.innerHTML = '<div class="empty-state"><i class="fa-regular fa-circle-question"></i><h3>Proprietate inexistentă</h3></div>';
    return;
  }

  if (category === 'rezidential') renderRezidential(p);
  if (category === 'comercial') renderComercial(p);
  if (category === 'terenuri') renderTeren(p);
});
