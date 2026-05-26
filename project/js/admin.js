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
let allBuyersCache = [];

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
    renderAgentsTable(),
    renderBuyersTable()
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

    const activeProps = allProps.filter(p => p.activ !== false);
    const counts = {
      rezidential: activeProps.filter(p => p.categorie === 'rezidential').length,
      comercial: activeProps.filter(p => p.categorie === 'comercial').length,
      terenuri: activeProps.filter(p => p.categorie === 'terenuri').length,
      proiecte: projects.filter(p => p.activ !== false).length,
      leadsNoi: leads.filter(l => l.status === 'nou').length
    };
    // Estimated portfolio value: sum of pret (rezidential vânzare) + pretTotal (comercial + terenuri).
    // Skip rentals (€/lună) and listings with no price.
    const totalValue = activeProps.reduce((sum, p) => {
      if (p.categorie === 'rezidential' && p.regim === 'vanzare') return sum + (+p.pret || 0);
      if (p.categorie === 'comercial' && p.regim === 'vanzare') return sum + (+p.pretTotal || +p.pret * (+p.suprafataTotala || 0) || 0);
      if (p.categorie === 'terenuri') return sum + (+p.pretTotal || 0);
      return sum;
    }, 0);

    const stats = [
      { cat: 'rezidential', icon: 'fa-home', label: 'Rezidențial', count: counts.rezidential },
      { cat: 'comercial', icon: 'fa-building', label: 'Comercial', count: counts.comercial },
      { cat: 'terenuri', icon: 'fa-map', label: 'Terenuri', count: counts.terenuri },
      { cat: 'proiecte', icon: 'fa-city', label: 'Proiecte noi', count: counts.proiecte },
      { cat: 'leads', icon: 'fa-envelope', label: 'Cereri noi', count: counts.leadsNoi },
      { cat: 'value', icon: 'fa-euro-sign', label: 'Valoare portofoliu (vânzare)', count: formatBigEur(totalValue) }
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
            <th style="width:36px"><input type="checkbox" id="leadSelectAll" onchange="toggleAllLeadSelection(this.checked)"></th>
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
            const wa = waPhone(l.telefon);
            return `
              <tr class="${isNew ? 'lead-new' : ''}">
                <td><input type="checkbox" class="lead-row-check" data-id="${l.id}" onchange="updateBulkBar()"></td>
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
                    ${wa ? `<a class="icon-btn icon-btn-wa" href="https://wa.me/${wa}" target="_blank" rel="noopener" title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>` : ''}
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
    updateBulkBar();
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
        ${waPhone(lead.telefon) ? `<a class="btn btn-outline" style="border-color:#25D366;color:#1c9e4a" href="https://wa.me/${waPhone(lead.telefon)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>` : ''}
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

// Compact EUR formatter (1.2M, 350K) for the dashboard stat card.
function formatBigEur(v) {
  const n = +v || 0;
  if (n >= 1e6) return '€' + (n / 1e6).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1e3) return '€' + Math.round(n / 1e3) + 'K';
  return '€' + n;
}

// Strip non-digits, prefix Romania country code if local format.
function waPhone(raw) {
  if (!raw) return '';
  let d = String(raw).replace(/\D/g, '');
  if (d.startsWith('0')) d = '40' + d.slice(1);
  return d;
}

