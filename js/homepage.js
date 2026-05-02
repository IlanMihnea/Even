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

async function renderFeaturedProperties() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  try {
    const props = await getProperties('rezidential');
    grid.innerHTML = props.slice(0, 4).map(p => renderHomePropCard(p)).join('');
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

function renderHomePropCard(p) {
  return `
    <a class="prop-card reveal" href="property-rezidential.html?id=${p.id}">
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
          ${p.etaj != null ? `<span><i class="fa-solid fa-stairs"></i> Et. ${p.etaj}</span>` : ''}
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

document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.flux-tab').forEach(tab => {
    tab.addEventListener('click', () => setFluxTab(tab.dataset.flux));
  });
  renderFilters();
  await Promise.all([renderFeaturedProperties(), renderHomeProjects()]);
  setTimeout(() => initScrollReveal(), 50);
});
