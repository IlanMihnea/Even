// ============================================
// PROJECTS.JS - Lista + detaliu proiect
// ============================================

let projectFilters = {};

function statusLabel(s) {
  return { 'pre-vanzare': 'Pre-vânzare', 'construire': 'În construcție', 'finalizat': 'Finalizat' }[s] || s;
}

function formatLivrareLong(d) {
  return new Date(d).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
}

// ---------- LISTĂ PROIECTE ----------
function renderProjectsList() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  let filtered = [...proiecte];
  const f = projectFilters;
  if (f.oras) filtered = filtered.filter(p => p.oras.toLowerCase().includes(f.oras.toLowerCase()));
  if (f.status) filtered = filtered.filter(p => p.status === f.status);
  if (f.tipUnitate) filtered = filtered.filter(p => p.tipuriUnitati.includes(f.tipUnitate));
  if (f.pretMax) filtered = filtered.filter(p => p.intervalPret.min <= +f.pretMax);

  document.getElementById('projectsCount').innerHTML = `<strong>${filtered.length}</strong> proiecte`;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><i class="fa-regular fa-folder-open"></i><h3>Niciun proiect găsit</h3></div>';
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <a class="project-card" href="project-detail.html?id=${p.id}">
      <div class="project-card-img">
        <div class="img-placeholder"></div>
        <div class="status-tag">
          <span class="status-dot status-${p.status}"></span> ${statusLabel(p.status)}
        </div>
        <div class="available-tag">${p.unitatiDisponibile} unități disponibile</div>
      </div>
      <div class="project-card-body">
        <div class="project-dev">${p.dezvoltator}</div>
        <h3>${p.nume}</h3>
        <div class="project-loc"><i class="fa-solid fa-location-dot"></i> ${p.cartier}, ${p.oras}</div>
        <div class="project-price-range">
          ${formatPrice(p.intervalPret.min)} – ${formatPrice(p.intervalPret.max)}
          <span>/ unitate</span>
        </div>
        <div class="project-meta">
          <span>Livrare <strong>${formatLivrareLong(p.dataLivrare)}</strong></span>
          <span>Progres <strong>${p.progres}%</strong></span>
        </div>
      </div>
    </a>
  `).join('');
}

function initProjectsListing() {
  const debouncedRender = debounce(() => {
    document.querySelectorAll('[data-pf]').forEach(el => {
      const k = el.dataset.pf;
      if (el.value) projectFilters[k] = el.value;
      else delete projectFilters[k];
    });
    renderProjectsList();
  }, 200);
  document.querySelectorAll('[data-pf]').forEach(el => {
    el.addEventListener('input', debouncedRender);
    el.addEventListener('change', debouncedRender);
  });
  // Apply query params
  Object.entries(getAllQueryParams()).forEach(([k, v]) => {
    const el = document.querySelector(`[data-pf="${k}"]`);
    if (el) { el.value = v; projectFilters[k] = v; }
  });
  renderProjectsList();
}

// ---------- DETALIU PROIECT ----------
let unitFilters = {};

function renderProjectDetail(p) {
  document.title = `${p.nume} - CasaNova`;

  document.getElementById('projectHero').innerHTML = `
    <div class="img-placeholder" style="position:absolute;inset:0"></div>
    <div class="overlay"></div>
    <div class="project-hero-content">
      <div class="container">
        <div class="dev-name">${p.dezvoltator}</div>
        <h1>${p.nume}</h1>
        <div class="project-loc"><i class="fa-solid fa-location-dot"></i> ${p.adresa}, ${p.cartier}, ${p.oras}</div>
      </div>
    </div>
  `;

  const summary = document.getElementById('projectSummary');
  summary.innerHTML = `
    <div class="summary-item">
      <div class="summary-label">Status</div>
      <div class="summary-val"><span class="status-dot status-${p.status}"></span>${statusLabel(p.status)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Livrare</div>
      <div class="summary-val">${formatLivrareLong(p.dataLivrare)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Unități disponibile</div>
      <div class="summary-val">${p.unitatiDisponibile} / ${p.unitatiTotal}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Interval preț</div>
      <div class="summary-val">${formatPrice(p.intervalPret.min)} – ${formatPrice(p.intervalPret.max)}</div>
    </div>
  `;

  document.getElementById('projectDescription').innerHTML = `
    <h2>Despre proiect</h2>
    <p style="color:var(--gray-600);font-size:15px;line-height:1.8">${p.descriere}</p>
    <h3 style="margin-top:24px;margin-bottom:12px;font-size:1rem">Facilități ansamblu</h3>
    <ul class="facilitati-list">
      ${p.facilitati.map(f => `<li><i class="fa-solid fa-check" style="color:var(--gold)"></i> ${f}</li>`).join('')}
    </ul>
  `;

  // Galerie placeholder
  document.getElementById('projectGallery').innerHTML = renderGalleryProj(p.imagini);

  // Dezvoltator
  const initials = p.dezvoltator.split(' ').map(s => s[0]).join('').slice(0, 2);
  document.getElementById('developerBlock').innerHTML = `
    <h2>Dezvoltator</h2>
    <div class="dev-block">
      <div class="dev-logo">${initials}</div>
      <div>
        <h3 style="margin-bottom:6px">${p.dezvoltator}</h3>
        <p style="font-size:14px;color:var(--gray-500);margin-bottom:8px">Proiecte anterioare:</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${p.dezvoltatorProiecte.map(pr => `<span class="badge badge-proiect">${pr}</span>`).join('')}
        </div>
      </div>
    </div>
  `;

  // Timeline
  renderTimeline(p);

  // Plan plată
  document.getElementById('paymentPlanWrap').innerHTML = `
    <h2>Plan de plată</h2>
    <p style="color:var(--gray-500);margin-bottom:20px">Avans inițial: <strong>${p.planPlata.avans}%</strong> · Restul în tranșe pe etape de construcție</p>
    <div class="payment-plan">
      ${p.planPlata.rate.map(r => `
        <div class="payment-step">
          <div class="step-pct">${r.procent}%</div>
          <div class="step-label">${r.etapa}</div>
        </div>
      `).join('')}
    </div>
  `;

  // Unități
  renderUnitsTable(p);

  // Form interes
  document.getElementById('interestForm').innerHTML = `
    <h2>Mă interesează acest proiect</h2>
    <p style="color:var(--gray-500);margin-bottom:20px">Lasă-ne datele tale și un consultant te va contacta în maxim 24 ore cu lista completă de unități și prețuri actualizate.</p>
    <form onsubmit="submitInterest(event, '${p.nume}')" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:720px">
      <div class="form-group"><label>Nume</label><input type="text" required></div>
      <div class="form-group"><label>Telefon</label><input type="tel" required></div>
      <div class="form-group" style="grid-column:1/-1"><label>Email</label><input type="email" required></div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Tip unitate dorită</label>
        <select>
          ${p.tipuriUnitati.map(t => `<option>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Mesaj (opțional)</label>
        <textarea placeholder="Programare vizionare șantier, întrebări specifice..."></textarea>
      </div>
      <button type="submit" class="btn btn-gold" style="grid-column:1/-1;justify-self:start">
        <i class="fa-solid fa-paper-plane"></i> Trimite cererea
      </button>
    </form>
  `;
}

function renderGalleryProj(imagini) {
  return `
    <h2>Galerie</h2>
    <div class="gallery">
      <div class="gallery-main"><div class="img-placeholder"></div></div>
      <div class="gallery-thumb"><div class="img-placeholder"></div></div>
      <div class="gallery-thumb"><div class="img-placeholder"></div></div>
      <div class="gallery-thumb"><div class="img-placeholder"></div></div>
      <div class="gallery-thumb"><div class="img-placeholder"></div><div class="more-overlay">+${Math.max(0, imagini.length - 4)} foto</div></div>
    </div>
  `;
}

function renderTimeline(p) {
  const wrap = document.getElementById('timelineWrap');
  const total = p.timeline.length;
  const doneCount = p.timeline.filter(t => t.stare === 'finalizat').length;
  const progressPct = (doneCount / total) * 100;

  wrap.innerHTML = `
    <h2>Timeline construcție</h2>
    <div class="timeline" style="margin-top:24px">
      <div class="timeline-line"></div>
      <div class="timeline-progress" style="width:${progressPct}%"></div>
      <div class="timeline-items" style="grid-template-columns:repeat(${total}, 1fr)">
        ${p.timeline.map(t => {
          const cls = t.stare === 'finalizat' ? 'done' : t.stare === 'in-curs' ? 'in-curs' : '';
          return `
            <div class="timeline-item ${cls}">
              <div class="timeline-dot"></div>
              <div class="t-etapa">${t.etapa}</div>
              <div class="t-data">${t.data}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderUnitsTable(p) {
  const wrap = document.getElementById('unitsWrap');
  let units = [...p.unitati];
  const f = unitFilters;
  if (f.tip) units = units.filter(u => u.tip === f.tip);
  if (f.etajMin) units = units.filter(u => u.etaj >= +f.etajMin);
  if (f.suprafataMin) units = units.filter(u => u.suprafata >= +f.suprafataMin);
  if (f.pretMax) units = units.filter(u => u.pret <= +f.pretMax);
  if (f.status) units = units.filter(u => u.status === f.status);

  const types = [...new Set(p.unitati.map(u => u.tip))];

  wrap.innerHTML = `
    <h2>Unități disponibile <span style="font-size:0.7em;color:var(--gray-500);font-weight:400">(${units.length} din ${p.unitati.length})</span></h2>
    <div class="units-filters">
      <select data-uf="tip">
        <option value="">Toate tipurile</option>
        ${types.map(t => `<option value="${t}">${t}</option>`).join('')}
      </select>
      <input type="number" placeholder="Etaj min" data-uf="etajMin">
      <input type="number" placeholder="Suprafață min (mp)" data-uf="suprafataMin">
      <input type="number" placeholder="Preț max (€)" data-uf="pretMax">
      <select data-uf="status">
        <option value="">Toate statusurile</option>
        <option value="disponibil">Disponibil</option>
        <option value="rezervat">Rezervat</option>
        <option value="vandut">Vândut</option>
      </select>
    </div>
    <table class="units-table">
      <thead>
        <tr>
          <th>Nr. unitate</th>
          <th>Tip</th>
          <th>Etaj</th>
          <th>Suprafață</th>
          <th>Preț</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${units.length === 0 ? '<tr><td colspan="7" style="text-align:center;color:var(--gray-500);padding:40px">Nicio unitate cu aceste filtre</td></tr>' :
          units.map(u => `
            <tr>
              <td><strong>${u.numar}</strong></td>
              <td>${u.tip}</td>
              <td>Etaj ${u.etaj}</td>
              <td>${u.suprafata} mp</td>
              <td><strong>${formatPrice(u.pret)}</strong></td>
              <td><span class="unit-status ${u.status}">${u.status}</span></td>
              <td>
                ${u.status === 'disponibil' ?
                  `<button class="btn btn-outline" style="padding:6px 14px;font-size:12px" onclick="alert('Solicitare detalii pentru ' + '${u.numar}')">Detalii</button>` :
                  ''
                }
              </td>
            </tr>
          `).join('')}
      </tbody>
    </table>
  `;

  document.querySelectorAll('[data-uf]').forEach(el => {
    el.addEventListener('input', () => {
      const k = el.dataset.uf;
      if (el.value) unitFilters[k] = el.value;
      else delete unitFilters[k];
      renderUnitsTable(p);
    });
    el.addEventListener('change', () => {
      const k = el.dataset.uf;
      if (el.value) unitFilters[k] = el.value;
      else delete unitFilters[k];
      renderUnitsTable(p);
    });
  });
}

function submitInterest(e, projName) {
  e.preventDefault();
  alert(`Mulțumim! Cererea ta pentru ${projName} a fost trimisă. Te contactăm în 24 ore.`);
  e.target.reset();
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.subpage;
  if (page === 'projects-list') {
    initProjectsListing();
  } else if (page === 'project-detail') {
    const id = getQueryParam('id');
    const proj = proiecte.find(p => p.id === id) || proiecte[0];
    renderProjectDetail(proj);
  }
});