// CSV helpers — RFC 4180 quoting with UTF-8 BOM so Excel opens it cleanly.
function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function downloadCsv(filename, rows) {
  const csv = '﻿' + rows.map(r => r.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
}

// Build a public URL for a listing (used by "copy link" action).
function publicPropertyUrl(prop) {
  const slug = prop.categorie === 'terenuri' ? 'teren' : prop.categorie;
  const o = window.location.origin && window.location.origin.startsWith('http')
    ? window.location.origin
    : 'https://www.even-imobiliare.ro';
  return `${o.replace(/\/$/, '')}/property-${slug}.html?id=${encodeURIComponent(prop.id)}`;
}

async function copyPropertyLink(id) {
  const prop = (allPropsCache || []).find(p => String(p.id) === String(id));
  if (!prop) return;
  const url = publicPropertyUrl(prop);
  try {
    await navigator.clipboard.writeText(url);
    showToast('Link copiat în clipboard.');
  } catch {
    prompt('Copiază manual linkul:', url);
  }
}

// ---------- LEADS — BULK ACTIONS & EXPORT ----------

function getSelectedLeadIds() {
  return Array.from(document.querySelectorAll('.lead-row-check:checked')).map(el => el.dataset.id);
}

function updateBulkBar() {
  const ids = getSelectedLeadIds();
  const bar = document.getElementById('leadsBulkBar');
  if (!bar) return;
  if (ids.length === 0) {
    bar.style.display = 'none';
  } else {
    bar.style.display = 'flex';
    document.getElementById('bulkSelectedCount').textContent = ids.length;
  }
  // Sync the master checkbox indeterminate state
  const all = document.querySelectorAll('.lead-row-check');
  const master = document.getElementById('leadSelectAll');
  if (master) {
    master.checked = all.length > 0 && ids.length === all.length;
    master.indeterminate = ids.length > 0 && ids.length < all.length;
  }
}

function toggleAllLeadSelection(on) {
  document.querySelectorAll('.lead-row-check').forEach(el => { el.checked = on; });
  updateBulkBar();
}

function clearLeadSelection() {
  document.querySelectorAll('.lead-row-check').forEach(el => { el.checked = false; });
  updateBulkBar();
}

async function applyBulkLeadStatus() {
  const status = document.getElementById('bulkStatusSelect').value;
  if (!status) { alert('Alege un status.'); return; }
  const ids = getSelectedLeadIds();
  if (!ids.length) return;
  if (!confirm(`Schimbi statusul a ${ids.length} cereri în "${LEAD_STATUS_LABELS[status]}"?`)) return;
  try {
    await Promise.all(ids.map(id => updateLeadStatus(id, status)));
    showToast(`${ids.length} cereri actualizate.`);
    await renderLeads();
    await refreshStats();
  } catch (err) {
    alert('Eroare: ' + err.message);
  }
}

async function bulkDeleteLeads() {
  const ids = getSelectedLeadIds();
  if (!ids.length) return;
  if (!confirm(`Ștergi definitiv ${ids.length} cereri? Acțiunea NU poate fi anulată.`)) return;
  try {
    await Promise.all(ids.map(id => deleteLead(id)));
    showToast(`${ids.length} cereri șterse.`);
    await renderLeads();
    await refreshStats();
  } catch (err) {
    alert('Eroare: ' + err.message);
  }
}

function exportLeadsCsv() {
  const leads = allLeadsCache || [];
  if (!leads.length) { alert('Nu există cereri de exportat cu filtrele curente.'); return; }
  const header = ['Data', 'Nume', 'Email', 'Telefon', 'Tip', 'Status', 'Sursă', 'Pentru', 'Mesaj', 'Notă internă'];
  const rows = [header, ...leads.map(l => [
    new Date(l.created_at).toLocaleString('ro-RO'),
    l.nume || '',
    l.email || '',
    l.telefon || '',
    LEAD_TIP_LABELS[l.tip] || l.tip || '',
    LEAD_STATUS_LABELS[l.status] || l.status || '',
    l.sursa || '',
    l.properties?.titlu || l.projects?.nume || '',
    l.mesaj || '',
    l.note || ''
  ])];
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCsv(`leads-even-${stamp}.csv`, rows);
  showToast(`${leads.length} cereri exportate.`);
}

function exportPropertiesCsv() {
  // Export the currently-rendered set (respects active tab + filters).
  // We reuse the same filter logic as renderTable via a tag we leave on tableWrap.
  const tbody = document.querySelector('#tableWrap tbody');
  if (!tbody) { alert('Nu există proprietăți de exportat.'); return; }
  const rowIds = Array.from(tbody.querySelectorAll('tr'))
    .map(tr => {
      // We don't currently render id in the cell, so rebuild from cached set + active tab + filter state.
      return tr;
    });

  // Simpler: rebuild from cache using the same filters renderTable applies.
  const all = allPropsCache || [];
  let data = all.filter(p => p.categorie === activeAdminTab);
  const filterMode = document.getElementById('propActivFilter')?.value || 'active';
  if (filterMode === 'active') data = data.filter(p => p.activ !== false);
  else if (filterMode === 'inactive') data = data.filter(p => p.activ === false);
  const q = (document.getElementById('propSearchInput')?.value || '').toLowerCase().trim();
  if (q) data = data.filter(p =>
    (p.titlu || '').toLowerCase().includes(q) ||
    (p.oras || '').toLowerCase().includes(q) ||
    (p.cartier || '').toLowerCase().includes(q) ||
    (p.judet || '').toLowerCase().includes(q) ||
    String(p.id || '').toLowerCase().includes(q));
  const regim = document.getElementById('propRegimFilter')?.value;
  if (regim && activeAdminTab !== 'terenuri') data = data.filter(p => p.regim === regim);
  const pMin = +document.getElementById('propPretMin')?.value || 0;
  const pMax = +document.getElementById('propPretMax')?.value || 0;
  if (pMin || pMax) data = data.filter(p => {
    const v = p.pret ?? p.pretTotal ?? 0;
    if (pMin && v < pMin) return false;
    if (pMax && v > pMax) return false;
    return true;
  });

  if (!data.length) { alert('Niciun rând cu filtrele curente.'); return; }

  const header = ['ID', 'Titlu', 'Categorie', 'Tip', 'Regim', 'Preț', 'Preț total', 'Camere', 'Suprafață', 'Etaj', 'Oraș', 'Cartier', 'Adresă', 'Județ', 'Status', 'Link public'];
  const rows = [header, ...data.map(p => [
    p.id,
    p.titlu || '',
    p.categorie,
    p.tip || p.tipSpatiu || '',
    p.regim || '',
    p.pret ?? '',
    p.pretTotal ?? '',
    p.camere ?? '',
    p.suprafata ?? p.suprafataTotala ?? '',
    p.etaj != null ? p.etaj + (p.etajTotal ? `/${p.etajTotal}` : '') : '',
    p.oras || '',
    p.cartier || '',
    p.adresa || '',
    p.judet || '',
    p.activ === false ? 'arhivat' : 'activ',
    publicPropertyUrl(p)
  ])];
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCsv(`proprietati-${activeAdminTab}-${stamp}.csv`, rows);
  showToast(`${data.length} proprietăți exportate.`);
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
  const pMin = document.getElementById('propPretMin'); if (pMin) pMin.value = '';
  const pMax = document.getElementById('propPretMax'); if (pMax) pMax.value = '';
  renderTable();
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

// ---------- BANNER QR PANEL ----------

function bannerPageUrl() {
  const o = window.location.origin;
  const base = (o && o.startsWith('http')) ? o : 'https://www.even-imobiliare.ro';
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

    // Price range — uses pret (residential/rent) or pretTotal (commercial sale / land).
    const pMin = +document.getElementById('propPretMin')?.value || 0;
    const pMax = +document.getElementById('propPretMax')?.value || 0;
    if (pMin || pMax) {
      data = data.filter(p => {
        const v = p.pret ?? p.pretTotal ?? 0;
        if (pMin && v < pMin) return false;
        if (pMax && v > pMax) return false;
        return true;
      });
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
          ${data.map(row => {
            const matchCount = countMatchesForProperty(row);
            const matchBadge = row.activ === false ? '' : (matchCount > 0
              ? `<span class="match-badge" onclick="openMatchesModal('${row.id}', '${activeAdminTab}')" title="Click pentru cumpărători potriviți"><i class="fa-solid fa-user-tag"></i> ${matchCount}</span>`
              : `<span class="match-badge zero" title="Niciun cumpărător potrivit"><i class="fa-solid fa-user-tag"></i> 0</span>`);
            const viewChip = (row.viewCount > 0)
              ? `<span class="views-chip" title="Vizualizări pe site"><i class="fa-solid fa-eye"></i> ${row.viewCount}</span>`
              : '';
            return `
            <tr style="${row.activ === false ? 'opacity:0.5' : ''}">
              ${columns.map(c => `<td>${c.render ? c.render(row[c.key], row) : (row[c.key] ?? '-')}</td>`).join('')}
              <td>
                ${row.activ === false ? '<span style="color:#999;font-size:12px">arhivat</span>' : '<span style="color:var(--success);font-size:12px">activ</span>'}
                <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">${matchBadge}${viewChip}</div>
              </td>
              <td>
                <div class="table-actions">
                  ${row.activ === false
                    ? ''
                    : `<span class="icon-btn icon-btn-banner${row.banner ? ' is-on' : ''}" onclick="toggleBanner('${row.id}', ${row.banner ? 'true' : 'false'})" title="${row.banner ? 'Pe banner acum · click pentru a scoate' : 'Pune pe bannerul QR'}"><i class="fa-solid fa-qrcode"></i></span>`}
                  ${row.activ === false ? '' : `<span class="icon-btn" onclick="copyPropertyLink('${row.id}')" title="Copiază linkul public"><i class="fa-solid fa-link"></i></span>`}
                  <span class="icon-btn" onclick="openBrochure('${row.id}', '${activeAdminTab}', false)" title="Brochure PDF"><i class="fa-solid fa-file-pdf"></i></span>
                  <span class="icon-btn" onclick="openBrochure('${row.id}', '${activeAdminTab}', true)" title="Brochure pentru colaborator (fără agent)"><i class="fa-solid fa-share-from-square"></i></span>
                  <span class="icon-btn" onclick="editProperty('${row.id}', '${activeAdminTab}')" title="Editează"><i class="fa-solid fa-pen"></i></span>
                  ${row.activ === false
                    ? `<span class="icon-btn" onclick="restoreProperty('${row.id}')" title="Restaurează"><i class="fa-solid fa-rotate-left"></i></span>`
                    : `<span class="icon-btn" onclick="confirmArchiveProperty('${row.id}')" title="Arhivează"><i class="fa-solid fa-box-archive"></i></span>`}
                  <span class="icon-btn danger" onclick="confirmHardDeleteProperty('${row.id}')" title="Șterge definitiv"><i class="fa-solid fa-trash"></i></span>
                </div>
              </td>
            </tr>
          `;
          }).join('')}
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

async function confirmArchiveProperty(id) {
  if (!confirm(`Arhivezi proprietatea ${id}? Va fi ascunsă din listinguri (poate fi restaurată oricând).`)) return;
  try {
    await deleteProperty(id);
    showToast('Proprietate arhivată.');
    await refreshStats();
    await renderTable();
  } catch (err) {
    alert('Eroare la arhivare: ' + err.message);
  }
}

async function confirmHardDeleteProperty(id) {
  const prop = (allPropsCache || []).find(p => String(p.id) === String(id));
  const label = prop?.titlu ? `"${prop.titlu}"` : `${id}`;
  if (!confirm(`ȘTERGERE DEFINITIVĂ — proprietatea ${label} va fi ștearsă complet din bază. Această acțiune NU poate fi anulată.\n\nContinui?`)) return;
  if (!confirm(`Ești absolut sigur? Tastează OK ca să confirmi ștergerea definitivă a ${label}.`)) return;
  try {
    await hardDeleteProperty(id);
    showToast('Proprietate ștearsă definitiv.');
    allPropsCache = allPropsCache.filter(p => String(p.id) !== String(id));
    await refreshStats();
    await renderTable();
    renderBannerPanel();
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
  const agent = (allAgentsCache || []).find(a => String(a.id) === String(id));
  const assigned = (allPropsCache || []).filter(p => String(p.agentId) === String(id)).length;
  const msg = assigned > 0
    ? `Ștergi agentul „${agent?.nume || id}"?\n\n${assigned} ${assigned === 1 ? 'proprietate este asignată' : 'proprietăți sunt asignate'} — vor rămâne în portofoliu fără agent (le poți reasigna din modalul de editare).`
    : `Ștergi agentul „${agent?.nume || id}"?`;
  if (!confirm(msg)) return;
  try {
    await deleteAgent(id);
    showToast('Agent șters.');
    await renderAgentsTable();
    await renderTable(); // refresh property table (agent column may show '—' now)
  } catch (err) {
    alert('Eroare: ' + err.message + '\n\nDacă vezi „foreign key constraint", rulează seed/migration-agents-fk-2026-05.sql în Supabase.');
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
  resetPendingFiles();
  document.querySelector('#addModal h2').textContent = 'Adaugă proprietate nouă';
  document.querySelector('#addModal .cat-selector').style.display = '';
  document.getElementById('addModal').classList.add('open');
  setFormCategory('rezidential');
}
function closeAddModal() {
  document.getElementById('addModal').classList.remove('open');
  editingProperty = null;
  existingImages = [];
  resetPendingFiles();
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
  renderPendingPreview();
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
      <input type="file" name="imaginiFiles" multiple accept="image/*" onchange="handlePendingFilesSelected(event)">
      <div class="imagini-hint"><i class="fa-solid fa-arrows-up-down-left-right"></i> Trage miniaturile pentru a le reordona. Prima imagine devine cover-ul anunțului.</div>
      <div id="imaginiPreview" class="imagini-preview"></div>
      <div id="pendingPreview" class="imagini-preview"></div>
    </div>
  `;
}

function renderImaginiPreview() {
  const wrap = document.getElementById('imaginiPreview');
  if (!wrap) return;
  if (!existingImages.length) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = existingImages.map((url, i) => `
    <div class="img-thumb" draggable="true"
         ondragstart="onThumbDragStart(event,'existing',${i})"
         ondragover="onThumbDragOver(event)"
         ondragleave="onThumbDragLeave(event)"
         ondrop="onThumbDrop(event,'existing',${i})"
         ondragend="onThumbDragEnd(event)">
      <img src="${url}" alt="">
      ${i === 0 && pendingFiles.length === 0 ? '<span class="img-thumb-cover">Cover</span>' : `<span class="img-thumb-idx">${i + 1}</span>`}
      <button type="button" class="img-thumb-x" onclick="removeExistingImage(${i})" title="Șterge"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `).join('');
}

// ---------- PENDING (newly selected) FILES WITH REORDER ----------
let pendingFiles = [];          // File[] in user-defined order
let pendingPreviewUrls = [];    // dataURL[] aligned with pendingFiles

function handlePendingFilesSelected(e) {
  const files = Array.from(e.target.files || []);
  // Append (don't replace) so user can add in batches
  files.forEach(f => {
    pendingFiles.push(f);
    const reader = new FileReader();
    const idx = pendingFiles.length - 1;
    reader.onload = ev => {
      pendingPreviewUrls[idx] = ev.target.result;
      renderPendingPreview();
    };
    reader.readAsDataURL(f);
  });
  // Clear input so the same file could be re-added later if removed
  e.target.value = '';
  renderPendingPreview();
}

function renderPendingPreview() {
  const wrap = document.getElementById('pendingPreview');
  if (!wrap) return;
  if (!pendingFiles.length) { wrap.innerHTML = ''; return; }
  const baseIdx = existingImages.length;
  wrap.innerHTML = pendingFiles.map((f, i) => {
    const overallIdx = baseIdx + i;
    const isCover = overallIdx === 0;
    const src = pendingPreviewUrls[i] || '';
    return `
      <div class="img-thumb" draggable="true"
           ondragstart="onThumbDragStart(event,'pending',${i})"
           ondragover="onThumbDragOver(event)"
           ondragleave="onThumbDragLeave(event)"
           ondrop="onThumbDrop(event,'pending',${i})"
           ondragend="onThumbDragEnd(event)">
        ${src ? `<img src="${src}" alt="">` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#bbb"><i class="fa-solid fa-spinner fa-spin"></i></div>'}
        ${isCover ? '<span class="img-thumb-cover">Cover</span>' : `<span class="img-thumb-idx">${overallIdx + 1}</span>`}
        <button type="button" class="img-thumb-x" onclick="removePendingFile(${i})" title="Șterge"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `;
  }).join('');
}

function removePendingFile(i) {
  pendingFiles.splice(i, 1);
  pendingPreviewUrls.splice(i, 1);
  renderPendingPreview();
  renderImaginiPreview();
}

// Drag & drop reorder across both lists (existing → pending allowed)
let dragSrc = null; // { list: 'existing'|'pending', index: number }

function onThumbDragStart(e, list, index) {
  dragSrc = { list, index };
  e.dataTransfer.effectAllowed = 'move';
  // Firefox requires data to be set
  try { e.dataTransfer.setData('text/plain', `${list}:${index}`); } catch {}
  e.currentTarget.classList.add('dragging');
}
function onThumbDragOver(e) {
  if (!dragSrc) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drop-target');
}
function onThumbDragLeave(e) {
  e.currentTarget.classList.remove('drop-target');
}
function onThumbDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.img-thumb.drop-target').forEach(el => el.classList.remove('drop-target'));
  dragSrc = null;
}
function onThumbDrop(e, destList, destIndex) {
  e.preventDefault();
  e.currentTarget.classList.remove('drop-target');
  if (!dragSrc) return;
  if (dragSrc.list === destList && dragSrc.index === destIndex) return;

  // Build a unified ordered array, perform the move, then split back.
  const unified = [
    ...existingImages.map(url => ({ type: 'existing', url })),
    ...pendingFiles.map((f, i) => ({ type: 'pending', file: f, dataUrl: pendingPreviewUrls[i] }))
  ];
  const srcAbs  = dragSrc.list === 'existing' ? dragSrc.index : existingImages.length + dragSrc.index;
  const destAbs = destList    === 'existing' ? destIndex      : existingImages.length + destIndex;
  const [moved] = unified.splice(srcAbs, 1);
  unified.splice(destAbs, 0, moved);

  existingImages = unified.filter(x => x.type === 'existing').map(x => x.url);
  const newPending = unified.filter(x => x.type === 'pending');
  pendingFiles = newPending.map(x => x.file);
  pendingPreviewUrls = newPending.map(x => x.dataUrl);

  renderImaginiPreview();
  renderPendingPreview();
}

function resetPendingFiles() {
  pendingFiles = [];
  pendingPreviewUrls = [];
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

  // Use the reorderable pendingFiles array (in user's chosen order),
  // not the raw FileList — that way drag-reorder is what actually gets uploaded.
  const newFiles = pendingFiles.slice();

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

// ---------- IMPORT IMOBILIARE.RO ----------
let importedDraft = null;

function openImportModal() {
  importedDraft = null;
  document.getElementById('importUrlInput').value = '';
  document.getElementById('importPreview').style.display = 'none';
  document.getElementById('importPreviewBody').innerHTML = '';
  document.getElementById('importModal').classList.add('open');
  setTimeout(() => document.getElementById('importUrlInput').focus(), 100);
}
function closeImportModal() {
  document.getElementById('importModal').classList.remove('open');
  importedDraft = null;
}

async function runImportFetch() {
  const urlInput = document.getElementById('importUrlInput');
  const btn = document.getElementById('importFetchBtn');
  const url = (urlInput.value || '').trim();
  if (!/^https?:\/\/(www\.)?imobiliare\.ro\/oferta\//i.test(url)) {
    alert('Te rog lipește un link valid imobiliare.ro/oferta/...');
    return;
  }
  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Se extrag datele...';

  try {
    const r = await fetch('/api/import-imobiliare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);

    importedDraft = data;
    renderImportPreview(data);
    document.getElementById('importPreview').style.display = 'block';
  } catch (err) {
    alert('Nu am putut extrage: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

function renderImportPreview(d) {
  const row = (label, value) => {
    if (value === undefined || value === null || value === '' || value === false) return '';
    let display = value;
    if (typeof value === 'boolean') display = value ? 'Da' : 'Nu';
    if (Array.isArray(value)) display = value.length + ' elemente';
    return `<div style="display:grid;grid-template-columns:160px 1fr;gap:8px;padding:4px 0;border-bottom:1px dashed var(--gray-200)">
      <div style="color:var(--gray-500);font-weight:500">${label}</div>
      <div>${escapeHtmlAdm(String(display)).slice(0, 280)}</div>
    </div>`;
  };
  const body = [
    row('Categorie', d.categorie),
    row('Tip', d.tip),
    row('Regim', d.regim === 'inchiriere' ? 'Închiriere' : d.regim === 'vanzare' ? 'Vânzare' : d.regim),
    row('Titlu', d.titlu),
    row('Preț', d.pret ? `${d.pret} ${d.moneda || 'EUR'}` : null),
    row('Oraș', d.oras),
    row('Cartier', d.cartier),
    row('Adresă', d.adresa),
    row('Camere', d.camere),
    row('Băi', d.bai),
    row('Suprafață utilă', d.suprafata ? `${d.suprafata} mp` : null),
    row('Suprafață totală', d.suprafataTotala ? `${d.suprafataTotala} mp` : null),
    row('Etaj', d.etaj != null && d.etajTotal ? `${d.etaj} din ${d.etajTotal}` : d.etaj),
    row('An construcție', d.anConstructie),
    row('Compartimentare', d.compartimentare),
    row('Mobilat', d.mobilat),
    row('Încălzire', d.tipIncalzire),
    row('Parcare', d.parcare),
    row('Balcon', d.balcon),
    row('Terase', d.terase),
    row('Descriere', d.descriere ? d.descriere.slice(0, 200) + (d.descriere.length > 200 ? '…' : '') : null),
    row('Imagini pe imobiliare.ro', d.imaginiSursa && d.imaginiSursa.length ? `${d.imaginiSursa.length} (NU se importă — urci pozele proprii)` : null),
  ].filter(Boolean).join('');
  document.getElementById('importPreviewBody').innerHTML = body || '<em>Nu am extras nicio dată utilă.</em>';
}

function acceptImportedDraft() {
  if (!importedDraft) return;
  const d = importedDraft;

  // Build an "editingProperty"-shaped object so hydrateFormValues populates the form.
  // We deliberately do NOT set an id — submitNewProperty generates one.
  const draft = {
    titlu: d.titlu,
    regim: d.regim,
    tip: d.tip,
    camere: d.camere,
    suprafata: d.suprafata,
    suprafataTotala: d.suprafataTotala,
    etaj: d.etaj,
    etajTotal: d.etajTotal,
    anConstructie: d.anConstructie,
    pret: d.pret,
    oras: d.oras,
    cartier: d.cartier,
    adresa: d.adresa,
    descriere: d.descriere,
  };
  Object.keys(draft).forEach(k => (draft[k] === undefined || draft[k] === null) && delete draft[k]);

  // Close import modal, open add modal in correct category, then hydrate.
  closeImportModal();
  editingProperty = null;
  existingImages = [];
  document.querySelector('#addModal h2').textContent = 'Proprietate importată — verifică și completează';
  document.querySelector('#addModal .cat-selector').style.display = '';
  document.getElementById('addModal').classList.add('open');

  // Set category (this re-renders the form), then hydrate it via temporary editingProperty hack.
  editingProperty = draft;
  setFormCategory(d.categorie || 'rezidential');
  // After hydrate, clear editingProperty so submit treats this as a new (add) flow.
  editingProperty = null;

  showToast('Datele au fost preluate. Verifică, urcă pozele și salvează.');
}

// ============================================================
// BUYER PROFILES — saved searches + matching
// ============================================================

const BUYER_CATEGORII = [
  { value: '', label: 'Orice' },
  { value: 'rezidential', label: 'Rezidențial' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'terenuri', label: 'Teren' },
];
const BUYER_REGIMURI = [
  { value: '', label: 'Orice' },
  { value: 'vanzare', label: 'Vânzare' },
  { value: 'inchiriere', label: 'Închiriere' },
];

// Returns true if a property matches a buyer's criteria.
// Empty criteria are treated as "any". Array criteria use OR; cross-field is AND.
function propertyMatchesBuyer(p, b) {
  if (!p || !b || b.activ === false) return false;
  if (b.categorie && b.categorie !== p.categorie) return false;
  if (b.regim && b.regim !== p.regim) return false;
  if (b.tip && b.tip.length) {
    const tip = p.tip || p.tipSpatiu;
    if (!tip || !b.tip.includes(tip)) return false;
  }
  if (b.orase && b.orase.length) {
    const city = (p.oras || p.localitate || p.judet || '').toLowerCase();
    if (!b.orase.some(o => city.includes(o.toLowerCase()))) return false;
  }
  if (b.cartiere && b.cartiere.length) {
    const cart = (p.cartier || '').toLowerCase();
    if (!b.cartiere.some(c => cart.includes(c.toLowerCase()))) return false;
  }
  if (b.camereMin != null && (p.camere || 0) < b.camereMin) return false;
  if (b.camereMax != null && (p.camere || 999) > b.camereMax) return false;
  const price = p.pret ?? p.pretTotal ?? 0;
  if (b.pretMin != null && price < b.pretMin) return false;
  if (b.pretMax != null && price > b.pretMax) return false;
  const surf = p.suprafata ?? p.suprafataTotala ?? 0;
  if (b.suprafataMin != null && surf < b.suprafataMin) return false;
  if (b.suprafataMax != null && surf > b.suprafataMax) return false;
  return true;
}

function countMatchesForProperty(p) {
  if (!allBuyersCache || !allBuyersCache.length) return 0;
  return allBuyersCache.filter(b => b.activ !== false && propertyMatchesBuyer(p, b)).length;
}

function getMatchedBuyers(prop) {
  return (allBuyersCache || []).filter(b => b.activ !== false && propertyMatchesBuyer(prop, b));
}

async function renderBuyersTable() {
  const wrap = document.getElementById('buyersWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div style="padding:24px;color:var(--gray-400)"><i class="fa-solid fa-spinner fa-spin"></i> Se încarcă...</div>';
  try {
    const buyers = await getBuyerProfiles();
    allBuyersCache = buyers;

    const q = (document.getElementById('buyerSearchInput')?.value || '').toLowerCase().trim();
    const prio = document.getElementById('buyerPrioritateFilter')?.value || '';
    const activMode = document.getElementById('buyerActivFilter')?.value || 'active';

    let data = buyers;
    if (q) data = data.filter(b =>
      (b.nume || '').toLowerCase().includes(q) ||
      (b.email || '').toLowerCase().includes(q) ||
      (b.telefon || '').toLowerCase().includes(q));
    if (prio) data = data.filter(b => b.prioritate === prio);
    if (activMode === 'active') data = data.filter(b => b.activ !== false);
    else if (activMode === 'inactive') data = data.filter(b => b.activ === false);

    if (!data.length) {
      wrap.innerHTML = '<div style="padding:32px;color:var(--gray-500);text-align:center;background:var(--gray-50);border-radius:8px">Niciun cumpărător salvat. Apasă „Adaugă cumpărător" ca să începi.</div>';
      return;
    }

    wrap.innerHTML = `
      <div style="margin-bottom:8px;font-size:13px;color:var(--gray-500)">${data.length} ${data.length === 1 ? 'cumpărător' : 'cumpărători'}</div>
      <table class="admin-table">
        <thead>
          <tr><th>Nume</th><th>Contact</th><th>Caută</th><th>Buget</th><th>Match-uri</th><th></th></tr>
        </thead>
        <tbody>
          ${data.map(b => {
            const matchedProps = (allPropsCache || []).filter(p => p.activ !== false && propertyMatchesBuyer(p, b));
            const wa = waPhone(b.telefon);
            return `
              <tr style="${b.activ === false ? 'opacity:0.5' : ''}">
                <td>
                  <strong>${escapeHtmlAdm(b.nume)}</strong>
                  <div style="margin-top:3px"><span class="prio-tag prio-${b.prioritate}">${b.prioritate === 'hot' ? '🔥 ' : ''}${b.prioritate}</span></div>
                </td>
                <td style="font-size:13px">
                  ${b.email ? `<a href="mailto:${escapeHtmlAdm(b.email)}">${escapeHtmlAdm(b.email)}</a>` : ''}
                  ${b.telefon ? `<br><a href="tel:${escapeHtmlAdm(b.telefon)}">${escapeHtmlAdm(b.telefon)}</a>` : ''}
                </td>
                <td class="buyer-criteria">${escapeHtmlAdm(buyerCriteriaSummary(b))}</td>
                <td style="font-size:13px;white-space:nowrap">${buyerBudgetLabel(b)}</td>
                <td>
                  ${matchedProps.length > 0
                    ? `<span class="match-badge" onclick="openMatchesForBuyer('${b.id}')"><i class="fa-solid fa-bullseye"></i> ${matchedProps.length}</span>`
                    : `<span class="match-badge zero"><i class="fa-solid fa-bullseye"></i> 0</span>`}
                </td>
                <td>
                  <div class="table-actions">
                    ${wa ? `<a class="icon-btn icon-btn-wa" href="https://wa.me/${wa}" target="_blank" rel="noopener" title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>` : ''}
                    <span class="icon-btn" onclick='editBuyer(${JSON.stringify(b.id)})' title="Editează"><i class="fa-solid fa-pen"></i></span>
                    <span class="icon-btn danger" onclick="confirmDeleteBuyer('${b.id}')" title="Șterge"><i class="fa-solid fa-trash"></i></span>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    wrap.innerHTML = '<div style="padding:24px;color:#e84545">Eroare: ' + escapeHtmlAdm(err.message) + '</div>';
    console.error(err);
  }
}

function buyerCriteriaSummary(b) {
  const parts = [];
  if (b.categorie) parts.push(b.categorie);
  if (b.regim) parts.push(b.regim);
  if (b.tip && b.tip.length) parts.push(b.tip.join('/'));
  if (b.orase && b.orase.length) parts.push(b.orase.join(', '));
  if (b.cartiere && b.cartiere.length) parts.push('(' + b.cartiere.join(', ') + ')');
  if (b.camereMin || b.camereMax) {
    parts.push(`${b.camereMin || '?'}-${b.camereMax || '?'} cam`);
  }
  if (b.suprafataMin || b.suprafataMax) {
    parts.push(`${b.suprafataMin || ''}–${b.suprafataMax || ''} mp`);
  }
  return parts.length ? parts.join(' · ') : '(orice)';
}

function buyerBudgetLabel(b) {
  if (!b.pretMin && !b.pretMax) return '<span style="color:#aaa">orice</span>';
  const min = b.pretMin ? formatPrice(b.pretMin) : '';
  const max = b.pretMax ? formatPrice(b.pretMax) : '';
  if (min && max) return `${min} – ${max}`;
  if (min) return `de la ${min}`;
  return `până la ${max}`;
}

let editingBuyer = null;

// Selected chip values for the buyer-modal multi-selects.
// Reset every time the modal opens.
let buyerSelections = { tip: [], orase: [], cartiere: [] };

// Build option lists from the current property cache so the dropdowns only
// suggest values that actually exist in the portfolio (matching is reliable).
function distinctValuesFor(field) {
  const set = new Set();
  (allPropsCache || []).forEach(p => {
    if (field === 'tip') {
      if (p.tip) set.add(p.tip);
      if (p.tipSpatiu) set.add(p.tipSpatiu);
    } else if (field === 'orase') {
      [p.oras, p.localitate, p.judet].forEach(v => { if (v) set.add(v); });
    } else if (field === 'cartiere') {
      if (p.cartier) set.add(p.cartier);
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ro'));
}

function renderChipInput(field, placeholder) {
  const selected = buyerSelections[field] || [];
  const allOptions = distinctValuesFor(field);
  const available = allOptions.filter(o => !selected.some(s => s.toLowerCase() === o.toLowerCase()));
  return `
    <div class="chip-input" id="chip-${field}">
      ${selected.length === 0 ? '' : selected.map((v, i) => `
        <span class="chip">${escapeHtmlAdm(v)}<button type="button" class="chip-x" onclick="removeChip('${field}', ${i})" aria-label="șterge">✕</button></span>
      `).join('')}
      <select onchange="addChipFromSelect('${field}', this)">
        <option value="">${selected.length ? '+ adaugă...' : placeholder}</option>
        ${available.map(o => `<option value="${escapeHtmlAdm(o)}">${escapeHtmlAdm(o)}</option>`).join('')}
      </select>
      <input class="chip-free" placeholder="sau scrie manual + Enter" onkeydown="addChipFromInput(event, '${field}')">
    </div>
  `;
}

function addChipFromSelect(field, sel) {
  const v = sel.value.trim();
  if (!v) return;
  if (!buyerSelections[field].some(x => x.toLowerCase() === v.toLowerCase())) {
    buyerSelections[field].push(v);
  }
  redrawChip(field);
}

function addChipFromInput(ev, field) {
  if (ev.key !== 'Enter') return;
  ev.preventDefault();
  const v = ev.target.value.trim();
  if (!v) return;
  if (!buyerSelections[field].some(x => x.toLowerCase() === v.toLowerCase())) {
    buyerSelections[field].push(v);
  }
  ev.target.value = '';
  redrawChip(field);
}

function removeChip(field, idx) {
  buyerSelections[field].splice(idx, 1);
  redrawChip(field);
}

function redrawChip(field) {
  const placeholders = { tip: 'Selectează tip...', orase: 'Selectează oraș...', cartiere: 'Selectează cartier...' };
  const wrap = document.getElementById(`chip-${field}`);
  if (!wrap) return;
  wrap.outerHTML = renderChipInput(field, placeholders[field]);
}

function openBuyerModal(buyer = null) {
  editingBuyer = buyer;
  document.getElementById('buyerModalTitle').textContent = buyer ? 'Editează cumpărător' : 'Adaugă cumpărător';
  const b = buyer || {};
  // Initialize chip selections from the buyer being edited (or empty for new).
  buyerSelections = {
    tip: [...(b.tip || [])],
    orase: [...(b.orase || [])],
    cartiere: [...(b.cartiere || [])],
  };
  document.getElementById('buyerForm').innerHTML = `
    <div class="form-grid">
      <div class="form-group full"><label>Nume cumpărător *</label><input type="text" name="nume" required value="${escapeHtmlAdm(b.nume || '')}" placeholder="ex: Familia Ionescu"></div>
      <div class="form-group"><label>Email</label><input type="email" name="email" value="${escapeHtmlAdm(b.email || '')}"></div>
      <div class="form-group"><label>Telefon</label><input type="tel" name="telefon" value="${escapeHtmlAdm(b.telefon || '')}" placeholder="07xx..."></div>
      <div class="form-group">
        <label>Prioritate</label>
        <select name="prioritate">
          <option value="hot" ${b.prioritate === 'hot' ? 'selected' : ''}>🔥 Hot</option>
          <option value="normal" ${(b.prioritate || 'normal') === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="cold" ${b.prioritate === 'cold' ? 'selected' : ''}>Cold</option>
        </select>
      </div>
      <div class="form-group"><label>Activ?</label>
        <select name="activ">
          <option value="true" ${b.activ !== false ? 'selected' : ''}>Da</option>
          <option value="false" ${b.activ === false ? 'selected' : ''}>Nu (pe pauză)</option>
        </select>
      </div>

      <div class="form-group full" style="margin-top:8px"><strong style="color:var(--gold);font-size:13px;letter-spacing:0.1em;text-transform:uppercase">Criterii căutare</strong></div>

      <div class="form-group">
        <label>Categorie</label>
        <select name="categorie">${BUYER_CATEGORII.map(c => `<option value="${c.value}" ${b.categorie === c.value ? 'selected' : ''}>${c.label}</option>`).join('')}</select>
      </div>
      <div class="form-group">
        <label>Regim</label>
        <select name="regim">${BUYER_REGIMURI.map(r => `<option value="${r.value}" ${b.regim === r.value ? 'selected' : ''}>${r.label}</option>`).join('')}</select>
      </div>

      <div class="form-group full"><label>Tipuri proprietate</label>${renderChipInput('tip', 'Selectează tip...')}<small style="color:var(--gray-500);font-size:11px">Opțiunile vin din proprietățile actuale. Poți scrie și manual + Enter.</small></div>
      <div class="form-group full"><label>Orașe</label>${renderChipInput('orase', 'Selectează oraș...')}</div>
      <div class="form-group full"><label>Cartiere</label>${renderChipInput('cartiere', 'Selectează cartier...')}</div>

      <div class="form-group"><label>Camere min</label><input type="number" name="camereMin" min="0" value="${b.camereMin || ''}"></div>
      <div class="form-group"><label>Camere max</label><input type="number" name="camereMax" min="0" value="${b.camereMax || ''}"></div>
      <div class="form-group"><label>Buget min (€)</label><input type="number" name="pretMin" value="${b.pretMin || ''}"></div>
      <div class="form-group"><label>Buget max (€)</label><input type="number" name="pretMax" value="${b.pretMax || ''}"></div>
      <div class="form-group"><label>Suprafață min (mp)</label><input type="number" name="suprafataMin" value="${b.suprafataMin || ''}"></div>
      <div class="form-group"><label>Suprafață max (mp)</label><input type="number" name="suprafataMax" value="${b.suprafataMax || ''}"></div>

      <div class="form-group full"><label>Notă internă</label><textarea name="note" rows="3">${escapeHtmlAdm(b.note || '')}</textarea></div>
    </div>
  `;
  document.getElementById('buyerModal').classList.add('open');
}

function closeBuyerModal() {
  document.getElementById('buyerModal').classList.remove('open');
  editingBuyer = null;
}

function editBuyer(id) {
  const b = allBuyersCache.find(x => String(x.id) === String(id));
  if (!b) return;
  openBuyerModal(b);
}

async function submitBuyer(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Se salvează...';

  const fd = {};
  form.querySelectorAll('[name]').forEach(el => { fd[el.name] = el.value; });

  const buyer = {
    id: editingBuyer?.id,
    nume: fd.nume,
    email: fd.email,
    telefon: fd.telefon,
    prioritate: fd.prioritate,
    activ: fd.activ === 'true',
    categorie: fd.categorie,
    regim: fd.regim,
    tip: [...buyerSelections.tip],
    orase: [...buyerSelections.orase],
    cartiere: [...buyerSelections.cartiere],
    camereMin: fd.camereMin ? +fd.camereMin : null,
    camereMax: fd.camereMax ? +fd.camereMax : null,
    pretMin: fd.pretMin ? +fd.pretMin : null,
    pretMax: fd.pretMax ? +fd.pretMax : null,
    suprafataMin: fd.suprafataMin ? +fd.suprafataMin : null,
    suprafataMax: fd.suprafataMax ? +fd.suprafataMax : null,
    note: fd.note,
  };

  try {
    await upsertBuyerProfile(buyer);
    closeBuyerModal();
    showToast(editingBuyer ? 'Cumpărător actualizat.' : 'Cumpărător adăugat.');
    await renderBuyersTable();
    await renderTable(); // refresh match counts on property table
  } catch (err) {
    alert('Eroare: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvează';
  }
}

async function confirmDeleteBuyer(id) {
  if (!confirm('Ștergi acest cumpărător din baza ta?')) return;
  try {
    await deleteBuyerProfile(id);
    showToast('Cumpărător șters.');
    await renderBuyersTable();
    await renderTable();
  } catch (err) {
    alert('Eroare: ' + err.message);
  }
}

// Matches modal: list buyers that match a given property
function openMatchesModal(propId, cat) {
  const prop = (allPropsCache || []).find(p => String(p.id) === String(propId));
  if (!prop) return;
  const matched = getMatchedBuyers(prop);
  document.getElementById('matchesModalTitle').textContent =
    `${matched.length} ${matched.length === 1 ? 'cumpărător potrivit' : 'cumpărători potriviți'} pentru „${prop.titlu || prop.id}"`;
  const body = document.getElementById('matchesBody');
  if (!matched.length) {
    body.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:24px">Niciun cumpărător din baza ta nu se potrivește cu această proprietate.</p>';
  } else {
    body.innerHTML = `<div class="match-list">${matched.map(b => {
      const wa = waPhone(b.telefon);
      return `
        <div class="match-item">
          <div>
            <div class="match-item-name">${escapeHtmlAdm(b.nume)} <span class="prio-tag prio-${b.prioritate}" style="margin-left:6px">${b.prioritate}</span></div>
            <div class="match-item-contact">
              ${b.email ? `<a href="mailto:${escapeHtmlAdm(b.email)}">${escapeHtmlAdm(b.email)}</a>` : ''}
              ${b.telefon ? ` · <a href="tel:${escapeHtmlAdm(b.telefon)}">${escapeHtmlAdm(b.telefon)}</a>` : ''}
            </div>
            <div class="buyer-criteria" style="margin-top:4px">${escapeHtmlAdm(buyerCriteriaSummary(b))}</div>
            ${b.note ? `<div style="margin-top:6px;font-size:12px;color:#777;font-style:italic">„${escapeHtmlAdm(b.note)}"</div>` : ''}
          </div>
          <div class="match-item-actions">
            ${wa ? `<a class="icon-btn icon-btn-wa" href="https://wa.me/${wa}?text=${encodeURIComponent('Bună ' + (b.nume.split(' ')[0] || '') + ', am o proprietate care s-ar putea potrivi: ' + publicPropertyUrl(prop))}" target="_blank" title="Trimite link pe WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>` : ''}
            ${b.email ? `<a class="icon-btn" href="mailto:${escapeHtmlAdm(b.email)}?subject=${encodeURIComponent('Proprietate care s-ar putea potrivi')}&body=${encodeURIComponent('Bună ' + (b.nume.split(' ')[0] || '') + ',\n\nAm un anunț care s-ar putea potrivi cu ce cauți:\n' + publicPropertyUrl(prop))}" title="Email"><i class="fa-solid fa-envelope"></i></a>` : ''}
          </div>
        </div>`;
    }).join('')}</div>`;
  }
  document.getElementById('matchesModal').classList.add('open');
}

function closeMatchesModal() {
  document.getElementById('matchesModal').classList.remove('open');
}

// From buyers table: list properties that match a buyer
function openMatchesForBuyer(buyerId) {
  const b = allBuyersCache.find(x => String(x.id) === String(buyerId));
  if (!b) return;
  const matched = (allPropsCache || []).filter(p => p.activ !== false && propertyMatchesBuyer(p, b));
  document.getElementById('matchesModalTitle').textContent =
    `${matched.length} ${matched.length === 1 ? 'proprietate potrivită' : 'proprietăți potrivite'} pentru ${b.nume}`;
  const body = document.getElementById('matchesBody');
  if (!matched.length) {
    body.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:24px">Nicio proprietate din portofoliu nu se potrivește cu criteriile.</p>';
  } else {
    body.innerHTML = `<div class="match-list">${matched.map(p => {
      const price = p.pret ?? p.pretTotal;
      const priceStr = price ? formatPrice(price) : 'Preț la cerere';
      return `
        <div class="match-item">
          <div>
            <div class="match-item-name">${escapeHtmlAdm(p.titlu || p.id)}</div>
            <div class="buyer-criteria" style="margin-top:4px">
              ${escapeHtmlAdm([p.oras, p.cartier].filter(Boolean).join(' · '))} · <b>${priceStr}</b>
            </div>
          </div>
          <div class="match-item-actions">
            <a class="icon-btn" href="${publicPropertyUrl(p)}" target="_blank" title="Vezi anunțul"><i class="fa-solid fa-eye"></i></a>
            <a class="icon-btn" onclick="openBrochure('${p.id}', '${p.categorie}', false); return false;" href="#" title="Brochure"><i class="fa-solid fa-file-pdf"></i></a>
          </div>
        </div>`;
    }).join('')}</div>`;
  }
  document.getElementById('matchesModal').classList.add('open');
}

// ============================================================
// BROCHURE — open printable property brochure in new tab
// ============================================================
function openBrochure(id, cat, blind) {
  const url = `brochure.html?id=${encodeURIComponent(id)}&cat=${encodeURIComponent(cat)}${blind ? '&blind=1' : ''}`;
  window.open(url, '_blank', 'noopener');
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
