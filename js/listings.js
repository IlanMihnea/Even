// ============================================
// LISTINGS.JS - Filtrare/sortare/paginare reutilizabile
// Configurat per categorie via window.LISTING_CONFIG
// ============================================

const PAGE_SIZE = 6;
let currentPage = 1;
let activeFilters = {};
let sortBy = 'default';

function getCategoryData() {
  switch (LISTING_CONFIG.category) {
    case 'rezidential': return rezidential;
    case 'comercial': return comercial;
    case 'terenuri': return terenuri;
    default: return [];
  }
}

function getDetailPage() {
  return {
    rezidential: 'property-rezidential.html',
    comercial: 'property-comercial.html',
    terenuri: 'property-teren.html'
  }[LISTING_CONFIG.category];
}

// ---------- FILTRARE ----------
function applyFilters(items) {
  let result = [...items];
  const f = activeFilters;

  if (LISTING_CONFIG.category === 'rezidential') {
    if (f.regim) result = result.filter(p => p.regim === f.regim);
    if (f.tip) result = result.filter(p => p.tip === f.tip);
    if (f.oras) result = result.filter(p => p.oras.toLowerCase().includes(f.oras.toLowerCase()));
    if (f.camere) result = result.filter(p => p.camere >= +f.camere);
    if (f.pretMin) result = result.filter(p => p.pret >= +f.pretMin);
    if (f.pretMax) result = result.filter(p => p.pret <= +f.pretMax);
    if (f.suprafataMin) result = result.filter(p => p.suprafata >= +f.suprafataMin);
    if (f.parcare === 'true') result = result.filter(p => p.parcare);
    if (f.balcon === 'true') result = result.filter(p => p.balcon);
    if (f.orientare) result = result.filter(p => p.orientare === f.orientare);
  }

  if (LISTING_CONFIG.category === 'comercial') {
    if (f.regim) result = result.filter(p => p.regim === f.regim);
    if (f.tipSpatiu) result = result.filter(p => p.tipSpatiu === f.tipSpatiu);
    if (f.oras) result = result.filter(p => p.oras.toLowerCase().includes(f.oras.toLowerCase()));
    if (f.suprafataMin) result = result.filter(p => p.suprafataTotala >= +f.suprafataMin);
    if (f.suprafataMax) result = result.filter(p => p.suprafataTotala <= +f.suprafataMax);
    if (f.clasaCladire) result = result.filter(p => p.clasaCladire === f.clasaCladire);
    if (f.locuriParcare) result = result.filter(p => p.locuriParcare >= +f.locuriParcare);
    if (f.inaltimeLibera) result = result.filter(p => p.inaltimeLibera >= +f.inaltimeLibera);
  }

  if (LISTING_CONFIG.category === 'terenuri') {
    if (f.tip) result = result.filter(p => p.tip === f.tip);
    if (f.judet) result = result.filter(p => p.judet.toLowerCase().includes(f.judet.toLowerCase()));
    if (f.suprafataMin) {
      result = result.filter(p => {
        const mp = p.unitate === 'ha' ? p.suprafata * 10000 : p.suprafata;
        return mp >= +f.suprafataMin;
      });
    }
    if (f.pretMax) result = result.filter(p => p.pretTotal <= +f.pretMax);
    if (f.accesDrum) result = result.filter(p => p.accesDrum === f.accesDrum);
    if (f.utilitati === 'toate') {
      result = result.filter(p => ['apa','curent','gaz','canalizare'].every(u => p.utilitati.includes(u)));
    } else if (f.utilitati && f.utilitati !== '') {
      result = result.filter(p => p.utilitati.includes(f.utilitati));
    }
  }

  return result;
}

