// ============================================
// PROJECTS.JS - Lista + detaliu proiect
// ============================================

let projectFilters = {};
let allProjects = [];

function statusLabel(s) {
  return { 'pre-vanzare': 'Pre-vânzare', 'construire': 'În construcție', 'finalizat': 'Finalizat' }[s] || s;
}

function formatLivrareLong(d) {
  return new Date(d).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
}

// A project/unit price may be intentionally withheld (null/0) → "la cerere".
function hasPrice(n) { return n != null && n > 0; }

// ---------- LISTĂ PROIECTE ----------
function shortPjNum(id) {
  return String(id || '').replace(/-/g, '').slice(0, 4).toUpperCase() || '----';
}

function renderProjectsList() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  let filtered = [...allProjects];
  const f = projectFilters;
  if (f.oras) filtered = filtered.filter(p => p.oras.toLowerCase().includes(f.oras.toLowerCase()));
  if (f.status) filtered = filtered.filter(p => p.status === f.status);
  if (f.tipUnitate) filtered = filtered.filter(p => p.tipuriUnitati.includes(f.tipUnitate));
  if (f.pretMax) filtered = filtered.filter(p => p.intervalPret.min <= +f.pretMax);

  const countEl = document.getElementById('projectsCount');
  if (countEl) countEl.textContent = `${filtered.length} listing${filtered.length === 1 ? '' : 's'}`;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><h3>Niciun proiect găsit</h3><p>Schimbă filtrele.</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const photo = (p.imagini && p.imagini[0])
      ? `<img src="${p.imagini[0]}" alt="${p.nume}" loading="lazy">`
      : `<div class="img-placeholder"></div>`;
    const eyebrow = `${statusLabel(p.status)} · ${p.cartier}`;
    return `
      <a class="prop-card pj-card" href="project-detail.html?id=${p.id}" aria-label="${p.nume}">
        <figure class="prop-card-media">
          <div class="prop-card-img">${photo}</div>
        </figure>
        <div class="prop-card-body">
          <div class="prop-card-eyebrow">
            <span>${eyebrow}</span>
            <span class="prop-card-num">Nº ${shortPjNum(p.id)}</span>
          </div>
          <h3 class="prop-card-title">${p.nume}</h3>
          <p class="pj-card-dev">${p.dezvoltator}</p>
          <p class="prop-card-meta">
            ${p.unitatiDisponibile}/${p.unitatiTotal} unități
            <span class="sep"> · </span>
            Livrare ${formatLivrareLong(p.dataLivrare)}
            <span class="sep"> · </span>
            Progres ${p.progres}%
          </p>
          <div class="pj-progress-bar" aria-hidden="true">
            <span style="width:${Math.min(100, Math.max(0, p.progres))}%"></span>
          </div>
          <div class="prop-card-foot">
            <div>
              ${hasPrice(p.intervalPret.min)
                ? `<span class="prop-card-price">${formatPrice(p.intervalPret.min)}</span>
                   <span class="prop-card-price-sub">de la · până la ${formatPrice(p.intervalPret.max)}</span>`
                : `<span class="prop-card-price">Preț la cerere</span>
                   <span class="prop-card-price-sub">consultant dedicat</span>`}
            </div>
            <span class="prop-card-cta">Detalii <i class="fa-solid fa-arrow-right"></i></span>
          </div>
        </div>
      </a>
    `;
  }).join('');
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
  Object.entries(getAllQueryParams()).forEach(([k, v]) => {
    const el = document.querySelector(`[data-pf="${k}"]`);
    if (el) { el.value = v; projectFilters[k] = v; }
  });
  renderProjectsList();
}

// ---------- DETALIU PROIECT ----------
let unitFilters = {};
let currentProject = null;

