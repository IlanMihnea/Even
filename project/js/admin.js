// ============================================
// ADMIN.JS — Supabase auth + full backend management
// Leads, properties (with filters), projects, agents
// ============================================

let activeAdminTab = 'rezidential';
let activeFormCategory = 'rezidential';
let editingProperty = null;
let editingProject = null;
let editingAgent = null;
let existingImages = [];
let allLeadsCache = [];
let allPropsCache = [];
let allProjectsCache = [];
let allAgentsCache = [];

// ---------- AUTH ----------

async function checkLogin() {
  const { data } = await _supabase.auth.getSession();
  return !!data?.session;
}

async function doLogin(e) {
  e.preventDefault();
  const email = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Se autentifică...';

  const { error, data } = await _supabase.auth.signInWithPassword({ email, password });

  if (error) {
    btn.disabled = false;
    btn.textContent = 'Autentificare';
    const hint = document.querySelector('.login-hint');
    if (hint) hint.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="color:#e84545"></i> ${error.message}`;
  } else {
    const userEmailEl = document.getElementById('adminUserEmail');
    if (userEmailEl) userEmailEl.innerHTML = `<i class="fa-solid fa-user-tie"></i> ${data.user?.email || email}`;
    await showDashboard();
  }
}

async function doLogout() {
  await _supabase.auth.signOut();
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
  const hint = document.querySelector('.login-hint');
  if (hint) hint.innerHTML = '';
}

async function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  const { data } = await _supabase.auth.getUser();
  const userEmailEl = document.getElementById('adminUserEmail');
  if (userEmailEl && data?.user?.email) {
    userEmailEl.innerHTML = `<i class="fa-solid fa-user-tie"></i> ${data.user.email}`;
  }
  renderAdminTabs();
  await Promise.all([
    refreshStats(),
    renderLeads(),
    renderTable(),
    renderProjectsTable(),
    renderAgentsTable()
  ]);
  renderBannerPanel();
}

// ---------- STATS ----------

async function refreshStats() {
  const statsGrid = document.getElementById('statsGrid');
  if (!statsGrid) return;
  statsGrid.innerHTML = '<div style="color:var(--gray-400);padding:8px">Se încarcă...</div>';
  try {
    const [allProps, projects, leads] = await Promise.all([
      getAllPropertiesAdmin(),
      getAllProjectsAdmin(),
      getAllLeads()
    ]);
    allPropsCache = allProps;
    allProjectsCache = projects;
    allLeadsCache = leads;

    const counts = {
      rezidential: allProps.filter(p => p.categorie === 'rezidential' && p.activ !== false).length,
      comercial: allProps.filter(p => p.categorie === 'comercial' && p.activ !== false).length,
      terenuri: allProps.filter(p => p.categorie === 'terenuri' && p.activ !== false).length,
      proiecte: projects.filter(p => p.activ !== false).length,
      leadsNoi: leads.filter(l => l.status === 'nou').length
    };

    const stats = [
      { cat: 'rezidential', icon: 'fa-home', label: 'Rezidențial', count: counts.rezidential },
      { cat: 'comercial', icon: 'fa-building', label: 'Comercial', count: counts.comercial },
      { cat: 'terenuri', icon: 'fa-map', label: 'Terenuri', count: counts.terenuri },
      { cat: 'proiecte', icon: 'fa-city', label: 'Proiecte noi', count: counts.proiecte },
      { cat: 'leads', icon: 'fa-envelope', label: 'Cereri noi', count: counts.leadsNoi }
    ];
    statsGrid.innerHTML = stats.map(s => `
      <div class="stat-card ${s.cat}">
        <div class="stat-icon"><i class="fa-solid ${s.icon}"></i></div>
        <div class="stat-num">${s.count}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    `).join('');

    // Update leads badge
    const badge = document.getElementById('leadsBadge');
    if (badge) {
      if (counts.leadsNoi > 0) {
        badge.style.display = 'inline-block';
        badge.textContent = `${counts.leadsNoi} ${counts.leadsNoi === 1 ? 'nou' : 'noi'}`;
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (err) {
    statsGrid.innerHTML = '<div style="color:#e84545;padding:8px">Eroare la încărcarea statisticilor</div>';
    console.error(err);
  }
}

// ---------- LEADS ----------

const LEAD_STATUS_LABELS = {
  'nou': 'Nou',
  'contactat': 'Contactat',
  'vizionare-programata': 'Vizionare programată',
  'oferta-trimisa': 'Ofertă trimisă',
  'inchis-castigat': 'Câștigat',
  'inchis-pierdut': 'Pierdut'
};

const LEAD_TIP_LABELS = {
  'contact': 'Contact',
  'vizionare': 'Vizionare',
  'oferta': 'Ofertă'
};

async function renderLeads() {
  const wrap = document.getElementById('leadsWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div style="padding:24px;color:var(--gray-400)"><i class="fa-solid fa-spinner fa-spin"></i> Se încarcă cererile...</div>';

  try {
    const statusFilter = document.getElementById('leadStatusFilter')?.value || '';
    const tipFilter = document.getElementById('leadTipFilter')?.value || '';
    const filter = {};
    if (statusFilter) filter.status = statusFilter;
    if (tipFilter) filter.tip = tipFilter;

    const leads = await getAllLeads(filter);
    allLeadsCache = leads;

    if (!leads.length) {
      wrap.innerHTML = '<div style="padding:32px;color:var(--gray-500);text-align:center;background:var(--gray-50);border-radius:8px">Nicio cerere cu aceste filtre.</div>';
      return;
    }

    wrap.innerHTML = `
      <table class="admin-table leads-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Nume</th>
            <th>Contact</th>
            <th>Tip</th>
            <th>Pentru</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${leads.map(l => {
            const date = new Date(l.created_at);
            const dateStr = date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' }) + ' · ' + date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
            const target = l.properties?.titlu || l.projects?.nume || '—';
            const isNew = l.status === 'nou';
            return `
              <tr class="${isNew ? 'lead-new' : ''}">
                <td><span style="font-size:12px;color:var(--gray-500)">${dateStr}</span></td>
                <td><strong>${escapeHtmlAdm(l.nume || '—')}</strong></td>
                <td>
                  <div style="font-size:13px">
                    ${l.email ? `<a href="mailto:${escapeHtmlAdm(l.email)}" style="color:var(--navy)">${escapeHtmlAdm(l.email)}</a>` : ''}
                    ${l.telefon ? `<br><a href="tel:${escapeHtmlAdm(l.telefon)}" style="color:var(--gray-600)">${escapeHtmlAdm(l.telefon)}</a>` : ''}
                  </div>
                </td>
                <td><span class="lead-tip lead-tip-${l.tip}">${LEAD_TIP_LABELS[l.tip] || l.tip}</span></td>
                <td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px">${escapeHtmlAdm(target)}</td>
                <td>
                  <select onchange="setLeadStatus('${l.id}', this.value)" class="lead-status-select status-${l.status}">
                    ${Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => `<option value="${k}" ${k === l.status ? 'selected' : ''}>${v}</option>`).join('')}
                  </select>
                </td>
                <td>
                  <div class="table-actions">
                    <span class="icon-btn" onclick="openLeadDetail('${l.id}')" title="Vezi detalii"><i class="fa-solid fa-eye"></i></span>
                    <span class="icon-btn danger" onclick="confirmDeleteLead('${l.id}')" title="Șterge"><i class="fa-solid fa-trash"></i></span>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    wrap.innerHTML = '<div style="padding:24px;color:#e84545">Eroare la încărcarea cererilor: ' + escapeHtmlAdm(err.message) + '</div>';
    console.error(err);
  }
}

async function setLeadStatus(id, status) {
  try {
    await updateLeadStatus(id, status);
    showToast('Status actualizat.');
    refreshStats();
  } catch (err) {
    alert('Eroare: ' + err.message);
  }
}

async function confirmDeleteLead(id) {
  if (!confirm('Ștergi definitiv această cerere?')) return;
  try {
    await deleteLead(id);
    showToast('Cerere ștearsă.');
    await renderLeads();
    await refreshStats();
  } catch (err) {
    alert('Eroare: ' + err.message);
  }
}

function openLeadDetail(id) {
  const lead = allLeadsCache.find(l => String(l.id) === String(id));
  if (!lead) return;
  const date = new Date(lead.created_at);
  const target = lead.properties?.titlu || lead.projects?.nume || '—';
  const targetCat = lead.properties?.categorie ? `(${lead.properties.categorie})` : '';
  const body = document.getElementById('leadDetailBody');
  body.innerHTML = `
    <div class="lead-detail">
      <div class="lead-detail-row">
        <span class="lead-detail-label">Data primirii</span>
        <span class="lead-detail-val">${date.toLocaleString('ro-RO')}</span>
      </div>
      <div class="lead-detail-row">
        <span class="lead-detail-label">Tip</span>
        <span class="lead-detail-val"><span class="lead-tip lead-tip-${lead.tip}">${LEAD_TIP_LABELS[lead.tip] || lead.tip}</span></span>
      </div>
      <div class="lead-detail-row">
        <span class="lead-detail-label">Sursă</span>
        <span class="lead-detail-val">${escapeHtmlAdm(lead.sursa || 'website')}</span>
      </div>
      <div class="lead-detail-row">
        <span class="lead-detail-label">Nume</span>
        <span class="lead-detail-val">${escapeHtmlAdm(lead.nume || '—')}</span>
      </div>
      <div class="lead-detail-row">
        <span class="lead-detail-label">Email</span>
        <span class="lead-detail-val"><a href="mailto:${escapeHtmlAdm(lead.email || '')}">${escapeHtmlAdm(lead.email || '—')}</a></span>
      </div>
      <div class="lead-detail-row">
        <span class="lead-detail-label">Telefon</span>
        <span class="lead-detail-val">${lead.telefon ? `<a href="tel:${escapeHtmlAdm(lead.telefon)}">${escapeHtmlAdm(lead.telefon)}</a>` : '—'}</span>
      </div>
      ${target !== '—' ? `
      <div class="lead-detail-row">
        <span class="lead-detail-label">Pentru</span>
        <span class="lead-detail-val">${escapeHtmlAdm(target)} ${targetCat}</span>
      </div>` : ''}
      <div class="lead-detail-row" style="flex-direction:column;align-items:flex-start;gap:8px">
        <span class="lead-detail-label">Mesaj</span>
        <div style="font-size:14px;line-height:1.6;color:var(--gray-700);background:var(--gray-50);padding:14px;border-radius:6px;width:100%;white-space:pre-wrap">${escapeHtmlAdm(lead.mesaj || '')}</div>
      </div>
      <div class="lead-detail-row" style="flex-direction:column;align-items:flex-start;gap:8px;margin-top:12px">
        <span class="lead-detail-label">Notă internă</span>
        <textarea id="leadNoteInput" rows="3" style="width:100%;padding:10px;border:1px solid var(--gray-200);border-radius:6px;font-family:inherit">${escapeHtmlAdm(lead.note || '')}</textarea>
        <button class="btn btn-outline" type="button" onclick="saveLeadNote('${lead.id}')" style="align-self:flex-end">Salvează nota</button>
      </div>
      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap">
        ${lead.email ? `<a class="btn btn-primary" href="mailto:${escapeHtmlAdm(lead.email)}?subject=${encodeURIComponent('Răspuns EVEN — ' + (lead.tip || ''))}"><i class="fa-solid fa-reply"></i> Răspunde pe email</a>` : ''}
        ${lead.telefon ? `<a class="btn btn-outline" href="tel:${escapeHtmlAdm(lead.telefon)}"><i class="fa-solid fa-phone"></i> Sună</a>` : ''}
      </div>
    </div>
  `;
  document.getElementById('leadModal').classList.add('open');
  // Mark as contacted if was new
  if (lead.status === 'nou') {
    setTimeout(async () => {
      try {
        await updateLeadStatus(lead.id, 'contactat');
        lead.status = 'contactat';
        renderLeads();
        refreshStats();
      } catch (_) {}
    }, 1500);
  }
}

function closeLeadModal() {
  document.getElementById('leadModal').classList.remove('open');
}

async function saveLeadNote(id) {
  const note = document.getElementById('leadNoteInput').value;
  const lead = allLeadsCache.find(l => String(l.id) === String(id));
  try {
    await updateLeadStatus(id, lead.status, note);
    showToast('Notă salvată.');
  } catch (err) {
    alert('Eroare: ' + err.message);
  }
}

function escapeHtmlAdm(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

// ---------- TABS & PROPERTY TABLE (with filters) ----------

function renderAdminTabs() {
  const tabs = ['rezidential', 'comercial', 'terenuri'];
  document.getElementById('adminTabs').innerHTML = tabs.map(t => `
    <button class="admin-tab ${t === activeAdminTab ? 'active' : ''}" onclick="setAdminTab('${t}')">${capitalize(t)}</button>
  `).join('');
}

async function setAdminTab(t) {
  activeAdminTab = t;
  renderAdminTabs();
  await renderTable();
}

function resetPropFilters() {
  document.getElementById('propSearchInput').value = '';
  document.getElementById('propRegimFilter').value = '';
  document.getElementById('propActivFilter').value = 'active';
  document.getElementById('propSortBy').value = 'created_desc';
  renderTable();
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

// ---------- BANNER QR PANEL ----------

function bannerPageUrl() {
  const o = window.location.origin;
  const base = (o && o.startsWith('http')) ? o : 'https://even-imobiliare.ro';
  return base.replace(/\/$/, '') + '/banner';
}

async function renderBannerPanel() {
  const panel = document.getElementById('bannerPanel');
  if (!panel) return;

  let props = allPropsCache;
  if (!props || !props.length) {
    try { props = await getAllPropertiesAdmin(); allPropsCache = props; }
    catch { props = []; }
  }
  const current = props.find(p => p.banner === true && p.activ !== false);
  const url = bannerPageUrl();

  const urlRow = `
    <div class="banner-url-row">
      <span class="banner-url-label">Link fix al codului QR</span>
      <code class="banner-url">${escapeHtmlAdm(url)}</code>
      <span class="banner-url-hint">Codul QR tipărit nu se schimbă niciodată — doar proprietatea de mai jos.</span>
    </div>`;

  if (!current) {
    panel.innerHTML = `
      <div class="banner-empty">
        <i class="fa-solid fa-circle-info"></i>
        <div>
          <strong>Nicio proprietate pe banner momentan.</strong>
          <span>Apasă pe iconița <i class="fa-solid fa-qrcode"></i> din dreptul unei proprietăți active, mai jos, ca să o pui pe banner.</span>
        </div>
      </div>
      ${urlRow}`;
    return;
  }

  const thumb = (current.imagini && current.imagini[0])
    ? `<img src="${escapeHtmlAdm(current.imagini[0])}" alt="">`
    : `<div class="banner-thumb-empty"><i class="fa-solid fa-image"></i></div>`;
  const pretTxt = current.pret != null
    ? formatPrice(current.pret)
    : (current.pretTotal != null ? formatPrice(current.pretTotal) : 'Preț la cerere');

  panel.innerHTML = `
    <div class="banner-current">
      <div class="banner-thumb">${thumb}</div>
      <div class="banner-current-info">
        <span class="banner-tag"><i class="fa-solid fa-circle" style="font-size:7px"></i> Activă pe banner</span>
        <strong>${escapeHtmlAdm(current.titlu || '(fără titlu)')}</strong>
        <span class="banner-meta">${escapeHtmlAdm(categoryLabelAdm(current.categorie))} · ${escapeHtmlAdm(current.oras || current.localitate || current.judet || '')} · ${pretTxt}</span>
      </div>
      <div class="banner-current-actions">
        <a class="btn btn-outline btn-sm" href="property-${current.categorie === 'terenuri' ? 'teren' : current.categorie}.html?id=${encodeURIComponent(current.id)}" target="_blank" rel="noopener">Vezi</a>
        <button class="btn btn-outline btn-sm" onclick="toggleBanner('${current.id}', true)">Scoate de pe banner</button>
      </div>
    </div>
    ${urlRow}`;
}

function categoryLabelAdm(cat) {
  return { rezidential: 'Rezidențial', comercial: 'Comercial', terenuri: 'Teren' }[cat] || cat || '';
}

async function toggleBanner(id, isCurrentlyOn) {
  try {
    await setBannerProperty(isCurrentlyOn ? null : id);
    showToast(isCurrentlyOn ? 'Proprietate scoasă de pe banner.' : 'Proprietate pusă pe banner.');
    allPropsCache = await getAllPropertiesAdmin();
    await renderTable();
    renderBannerPanel();
  } catch (err) {
    alert('Eroare: ' + err.message);
  }
}

async function renderTable() {
  const wrap = document.getElementById('tableWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div style="padding:24px;color:var(--gray-400)"><i class="fa-solid fa-spinner fa-spin"></i> Se încarcă...</div>';

  try {
    let data = await getProperties(activeAdminTab);
    // Always include archived if filter says so — getProperties only returns active
    if (document.getElementById('propActivFilter')?.value !== 'active') {
      const allRows = (allPropsCache.length ? allPropsCache : await getAllPropertiesAdmin())
        .filter(p => p.categorie === activeAdminTab);
      const filterMode = document.getElementById('propActivFilter').value;
      if (filterMode === 'inactive') {
        data = allRows.filter(p => p.activ === false);
      } else if (filterMode === 'all') {
        data = allRows;
      }
    }

    // Apply text search
    const q = (document.getElementById('propSearchInput')?.value || '').toLowerCase().trim();
    if (q) {
      data = data.filter(p =>
        (p.titlu || '').toLowerCase().includes(q) ||
        (p.oras || '').toLowerCase().includes(q) ||
        (p.cartier || '').toLowerCase().includes(q) ||
        (p.judet || '').toLowerCase().includes(q) ||
        (p.localitate || '').toLowerCase().includes(q) ||
        String(p.id || '').toLowerCase().includes(q)
      );
    }

    // Regim filter
    const regimFilter = document.getElementById('propRegimFilter')?.value;
    if (regimFilter && activeAdminTab !== 'terenuri') {
      data = data.filter(p => p.regim === regimFilter);
    }

    // Sort
    const sortBy = document.getElementById('propSortBy')?.value || 'created_desc';
    data = sortPropsAdmin(data, sortBy);

    if (!data.length) {
      wrap.innerHTML = '<div style="padding:32px;color:var(--gray-500);text-align:center;background:var(--gray-50);border-radius:8px">Nicio proprietate cu aceste filtre.</div>';
      return;
    }

    let columns;
    if (activeAdminTab === 'rezidential') {
      columns = [
        { key: 'titlu', label: 'Titlu' },
        { key: 'tip', label: 'Tip' },
        { key: 'regim', label: 'Regim', render: v => v ? `<span class="badge badge-${v}">${v}</span>` : '-' },
        { key: 'oras', label: 'Oraș' },
        { key: 'camere', label: 'Cam.' },
        { key: 'pret', label: 'Preț', render: v => v ? formatPrice(v) : '-' }
      ];
    } else if (activeAdminTab === 'comercial') {
      columns = [
        { key: 'titlu', label: 'Titlu' },
        { key: 'tipSpatiu', label: 'Tip spațiu' },
        { key: 'clasaCladire', label: 'Clasă' },
        { key: 'oras', label: 'Oraș' },
        { key: 'suprafataTotala', label: 'mp', render: v => v ? v + ' mp' : '-' },
        { key: 'pret', label: 'Preț', render: (v, r) => v ? `${v} €/mp/lună` : (r.pretTotal ? formatPrice(r.pretTotal) : '-') }
      ];
    } else {
      columns = [
        { key: 'titlu', label: 'Titlu' },
        { key: 'tip', label: 'Tip' },
        { key: 'judet', label: 'Județ' },
        { key: 'suprafata', label: 'Suprafață', render: (v, r) => v ? `${v} ${r.unitate || 'mp'}` : '-' },
        { key: 'pretTotal', label: 'Preț', render: v => v ? formatPrice(v) : '-' }
      ];
    }

    wrap.innerHTML = `
      <div style="margin-bottom:8px;font-size:13px;color:var(--gray-500)">${data.length} ${data.length === 1 ? 'proprietate' : 'proprietăți'}</div>
      <table class="admin-table">
        <thead>
          <tr>
            ${columns.map(c => `<th>${c.label}</th>`).join('')}
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr style="${row.activ === false ? 'opacity:0.5' : ''}">
              ${columns.map(c => `<td>${c.render ? c.render(row[c.key], row) : (row[c.key] ?? '-')}</td>`).join('')}
              <td>${row.activ === false ? '<span style="color:#999;font-size:12px">arhivat</span>' : '<span style="color:var(--success);font-size:12px">activ</span>'}</td>
              <td>
                <div class="table-actions">
                  ${row.activ === false
                    ? ''
                    : `<span class="icon-btn icon-btn-banner${row.banner ? ' is-on' : ''}" onclick="toggleBanner('${row.id}', ${row.banner ? 'true' : 'false'})" title="${row.banner ? 'Pe banner acum · click pentru a scoate' : 'Pune pe bannerul QR'}"><i class="fa-solid fa-qrcode"></i></span>`}
                  <span class="icon-btn" onclick="editProperty('${row.id}', '${activeAdminTab}')" title="Editează"><i class="fa-solid fa-pen"></i></span>
                  ${row.activ === false
                    ? `<span class="icon-btn" onclick="restoreProperty('${row.id}')" title="Restaurează"><i class="fa-solid fa-rotate-left"></i></span>`
                    : `<span class="icon-btn danger" onclick="confirmDeleteProperty('${row.id}')" title="Arhivează"><i class="fa-solid fa-trash"></i></span>`}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    wrap.innerHTML = '<div style="padding:24px;color:#e84545">Eroare la încărcarea datelor: ' + escapeHtmlAdm(err.message) + '</div>';
    console.error(err);
  }
}

function sortPropsAdmin(arr, mode) {
  const copy = [...arr];
  switch (mode) {
    case 'created_desc': return copy.sort((a, b) => String(b.id).localeCompare(String(a.id)));
    case 'created_asc':  return copy.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    case 'pret_desc':    return copy.sort((a, b) => (b.pret ?? b.pretTotal ?? 0) - (a.pret ?? a.pretTotal ?? 0));
    case 'pret_asc':     return copy.sort((a, b) => (a.pret ?? a.pretTotal ?? 0) - (b.pret ?? b.pretTotal ?? 0));
    case 'titlu_asc':    return copy.sort((a, b) => (a.titlu || '').localeCompare(b.titlu || ''));
    default: return copy;
  }
}

async function restoreProperty(id) {
  try {
    await _supabase.from('properties').update({ activ: true }).eq('id', id);
    showToast('Proprietate reactivată.');
    await refreshStats();
    await renderTable();
  } catch (err) {
    alert('Eroare: ' + err.message);
  }
}

async function confirmDeleteProperty(id) {
  if (!confirm(`Arhivezi proprietatea ${id}? Va fi ascunsă din listinguri (poate fi restaurată).`)) return;
  try {
    await deleteProperty(id);
    showToast('Proprietate arhivată.');
    await refreshStats();
    await renderTable();
  } catch (err) {
    alert('Eroare la ștergere: ' + err.message);
  }
}

async function editProperty(id, cat) {
  try {
    const p = await getPropertyById(id, cat);
    if (!p) { alert('Proprietatea nu a fost găsită'); return; }
    editingProperty = p;
    existingImages = Array.isArray(p.imagini) ? [...p.imagini] : [];
    document.querySelector('#addModal h2').textContent = 'Editează proprietatea';
    document.querySelector('#addModal .cat-selector').style.display = 'none';
    document.getElementById('addModal').classList.add('open');
    setFormCategory(cat);
  } catch (err) {
    alert('Eroare la încărcare: ' + err.message);
  }
}

// ---------- AGENTS TABLE ----------

async function renderAgentsTable() {
  const wrap = document.getElementById('agentsWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div style="padding:24px;color:var(--gray-400)"><i class="fa-solid fa-spinner fa-spin"></i> Se încarcă...</div>';
  try {
    const agents = await getAgents();
    allAgentsCache = agents;
    if (!agents.length) {
      wrap.innerHTML = '<div style="padding:24px;color:var(--gray-500);text-align:center;background:var(--gray-50);border-radius:8px">Nici un agent înregistrat. Adaugă primul agent.</div>';
      return;
    }
    wrap.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr><th>Nume</th><th>Rol</th><th>Email</th><th>Telefon</th><th>Vândute</th><th></th></tr>
        </thead>
        <tbody>
          ${agents.map(a => `
            <tr>
              <td><strong>${escapeHtmlAdm(a.nume)}</strong></td>
              <td>${escapeHtmlAdm(a.rol || '—')}</td>
              <td><a href="mailto:${escapeHtmlAdm(a.email || '')}">${escapeHtmlAdm(a.email || '—')}</a></td>
              <td><a href="tel:${escapeHtmlAdm(a.telefon || '')}">${escapeHtmlAdm(a.telefon || '—')}</a></td>
              <td>${a.proprietatiVandute || 0}</td>
              <td>
                <div class="table-actions">
                  <span class="icon-btn" onclick='openAgentModal(${JSON.stringify(a).replace(/'/g, "&#39;")})' title="Editează"><i class="fa-solid fa-pen"></i></span>
                  <span class="icon-btn danger" onclick="confirmDeleteAgent('${a.id}')" title="Șterge"><i class="fa-solid fa-trash"></i></span>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    wrap.innerHTML = '<div style="padding:24px;color:#e84545">Eroare: ' + escapeHtmlAdm(err.message) + '</div>';
    console.error(err);
  }
}

function openAgentModal(agent = null) {
  editingAgent = agent;
  document.getElementById('agentModalTitle').textContent = agent ? 'Editează agent' : 'Adaugă agent';
  const a = agent || {};
  document.getElementById('agentForm').innerHTML = `
    <div class="form-grid">
      <div class="form-group full"><label>Nume complet *</label><input type="text" name="nume" required value="${escapeHtmlAdm(a.nume || '')}" placeholder="ex: Ilan Eibenschutz"></div>
      <div class="form-group"><label>Rol</label><input type="text" name="rol" value="${escapeHtmlAdm(a.rol || '')}" placeholder="Fondator · Agent imobiliar"></div>
      <div class="form-group"><label>Email *</label><input type="email" name="email" required value="${escapeHtmlAdm(a.email || '')}" placeholder="ilan@even-imobiliare.ro"></div>
      <div class="form-group"><label>Telefon</label><input type="tel" name="telefon" value="${escapeHtmlAdm(a.telefon || '')}" placeholder="0745 609 366"></div>
      <div class="form-group"><label>Foto URL</label><input type="text" name="foto" value="${escapeHtmlAdm(a.foto || '')}" placeholder="https://..."></div>
      <div class="form-group"><label>Proprietăți vândute</label><input type="number" name="proprietatiVandute" value="${a.proprietatiVandute || 0}" min="0"></div>
      <div class="form-group"><label>Ani experiență</label><input type="number" name="ani" value="${a.ani || 0}" min="0"></div>
      <div class="form-group full"><label>Bio</label><textarea name="bio" rows="3" placeholder="Descriere scurtă...">${escapeHtmlAdm(a.bio || '')}</textarea></div>
    </div>
  `;
  document.getElementById('agentModal').classList.add('open');
}

function closeAgentModal() {
  document.getElementById('agentModal').classList.remove('open');
  editingAgent = null;
}

async function submitAgent(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Se salvează...';

  const formData = {};
  form.querySelectorAll('[name]').forEach(el => {
    if (el.value) formData[el.name] = el.type === 'number' ? +el.value : el.value;
  });
  formData.id = editingAgent?.id || `ag-${Date.now()}`;
  // Map camelCase → snake_case for DB
  const dbData = {
    id: formData.id,
    nume: formData.nume,
    rol: formData.rol || null,
    email: formData.email,
    telefon: formData.telefon || null,
    foto: formData.foto || null,
    bio: formData.bio || null,
    proprietati_vandute: formData.proprietatiVandute || 0,
    ani: formData.ani || 0
  };

  try {
    await upsertAgent(dbData);
    closeAgentModal();
    showToast(editingAgent ? 'Agent actualizat.' : 'Agent adăugat.');
    await renderAgentsTable();
  } catch (err) {
    alert('Eroare: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvează agentul';
  }
}

async function confirmDeleteAgent(id) {
  if (!confirm(`Ștergi acest agent? Proprietățile asignate vor rămâne fără agent.`)) return;
  try {
    await deleteAgent(id);
    showToast('Agent șters.');
    await renderAgentsTable();
  } catch (err) {
    alert('Eroare: ' + err.message);
  }
}

// ---------- PROJECTS TABLE ----------

async function renderProjectsTable() {
  const wrap = document.getElementById('projectsAdminWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div style="padding:24px;color:var(--gray-400)"><i class="fa-solid fa-spinner fa-spin"></i> Se încarcă...</div>';
  try {
    const projects = await getAllProjectsAdmin();
    allProjectsCache = projects;

    const q = (document.getElementById('projSearchInput')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('projStatusFilter')?.value || '';

    let data = projects;
    if (q) {
      data = data.filter(p =>
        (p.nume || '').toLowerCase().includes(q) ||
        (p.oras || '').toLowerCase().includes(q) ||
        (p.dezvoltator || '').toLowerCase().includes(q) ||
        String(p.id || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter) data = data.filter(p => p.status === statusFilter);

    if (!data.length) {
      wrap.innerHTML = '<div style="padding:32px;color:var(--gray-500);text-align:center;background:var(--gray-50);border-radius:8px">Nici un proiect cu aceste filtre.</div>';
      return;
    }

    wrap.innerHTML = `
      <div style="margin-bottom:8px;font-size:13px;color:var(--gray-500)">${data.length} ${data.length === 1 ? 'proiect' : 'proiecte'}</div>
      <table class="admin-table">
        <thead>
          <tr><th>Nume</th><th>Dezvoltator</th><th>Oraș</th><th>Status</th><th>Progres</th><th>Unit. disp.</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          ${data.map(p => `
            <tr style="${p.activ === false ? 'opacity:0.5' : ''}">
              <td><strong>${escapeHtmlAdm(p.nume)}</strong></td>
              <td>${escapeHtmlAdm(p.dezvoltator || '—')}</td>
              <td>${escapeHtmlAdm(p.oras || '—')}</td>
              <td>${escapeHtmlAdm(formatProjStatus(p.status))}</td>
              <td>${p.progres || 0}%</td>
              <td>${p.unitati_disponibile || 0}/${p.unitati_total || 0}</td>
              <td>${p.activ === false ? '<span style="color:#999;font-size:12px">arhivat</span>' : '<span style="color:var(--success);font-size:12px">activ</span>'}</td>
              <td>
                <div class="table-actions">
                  <span class="icon-btn" onclick="editProject('${p.id}')" title="Editează"><i class="fa-solid fa-pen"></i></span>
                  ${p.activ === false
                    ? `<span class="icon-btn" onclick="restoreProject('${p.id}')" title="Restaurează"><i class="fa-solid fa-rotate-left"></i></span>`
                    : `<span class="icon-btn danger" onclick="confirmDeleteProject('${p.id}')" title="Arhivează"><i class="fa-solid fa-trash"></i></span>`}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    wrap.innerHTML = '<div style="padding:24px;color:#e84545">Eroare: ' + escapeHtmlAdm(err.message) + '</div>';
    console.error(err);
  }
}

function formatProjStatus(s) {
  return ({ 'pre-vanzare': 'Pre-vânzare', 'construire': 'În construcție', 'finalizat': 'Finalizat' })[s] || s;
}

async function editProject(id) {
  try {
    const p = await getProjectByIdAdmin(id);
    if (!p) { alert('Proiectul nu a fost găsit'); return; }
    editingProject = p;
    openProjectModal(p);
  } catch (err) {
    alert('Eroare: ' + err.message);
  }
}

function openProjectModal(project = null) {
  editingProject = project;
  document.getElementById('projectModalTitle').textContent = project ? 'Editează proiect' : 'Adaugă proiect rezidențial';
  const p = project || {};
  document.getElementById('projectForm').innerHTML = `
    <div class="form-grid">
      <div class="form-group full"><label>Nume proiect *</label><input type="text" name="nume" required value="${escapeHtmlAdm(p.nume || '')}" placeholder="ex: Aurelia Residence"></div>
      <div class="form-group"><label>Dezvoltator</label><input type="text" name="dezvoltator" value="${escapeHtmlAdm(p.dezvoltator || '')}"></div>
      <div class="form-group"><label>Oraș</label><input type="text" name="oras" value="${escapeHtmlAdm(p.oras || '')}"></div>
      <div class="form-group"><label>Cartier</label><input type="text" name="cartier" value="${escapeHtmlAdm(p.cartier || '')}"></div>
      <div class="form-group full"><label>Adresă</label><input type="text" name="adresa" value="${escapeHtmlAdm(p.adresa || '')}"></div>
      <div class="form-group">
        <label>Status</label>
        <select name="status">
          <option value="pre-vanzare" ${p.status === 'pre-vanzare' ? 'selected' : ''}>Pre-vânzare</option>
          <option value="construire" ${p.status === 'construire' ? 'selected' : ''}>În construcție</option>
          <option value="finalizat" ${p.status === 'finalizat' ? 'selected' : ''}>Finalizat</option>
        </select>
      </div>
      <div class="form-group"><label>Data livrare</label><input type="date" name="data_livrare" value="${p.data_livrare ? p.data_livrare.split('T')[0] : ''}"></div>
      <div class="form-group"><label>Progres (%)</label><input type="number" name="progres" min="0" max="100" value="${p.progres || 0}"></div>
      <div class="form-group"><label>Preț min (€)</label><input type="number" name="interval_pret_min" value="${p.interval_pret_min || ''}"></div>
      <div class="form-group"><label>Preț max (€)</label><input type="number" name="interval_pret_max" value="${p.interval_pret_max || ''}"></div>
      <div class="form-group"><label>Unități total</label><input type="number" name="unitati_total" value="${p.unitati_total || 0}"></div>
      <div class="form-group"><label>Unități disponibile</label><input type="number" name="unitati_disponibile" value="${p.unitati_disponibile || 0}"></div>
      <div class="form-group full"><label>Tipuri unități (separate cu virgulă)</label><input type="text" name="tipuri_unitati" value="${(p.tipuri_unitati || []).join(', ')}" placeholder="Studio, 2 camere, 3 camere, Penthouse"></div>
      <div class="form-group full"><label>Facilități (separate cu virgulă)</label><input type="text" name="facilitati" value="${(p.facilitati || []).join(', ')}" placeholder="Parc privat, securitate 24/7, parcare subterană"></div>
      <div class="form-group full"><label>Imagini URL (separate cu virgulă)</label><textarea name="imagini" rows="2" placeholder="https://..., https://...">${(p.imagini || []).join(', ')}</textarea></div>
      <div class="form-group full"><label>Descriere</label><textarea name="descriere" rows="4">${escapeHtmlAdm(p.descriere || '')}</textarea></div>
    </div>
  `;
  document.getElementById('projectModal').classList.add('open');
}

function closeProjectModal() {
  document.getElementById('projectModal').classList.remove('open');
  editingProject = null;
}

async function submitProject(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Se salvează...';

  const formData = {};
  form.querySelectorAll('[name]').forEach(el => {
    if (el.value !== '') formData[el.name] = el.type === 'number' ? +el.value : el.value;
  });

  // Convert CSV fields to arrays
  if (formData.tipuri_unitati) formData.tipuri_unitati = formData.tipuri_unitati.split(',').map(s => s.trim()).filter(Boolean);
  if (formData.facilitati) formData.facilitati = formData.facilitati.split(',').map(s => s.trim()).filter(Boolean);
  if (formData.imagini) formData.imagini = formData.imagini.split(',').map(s => s.trim()).filter(Boolean);

  formData.id = editingProject?.id || `proj-${Date.now()}`;
  formData.activ = true;

  try {
    await upsertProject(formData);
    closeProjectModal();
    showToast(editingProject ? 'Proiect actualizat.' : 'Proiect adăugat.');
    await refreshStats();
    await renderProjectsTable();
  } catch (err) {
    alert('Eroare: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvează proiectul';
  }
}

async function confirmDeleteProject(id) {
  if (!confirm('Arhivezi acest proiect?')) return;
  try {
    await deleteProject(id);
    showToast('Proiect arhivat.');
    await refreshStats();
    await renderProjectsTable();
  } catch (err) {
    alert('Eroare: ' + err.message);
  }
}

async function restoreProject(id) {
  try {
    await _supabase.from('projects').update({ activ: true }).eq('id', id);
    showToast('Proiect reactivat.');
    await refreshStats();
    await renderProjectsTable();
  } catch (err) {
    alert('Eroare: ' + err.message);
  }
}

// ---------- MODAL ADD PROPERTY (existing flow) ----------
function openAddModal() {
  editingProperty = null;
  existingImages = [];
  document.querySelector('#addModal h2').textContent = 'Adaugă proprietate nouă';
  document.querySelector('#addModal .cat-selector').style.display = '';
  document.getElementById('addModal').classList.add('open');
  setFormCategory('rezidential');
}
function closeAddModal() {
  document.getElementById('addModal').classList.remove('open');
  editingProperty = null;
  existingImages = [];
}

function setFormCategory(cat) {
  activeFormCategory = cat;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.toggle('active', p.dataset.cat === cat));
  renderDynamicForm();
}

function renderDynamicForm() {
  const wrap = document.getElementById('dynamicForm');
  if (activeFormCategory === 'rezidential') {
    wrap.innerHTML = `
      <div class="form-grid">
        <div class="form-group full"><label>Titlu anunț</label><input type="text" name="titlu" placeholder="ex: Apartament 3 camere Herăstrău"></div>
        <div class="form-group">
          <label>Regim</label>
          <select name="regim"><option value="vanzare">Vânzare</option><option value="inchiriere">Închiriere</option></select>
        </div>
        <div class="form-group">
          <label>Tip imobil</label>
          <select name="tip"><option value="apartament">Apartament</option><option value="casa">Casă</option><option value="vila">Vilă</option><option value="duplex">Duplex</option></select>
        </div>
        <div class="form-group"><label>Camere</label><input type="number" name="camere" min="1"></div>
        <div class="form-group"><label>Suprafață utilă (mp)</label><input type="number" name="suprafata"></div>
        <div class="form-group"><label>Etaj</label><input type="number" name="etaj"></div>
        <div class="form-group"><label>Etaj total</label><input type="number" name="etajTotal"></div>
        <div class="form-group"><label>An construcție</label><input type="number" name="anConstructie" min="1900"></div>
        <div class="form-group">
          <label>Orientare</label>
          <select name="orientare"><option>Sud</option><option>Sud-Est</option><option>Sud-Vest</option><option>Est</option><option>Vest</option><option>Nord</option></select>
        </div>
        <div class="form-group"><label>Preț (€)</label><input type="number" name="pret"></div>
        <div class="form-group"><label>Oraș</label><input type="text" name="oras"></div>
        <div class="form-group"><label>Cartier</label><input type="text" name="cartier"></div>
        <div class="form-group full"><label>Adresă</label><input type="text" name="adresa"></div>
        <div class="form-group full"><label>Agent asignat (ID)</label>${agentSelector()}</div>
        <div class="form-group full"><label>Descriere</label><textarea name="descriere"></textarea></div>
        ${imageUploadBlock()}
      </div>
    `;
  } else if (activeFormCategory === 'comercial') {
    wrap.innerHTML = `
      <div class="form-grid">
        <div class="form-group full"><label>Titlu anunț</label><input type="text" name="titlu" placeholder="ex: Spațiu birouri clasa A Pipera"></div>
        <div class="form-group">
          <label>Regim</label>
          <select name="regim"><option value="inchiriere">Închiriere</option><option value="vanzare">Vânzare</option></select>
        </div>
        <div class="form-group">
          <label>Tip spațiu</label>
          <select name="tipSpatiu"><option value="birouri">Birouri</option><option value="retail">Retail</option><option value="depozit">Depozit</option><option value="industrial">Industrial</option><option value="showroom">Showroom</option></select>
        </div>
        <div class="form-group"><label>Suprafață totală (mp)</label><input type="number" name="suprafataTotala"></div>
        <div class="form-group"><label>Suprafață utilă (mp)</label><input type="number" name="suprafataUtila"></div>
        <div class="form-group"><label>Etaj</label><input type="number" name="etaj"></div>
        <div class="form-group"><label>Locuri parcare</label><input type="number" name="locuriParcare"></div>
        <div class="form-group"><label>Înălțime liberă (m)</label><input type="number" step="0.1" name="inaltimeLibera"></div>
        <div class="form-group">
          <label>Clasă clădire</label>
          <select name="clasaCladire"><option>A</option><option>B</option><option>C</option></select>
        </div>
        <div class="form-group"><label>Preț €/mp/lună (chirie)</label><input type="number" name="pret"></div>
        <div class="form-group"><label>Preț total € (vânzare)</label><input type="number" name="pretTotal"></div>
        <div class="form-group"><label>Oraș</label><input type="text" name="oras"></div>
        <div class="form-group"><label>Cartier</label><input type="text" name="cartier"></div>
        <div class="form-group full"><label>Adresă</label><input type="text" name="adresa"></div>
        <div class="form-group full"><label>Agent asignat</label>${agentSelector()}</div>
        <div class="form-group full"><label>Descriere</label><textarea name="descriere"></textarea></div>
        ${imageUploadBlock()}
      </div>
    `;
  } else if (activeFormCategory === 'terenuri') {
    wrap.innerHTML = `
      <div class="form-grid">
        <div class="form-group full"><label>Titlu anunț</label><input type="text" name="titlu" placeholder="ex: Teren intravilan Corbeanca"></div>
        <div class="form-group">
          <label>Tip teren</label>
          <select name="tip">
            <option value="intravilan-rezidential">Intravilan rezidențial</option>
            <option value="intravilan-comercial">Intravilan comercial</option>
            <option value="extravilan-agricol">Extravilan agricol</option>
            <option value="industrial">Industrial</option>
          </select>
        </div>
        <div class="form-group">
          <label>Unitate</label>
          <select name="unitate"><option value="mp">mp</option><option value="ha">ha</option></select>
        </div>
        <div class="form-group"><label>Suprafață</label><input type="number" name="suprafata"></div>
        <div class="form-group"><label>Front stradal (ml)</label><input type="number" name="frontStradal"></div>
        <div class="form-group">
          <label>Acces drum</label>
          <select name="accesDrum"><option value="asfaltat">Asfaltat</option><option value="pietruit">Pietruit</option><option value="camp">Câmp</option></select>
        </div>
        <div class="form-group"><label>Zonare PUG</label><input type="text" name="zonarePUG" placeholder="ex: L1a, M3"></div>
        <div class="form-group"><label>CUT</label><input type="number" step="0.1" name="CUT"></div>
        <div class="form-group"><label>POT (%)</label><input type="number" name="POT"></div>
        <div class="form-group"><label>Județ</label><input type="text" name="judet"></div>
        <div class="form-group"><label>Localitate</label><input type="text" name="localitate"></div>
        <div class="form-group"><label>Preț total (€)</label><input type="number" name="pretTotal"></div>
        <div class="form-group full"><label>Adresă</label><input type="text" name="adresa"></div>
        <div class="form-group full"><label>Agent asignat</label>${agentSelector()}</div>
        <div class="form-group full"><label>Vecinătăți & descriere</label><textarea name="descriere"></textarea></div>
        ${imageUploadBlock()}
      </div>
    `;
  }
  hydrateFormValues();
  renderImaginiPreview();
}

function agentSelector() {
  const agents = allAgentsCache;
  if (!agents.length) return '<select name="agentId"><option value="">— niciun agent —</option></select>';
  return `<select name="agentId"><option value="">— niciun agent —</option>${agents.map(a => `<option value="${a.id}">${escapeHtmlAdm(a.nume)}</option>`).join('')}</select>`;
}

function imageUploadBlock() {
  return `
    <div class="form-group full">
      <label>Imagini</label>
      <input type="file" name="imaginiFiles" multiple accept="image/*">
      <div id="imaginiPreview" class="imagini-preview"></div>
    </div>
  `;
}

function renderImaginiPreview() {
  const wrap = document.getElementById('imaginiPreview');
  if (!wrap) return;
  if (!existingImages.length) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = existingImages.map((url, i) => `
    <div class="img-thumb">
      <img src="${url}" alt="">
      <button type="button" class="img-thumb-x" onclick="removeExistingImage(${i})" title="Șterge"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `).join('');
}

async function removeExistingImage(idx) {
  const url = existingImages[idx];
  if (!url) return;
  if (!confirm('Ștergi această imagine?')) return;
  try {
    await deletePropertyImage(url);
    existingImages.splice(idx, 1);
    renderImaginiPreview();
  } catch (err) {
    alert('Eroare la ștergere imagine: ' + err.message);
  }
}

function hydrateFormValues() {
  if (!editingProperty) return;
  const form = document.getElementById('dynamicForm');
  if (!form) return;
  Object.entries(editingProperty).forEach(([k, v]) => {
    const el = form.querySelector(`[name="${k}"]`);
    if (el && v != null && typeof v !== 'object') el.value = v;
  });
  // Agent
  if (editingProperty.agentId) {
    const sel = form.querySelector('[name="agentId"]');
    if (sel) sel.value = editingProperty.agentId;
  }
}

async function submitNewProperty(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Se salvează...';

  const formData = {};
  e.target.querySelectorAll('[name]').forEach(el => {
    if (el.name === 'imaginiFiles') return;
    if (el.value) formData[el.name] = el.type === 'number' ? +el.value : el.value;
  });
  const isEdit = !!editingProperty;
  formData.id = isEdit ? editingProperty.id : `${activeFormCategory.slice(0,3)}-${Date.now()}`;

  const fileInput = e.target.querySelector('input[name="imaginiFiles"]');
  const newFiles = fileInput && fileInput.files ? Array.from(fileInput.files) : [];

  try {
    let newUrls = [];
    if (newFiles.length) {
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Se încarcă imaginile...`;
      newUrls = await uploadPropertyImages(formData.id, newFiles);
    }
    formData.imagini = [...existingImages, ...newUrls];

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Se salvează...';
    await upsertProperty(activeFormCategory, formData);
    closeAddModal();
    showToast(isEdit
      ? `Proprietate actualizată!`
      : `Proprietate adăugată în ${capitalize(activeFormCategory)}!`);
    await refreshStats();
    await renderTable();
  } catch (err) {
    alert('Eroare la salvare: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvează proprietatea';
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.querySelector('.toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', async () => {
  const loggedIn = await checkLogin();
  if (loggedIn) {
    await showDashboard();
  } else {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
  }
});