// ---------- SORTARE ----------
function applySort(items) {
  const sorted = [...items];
  switch (sortBy) {
    case 'pret-asc':
      sorted.sort((a, b) => (a.pret ?? a.pretTotal ?? 0) - (b.pret ?? b.pretTotal ?? 0));
      break;
    case 'pret-desc':
      sorted.sort((a, b) => (b.pret ?? b.pretTotal ?? 0) - (a.pret ?? a.pretTotal ?? 0));
      break;
    case 'suprafata-desc':
      sorted.sort((a, b) => (b.suprafata ?? b.suprafataTotala ?? 0) - (a.suprafata ?? a.suprafataTotala ?? 0));
      break;
    case 'nou':
      sorted.sort((a, b) => (b.anConstructie ?? 0) - (a.anConstructie ?? 0));
      break;
  }
  return sorted;
}

// ---------- RENDER CARD ----------
function renderCard(p) {
  const detail = `${getDetailPage()}?id=${p.id}`;
  if (LISTING_CONFIG.category === 'rezidential') return renderRezCard(p, detail);
  if (LISTING_CONFIG.category === 'comercial') return renderComCard(p, detail);
  if (LISTING_CONFIG.category === 'terenuri') return renderTerCard(p, detail);
  return '';
}

function renderRezCard(p, link) {
  return `
    <a class="prop-card" href="${link}">
      <div class="prop-card-img">
        <div class="img-placeholder"></div>
        <div class="badges">
          <span class="badge badge-${p.regim}">${p.regim === 'vanzare' ? 'Vânzare' : 'Închiriere'}</span>
        </div>
        <div class="card-overlay">
          <div class="card-overlay-content">
            <span><i class="fa-solid fa-bed"></i> ${p.camere} cam</span>
            <span><i class="fa-solid fa-vector-square"></i> ${p.suprafata} mp</span>
            ${p.etaj != null ? `<span><i class="fa-solid fa-stairs"></i> Et. ${p.etaj}</span>` : ''}
            ${p.parcare ? '<span><i class="fa-solid fa-square-parking"></i></span>' : ''}
          </div>
        </div>
        <div class="fav" onclick="event.preventDefault(); toggleFav(this)"><i class="fa-regular fa-heart"></i></div>
      </div>
      <div class="prop-card-body">
        <div class="prop-card-price">
          ${formatPrice(p.pret)}${p.regim === 'inchiriere' ? '<span class="per-month"> / lună</span>' : ''}
        </div>
        <div class="prop-card-title">${p.titlu}</div>
        <div class="prop-card-loc"><i class="fa-solid fa-location-dot"></i> ${p.cartier}, ${p.oras}</div>
        <div class="prop-card-meta">
          <span><i class="fa-solid fa-bed"></i> ${p.camere} cam</span>
          <span><i class="fa-solid fa-vector-square"></i> ${p.suprafata} mp</span>
          ${p.etaj != null ? `<span><i class="fa-solid fa-stairs"></i> Et. ${p.etaj}/${p.etajTotal}</span>` : ''}
        </div>
      </div>
    </a>`;
}

function renderComCard(p, link) {
  const tipLabels = { birouri: 'Birouri', retail: 'Retail', depozit: 'Depozit', industrial: 'Industrial', showroom: 'Showroom' };
  const pretText = p.pret ? `${p.pret} €/mp/lună` : formatPrice(p.pretTotal);
  return `
    <a class="prop-card card-comercial" href="${link}">
      <div class="prop-card-img">
        <div class="img-placeholder"></div>
        <div class="badges">
          <span class="badge badge-comercial">${tipLabels[p.tipSpatiu]}</span>
          <span class="badge badge-${p.regim}">Clasa ${p.clasaCladire}</span>
        </div>
      </div>
      <div class="prop-card-body">
        <div class="prop-card-title">${tipLabels[p.tipSpatiu]} · ${p.regim === 'vanzare' ? 'Vânzare' : 'Închiriere'}</div>
        <div class="prop-card-subtitle">${p.titlu}</div>
        <div class="prop-card-loc"><i class="fa-solid fa-location-dot"></i> ${p.adresa}, ${p.oras}</div>
        <div class="prop-card-price">${pretText}</div>
        <div class="tech-specs">
          <div><strong>${p.suprafataTotala}</strong> mp totali</div>
          <div><strong>${p.locuriParcare}</strong> parcare</div>
          <div><strong>${p.inaltimeLibera}m</strong> înălțime</div>
          <div><strong>Et. ${p.etaj}</strong></div>
        </div>
      </div>
    </a>`;
}