function renderProjectDetail(p) {
  currentProject = p;
  document.title = `${p.nume} - EVEN`;

  const heroImg = (p.imagini && p.imagini[0])
    ? `<img src="${p.imagini[0]}" alt="${p.nume}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`
    : `<div class="img-placeholder" style="position:absolute;inset:0"></div>`;
  document.getElementById('projectHero').innerHTML = `
    ${heroImg}
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
      <div class="summary-label">Preț</div>
      <div class="summary-val">${hasPrice(p.intervalPret.min)
        ? `${formatPrice(p.intervalPret.min)} – ${formatPrice(p.intervalPret.max)}`
        : 'La solicitare'}</div>
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

  document.getElementById('projectGallery').innerHTML = renderGalleryProj(p.imagini);

  const initials = p.dezvoltator.split(' ').map(s => s[0]).join('').slice(0, 2);
  document.getElementById('developerBlock').innerHTML = `
    <h2>Dezvoltator</h2>
    <div class="dev-block">
      <div class="dev-logo">${initials}</div>
      <div>
        <h3 style="margin-bottom:6px">${p.dezvoltator}</h3>
        <p style="font-size:14px;color:var(--gray-500);margin-bottom:8px">Proiecte anterioare:</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${(p.dezvoltatorProiecte || []).map(pr => `<span class="badge badge-proiect">${pr}</span>`).join('')}
        </div>
      </div>
    </div>
  `;

  renderTimeline(p);

  const pp = p.planPlata || {};
  document.getElementById('paymentPlanWrap').innerHTML = (pp.rate && pp.rate.length)
    ? `
      <h2>Plan de plată</h2>
      <p style="color:var(--gray-500);margin-bottom:20px">Avans inițial: <strong>${pp.avans}%</strong> · Restul în tranșe pe etape de construcție</p>
      <div class="payment-plan">
        ${pp.rate.map(r => `
          <div class="payment-step">
            <div class="step-pct">${r.procent}%</div>
            <div class="step-label">${r.etapa}</div>
          </div>
        `).join('')}
      </div>
    `
    : '';

  renderUnitsTable(p);

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
  imagini = imagini || [];
  if (!imagini.length) {
    return `
      <h2>Galerie</h2>
      <div class="gallery">
        <div class="gallery-main"><div class="img-placeholder"></div></div>
        <div class="gallery-thumb"><div class="img-placeholder"></div></div>
        <div class="gallery-thumb"><div class="img-placeholder"></div></div>
        <div class="gallery-thumb"><div class="img-placeholder"></div></div>
        <div class="gallery-thumb"><div class="img-placeholder"></div></div>
      </div>
    `;
  }
  const cell = (src, extra = '') =>
    `<a href="${src}" target="_blank" rel="noopener">${extra}<img src="${src}" alt="" loading="lazy"></a>`;
  const main = imagini[0];
  const thumbs = imagini.slice(1, 5);
  const remaining = Math.max(0, imagini.length - 5);
  return `
    <h2>Galerie</h2>
    <div class="gallery">
      <div class="gallery-main">${cell(main)}</div>
      ${thumbs.map((src, i) => {
        const overlay = (i === thumbs.length - 1 && remaining > 0)
          ? `<div class="more-overlay">+${remaining} foto</div>` : '';
        return `<div class="gallery-thumb">${cell(src, overlay)}</div>`;
      }).join('')}
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
          <th>Nr. unitate</th><th>Tip</th><th>Etaj</th><th>Suprafață</th><th>Preț</th><th>Status</th><th></th>
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
              <td><strong>${hasPrice(u.pret) ? formatPrice(u.pret) : 'La cerere'}</strong></td>
              <td><span class="unit-status ${u.status}">${u.status}</span></td>
              <td>
                ${u.status === 'disponibil' ?
                  `<a class="btn btn-outline" style="padding:6px 14px;font-size:12px" href="#interestForm">Cere ofertă</a>` :
                  ''
                }
              </td>
            </tr>
          `).join('')}
      </tbody>
    </table>
  `;

  document.querySelectorAll('[data-uf]').forEach(el => {
    const handler = () => {
      const k = el.dataset.uf;
      if (el.value) unitFilters[k] = el.value;
      else delete unitFilters[k];
      renderUnitsTable(p);
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  });
}

async function submitInterest(e, projName) {
  e.preventDefault();
  const form = e.target;
  const inputs = form.querySelectorAll('input, select, textarea');
  const projectId = (typeof currentProject !== 'undefined' && currentProject) ? currentProject.id : null;
  const tipUnitate = inputs[3]?.value || '';
  const userMesaj = inputs[4]?.value || '';
  const payload = {
    nume: inputs[0]?.value || '',
    telefon: inputs[1]?.value || '',
    email: inputs[2]?.value || '',
    mesaj: `Interes proiect: ${projName}${tipUnitate ? ' · Tip unitate: ' + tipUnitate : ''}${userMesaj ? '\n\n' + userMesaj : ''}`,
    project_id: projectId,
    tip: 'oferta',
    sursa: 'website'
  };
  const btn = form.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.dataset.orig = btn.innerHTML; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Se trimite...'; }
  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('server');
    form.reset();
    alert(`Mulțumim! Cererea pentru ${projName} a ajuns la noi. Te contactăm în maxim 24 de ore.`);
  } catch {
    try {
      const queue = JSON.parse(localStorage.getItem('even_lead_queue') || '[]');
      queue.push({ ...payload, created_at: new Date().toISOString() });
      localStorage.setItem('even_lead_queue', JSON.stringify(queue));
    } catch (_) {}
    alert(`Nu am putut trimite cererea automat. Sună-ne la 0745 609 366 sau scrie-ne la ilan@even-imobiliare.ro.`);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.orig || 'Trimite cererea'; }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const page = document.body.dataset.subpage;

  if (page === 'projects-list') {
    const grid = document.getElementById('projectsGrid');
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--gray-500)"><i class="fa-solid fa-spinner fa-spin"></i> Se încarcă...</div>';
    try {
      allProjects = await getProjects();
    } catch (err) {
      console.error('Projects load error:', err);
    }
    initProjectsListing();

  } else if (page === 'project-detail') {
    const id = getQueryParam('id');
    const heroEl = document.getElementById('projectHero');
    if (heroEl) heroEl.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:white"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

    let proj = null;
    if (id) {
      proj = await getProjectById(id);
    }
    if (!proj) {
      const projects = await getProjects();
      proj = projects[0];
    }
    if (proj) renderProjectDetail(proj);
  }
});