function renderTerCard(p, link) {
  const tipLabels = {
    'intravilan-rezidential': 'Intravilan rez.',
    'intravilan-comercial': 'Intravilan com.',
    'extravilan-agricol': 'Extravilan agricol',
    'industrial': 'Industrial'
  };
  const utilsAll = [
    { k: 'apa', i: 'fa-droplet', t: 'Apă' },
    { k: 'curent', i: 'fa-bolt', t: 'Curent' },
    { k: 'gaz', i: 'fa-fire', t: 'Gaz' },
    { k: 'canalizare', i: 'fa-toilet', t: 'Canalizare' }
  ];
  return `
    <a class="prop-card card-teren" href="${link}">
      <div class="prop-card-img">
        <div class="img-placeholder"></div>
      </div>
      <div class="prop-card-body">
        <span class="prop-type-chip">${tipLabels[p.tip]}</span>
        <div class="prop-card-title">${p.titlu}</div>
        <div class="prop-card-loc"><i class="fa-solid fa-location-dot"></i> ${p.localitate}, ${p.judet}</div>
        <div class="utils-row">
          ${utilsAll.map(u => `
            <div class="util-icon ${p.utilitati.includes(u.k) ? 'active' : ''}" title="${u.t}">
              <i class="fa-solid ${u.i}"></i>
            </div>
          `).join('')}
          <div class="util-icon" title="Front stradal" style="background:transparent;color:var(--gray-500);font-weight:600;font-size:11px;width:auto;padding:0 8px">
            FS ${p.frontStradal}m
          </div>
        </div>
        <div class="price-row">
          <div class="prop-card-price">${formatPrice(p.pretTotal)}</div>
          <div class="price-mp">${p.pretMp} €/mp · ${p.suprafata} ${p.unitate}</div>
        </div>
      </div>
    </a>`;
}

// ---------- RENDER LISTĂ ----------
function renderList() {
  const items = getCategoryData();
  const filtered = applyFilters(items);
  const sorted = applySort(filtered);

  document.getElementById('resultsCount').innerHTML = `<strong>${filtered.length}</strong> rezultate găsite`;

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = 1;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(start, start + PAGE_SIZE);

  const grid = document.getElementById('listingsGrid');
  if (pageItems.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1">
        <i class="fa-regular fa-folder-open"></i>
        <h3>Niciun rezultat</h3>
        <p>Încearcă să relaxezi filtrele.</p>
      </div>`;
  } else {
    grid.innerHTML = pageItems.map(renderCard).join('');
    // Scroll reveal pentru carduri randate
    setTimeout(() => {
      grid.querySelectorAll('.prop-card').forEach((card, i) => {
        card.classList.add('reveal');
        if (i < 3) card.classList.add(`reveal-delay-${i + 1}`);
      });
      if (typeof initScrollReveal === 'function') initScrollReveal();
    }, 20);
  }

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const pag = document.getElementById('pagination');
  if (totalPages <= 1) { pag.innerHTML = ''; return; }
  let html = `<button ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;
  pag.innerHTML = html;
}

function goToPage(p) {
  currentPage = p;
  renderList();
  window.scrollTo({ top: document.getElementById('listingsGrid').offsetTop - 100, behavior: 'smooth' });
}

// ---------- INIT FILTRE ----------
function initFiltersUI() {
  const sidebar = document.getElementById('filterSidebar');
  if (LISTING_CONFIG.category === 'rezidential') {
    sidebar.innerHTML = `
      <h3>Filtre <button class="reset-btn" onclick="resetFilters()">Resetează</button></h3>
      <div class="filter-group">
        <div class="filter-group-title">Regim</div>
        <div class="pill-list" data-filter="regim">
          <span class="pill" data-value="">Toate</span>
          <span class="pill" data-value="vanzare">Vânzare</span>
          <span class="pill" data-value="inchiriere">Închiriere</span>
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Tip imobil</div>
        <div class="pill-list" data-filter="tip">
          <span class="pill" data-value="">Toate</span>
          <span class="pill" data-value="apartament">Apartament</span>
          <span class="pill" data-value="casa">Casă</span>
          <span class="pill" data-value="vila">Vilă</span>
          <span class="pill" data-value="duplex">Duplex</span>
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Camere min</div>
        <div class="pill-list" data-filter="camere">
          <span class="pill" data-value="">Oricâte</span>
          <span class="pill" data-value="1">1+</span>
          <span class="pill" data-value="2">2+</span>
          <span class="pill" data-value="3">3+</span>
          <span class="pill" data-value="4">4+</span>
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Oraș</div>
        <input type="text" data-filter-input="oras" placeholder="București, Cluj…">
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Preț (€)</div>
        <div class="range-inputs">
          <input type="number" data-filter-input="pretMin" placeholder="min">
          <input type="number" data-filter-input="pretMax" placeholder="max">
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Suprafață min (mp)</div>
        <input type="number" data-filter-input="suprafataMin" placeholder="ex: 60">
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Orientare</div>
        <div class="pill-list" data-filter="orientare">
          <span class="pill" data-value="">Oricare</span>
          <span class="pill" data-value="Sud">Sud</span>
          <span class="pill" data-value="Sud-Est">Sud-Est</span>
          <span class="pill" data-value="Est">Est</span>
          <span class="pill" data-value="Vest">Vest</span>
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Facilități</div>
        <div class="checkbox-list">
          <label class="checkbox-item"><input type="checkbox" data-filter-check="parcare" value="true"> Cu parcare</label>
          <label class="checkbox-item"><input type="checkbox" data-filter-check="balcon" value="true"> Cu balcon</label>
        </div>
      </div>
    `;
  } else if (LISTING_CONFIG.category === 'comercial') {
    sidebar.innerHTML = `
      <h3>Filtre <button class="reset-btn" onclick="resetFilters()">Resetează</button></h3>
      <div class="filter-group">
        <div class="filter-group-title">Regim</div>
        <div class="pill-list" data-filter="regim">
          <span class="pill" data-value="">Toate</span>
          <span class="pill" data-value="vanzare">Vânzare</span>
          <span class="pill" data-value="inchiriere">Închiriere</span>
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Tip spațiu</div>
        <div class="pill-list" data-filter="tipSpatiu">
          <span class="pill" data-value="">Toate</span>
          <span class="pill" data-value="birouri">Birouri</span>
          <span class="pill" data-value="retail">Retail</span>
          <span class="pill" data-value="depozit">Depozit</span>
          <span class="pill" data-value="industrial">Industrial</span>
          <span class="pill" data-value="showroom">Showroom</span>
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Clasă clădire</div>
        <div class="pill-list" data-filter="clasaCladire">
          <span class="pill" data-value="">Toate</span>
          <span class="pill" data-value="A">Clasa A</span>
          <span class="pill" data-value="B">Clasa B</span>
          <span class="pill" data-value="C">Clasa C</span>
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Oraș</div>
        <input type="text" data-filter-input="oras" placeholder="București, Cluj, Ilfov…">
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Suprafață totală (mp)</div>
        <div class="range-inputs">
          <input type="number" data-filter-input="suprafataMin" placeholder="min">
          <input type="number" data-filter-input="suprafataMax" placeholder="max">
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Locuri parcare min</div>
        <input type="number" data-filter-input="locuriParcare" placeholder="ex: 5">
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Înălțime liberă min (m) - depozite</div>
        <input type="number" step="0.1" data-filter-input="inaltimeLibera" placeholder="ex: 8">
      </div>
    `;
  } else if (LISTING_CONFIG.category === 'terenuri') {
    sidebar.innerHTML = `
      <h3>Filtre <button class="reset-btn" onclick="resetFilters()">Resetează</button></h3>
      <div class="filter-group">
        <div class="filter-group-title">Tip teren</div>
        <div class="pill-list" data-filter="tip">
          <span class="pill" data-value="">Toate</span>
          <span class="pill" data-value="intravilan-rezidential">Intravilan rez.</span>
          <span class="pill" data-value="intravilan-comercial">Intravilan com.</span>
          <span class="pill" data-value="extravilan-agricol">Extravilan agricol</span>
          <span class="pill" data-value="industrial">Industrial</span>
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Județ / localitate</div>
        <input type="text" data-filter-input="judet" placeholder="Ilfov, Brașov…">
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Suprafață min (mp)</div>
        <input type="number" data-filter-input="suprafataMin" placeholder="ex: 500">
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Preț max (€)</div>
        <input type="number" data-filter-input="pretMax" placeholder="ex: 200000">
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Acces drum</div>
        <div class="pill-list" data-filter="accesDrum">
          <span class="pill" data-value="">Oricare</span>
          <span class="pill" data-value="asfaltat">Asfaltat</span>
          <span class="pill" data-value="pietruit">Pietruit</span>
          <span class="pill" data-value="camp">Câmp</span>
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-group-title">Utilități</div>
        <div class="pill-list" data-filter="utilitati">
          <span class="pill" data-value="">Indiferent</span>
          <span class="pill" data-value="toate">Toate</span>
          <span class="pill" data-value="curent">Cu curent</span>
          <span class="pill" data-value="gaz">Cu gaz</span>
        </div>
      </div>
    `;
  }

  // Marchează default active pill ""
  document.querySelectorAll('[data-filter]').forEach(group => {
    const def = group.querySelector('[data-value=""]');
    if (def) def.classList.add('active');
  });

  // Listeneri pill
  document.querySelectorAll('.pill-list').forEach(group => {
    group.addEventListener('click', e => {
      if (!e.target.matches('.pill')) return;
      const filterName = group.dataset.filter;
      group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      const v = e.target.dataset.value;
      if (v) activeFilters[filterName] = v;
      else delete activeFilters[filterName];
      currentPage = 1;
      renderList();
    });
  });

  // Inputs cu debounce
  const debouncedRender = debounce(() => {
    document.querySelectorAll('[data-filter-input]').forEach(el => {
      const name = el.dataset.filterInput;
      if (el.value) activeFilters[name] = el.value;
      else delete activeFilters[name];
    });
    document.querySelectorAll('[data-filter-check]').forEach(el => {
      const name = el.dataset.filterCheck;
      if (el.checked) activeFilters[name] = el.value;
      else delete activeFilters[name];
    });
    currentPage = 1;
    renderList();
  }, 300);
  document.querySelectorAll('[data-filter-input]').forEach(el => el.addEventListener('input', debouncedRender));
  document.querySelectorAll('[data-filter-check]').forEach(el => el.addEventListener('change', debouncedRender));

  // Aplică query string params
  applyQueryParams();
}

function applyQueryParams() {
  const params = getAllQueryParams();
  Object.entries(params).forEach(([k, v]) => {
    activeFilters[k] = v;
    // Set UI
    const inp = document.querySelector(`[data-filter-input="${k}"]`);
    if (inp) inp.value = v;
    const pillGroup = document.querySelector(`[data-filter="${k}"]`);
    if (pillGroup) {
      pillGroup.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      const pill = pillGroup.querySelector(`[data-value="${v}"]`);
      if (pill) pill.classList.add('active');
    }
  });
}

function resetFilters() {
  activeFilters = {};
  document.querySelectorAll('[data-filter-input]').forEach(el => el.value = '');
  document.querySelectorAll('[data-filter-check]').forEach(el => el.checked = false);
  document.querySelectorAll('.pill-list').forEach(group => {
    group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    const def = group.querySelector('[data-value=""]');
    if (def) def.classList.add('active');
  });
  currentPage = 1;
  renderList();
}

document.addEventListener('DOMContentLoaded', () => {
  initFiltersUI();
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    sortBy = e.target.value;
    renderList();
  });
  renderList();
});
