// ============================================
// ADMIN.JS
// ============================================

const ADMIN_KEY = 'casanova_admin_logged';
let activeAdminTab = 'rezidential';
let activeFormCategory = 'rezidential';

function checkLogin() {
  return localStorage.getItem(ADMIN_KEY) === 'true';
}

function doLogin(e) {
  e.preventDefault();
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  if (u === 'admin' && p === 'admin') {
    localStorage.setItem(ADMIN_KEY, 'true');
    showDashboard();
  } else {
    alert('Date de logare incorecte. Folosește admin / admin pentru demo.');
  }
}

function doLogout() {
  localStorage.removeItem(ADMIN_KEY);
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  renderStats();
  renderAdminTabs();
  renderTable();
  renderAgentsTable();
}

function renderStats() {
  const stats = [
    { cat: 'rezidential', icon: 'fa-home', label: 'Rezidențial', count: rezidential.length, trend: '+12% lună' },
    { cat: 'comercial', icon: 'fa-building', label: 'Comercial', count: comercial.length, trend: '+5% lună' },
    { cat: 'terenuri', icon: 'fa-map', label: 'Terenuri', count: terenuri.length, trend: '+8% lună' },
    { cat: 'proiecte', icon: 'fa-city', label: 'Proiecte noi', count: proiecte.length, trend: '+15% lună' }
  ];
  document.getElementById('statsGrid').innerHTML = stats.map(s => `
    <div class="stat-card ${s.cat}">
      <div class="stat-icon"><i class="fa-solid ${s.icon}"></i></div>
      <div class="stat-num">${s.count}</div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-trend"><i class="fa-solid fa-arrow-trend-up"></i> ${s.trend}</div>
    </div>
  `).join('');
}

function renderAdminTabs() {
  const tabs = ['rezidential', 'comercial', 'terenuri'];
  document.getElementById('adminTabs').innerHTML = tabs.map(t => `
    <button class="admin-tab ${t === activeAdminTab ? 'active' : ''}" onclick="setAdminTab('${t}')">${capitalize(t)}</button>
  `).join('');
}

function setAdminTab(t) {
  activeAdminTab = t;
  renderAdminTabs();
  renderTable();
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

function renderTable() {
  const wrap = document.getElementById('tableWrap');
  let data, columns;

  if (activeAdminTab === 'rezidential') {
    data = rezidential;
    columns = [
      { key: 'titlu', label: 'Titlu' },
      { key: 'tip', label: 'Tip' },
      { key: 'regim', label: 'Regim', render: v => `<span class="badge badge-${v}">${v}</span>` },
      { key: 'oras', label: 'Oraș' },
      { key: 'camere', label: 'Camere' },
      { key: 'pret', label: 'Preț', render: v => formatPrice(v) }
    ];
  } else if (activeAdminTab === 'comercial') {
    data = comercial;
    columns = [
      { key: 'titlu', label: 'Titlu' },
      { key: 'tipSpatiu', label: 'Tip spațiu' },
      { key: 'clasaCladire', label: 'Clasă' },
      { key: 'oras', label: 'Oraș' },
      { key: 'suprafataTotala', label: 'mp', render: v => v + ' mp' },
      { key: 'pret', label: 'Preț', render: (v, r) => v ? `${v} €/mp/lună` : formatPrice(r.pretTotal) }
    ];
  } else {
    data = terenuri;
    columns = [
      { key: 'titlu', label: 'Titlu' },
      { key: 'tip', label: 'Tip' },
      { key: 'judet', label: 'Județ' },
      { key: 'suprafata', label: 'Suprafață', render: (v, r) => `${v} ${r.unitate}` },
      { key: 'pretTotal', label: 'Preț', render: v => formatPrice(v) }
    ];
  }

  wrap.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          ${columns.map(c => `<th>${c.label}</th>`).join('')}
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            ${columns.map(c => `<td>${c.render ? c.render(row[c.key], row) : row[c.key] ?? '-'}</td>`).join('')}
            <td>
              <div class="table-actions">
                <span class="icon-btn" onclick="alert('Editare ${row.id} (demo)')"><i class="fa-solid fa-pen"></i></span>
                <span class="icon-btn danger" onclick="alert('Ștergere ${row.id} (demo)')"><i class="fa-solid fa-trash"></i></span>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderAgentsTable() {
  const wrap = document.getElementById('agentsWrap');
  wrap.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Nume</th>
          <th>Rol</th>
          <th>Email</th>
          <th>Telefon</th>
          <th>Vândute</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${agenti.map(a => `
          <tr>
            <td><strong>${a.nume}</strong></td>
            <td>${a.rol}</td>
            <td>${a.email}</td>
            <td>${a.telefon}</td>
            <td>${a.proprietatiVandute}</td>
            <td>
              <div class="table-actions">
                <span class="icon-btn" onclick="alert('Editare agent (demo)')"><i class="fa-solid fa-pen"></i></span>
                <span class="icon-btn danger" onclick="alert('Ștergere agent (demo)')"><i class="fa-solid fa-trash"></i></span>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ---------- MODAL ADD ----------
function openAddModal() {
  document.getElementById('addModal').classList.add('open');
  setFormCategory('rezidential');
}
function closeAddModal() {
  document.getElementById('addModal').classList.remove('open');
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
        <div class="form-group full"><label>Titlu anunț</label><input type="text" placeholder="ex: Apartament 3 camere Herăstrău"></div>
        <div class="form-group">
          <label>Regim</label>
          <select><option>Vânzare</option><option>Închiriere</option></select>
        </div>
        <div class="form-group">
          <label>Tip imobil</label>
          <select><option>Apartament</option><option>Casă</option><option>Vilă</option><option>Duplex</option></select>
        </div>
        <div class="form-group"><label>Camere</label><input type="number" min="1"></div>
        <div class="form-group"><label>Suprafață utilă (mp)</label><input type="number"></div>
        <div class="form-group"><label>Etaj</label><input type="number"></div>
        <div class="form-group"><label>Etaj total</label><input type="number"></div>
        <div class="form-group"><label>An construcție</label><input type="number" min="1900"></div>
        <div class="form-group">
          <label>Orientare</label>
          <select><option>Sud</option><option>Sud-Est</option><option>Sud-Vest</option><option>Est</option><option>Vest</option><option>Nord</option></select>
        </div>
        <div class="form-group"><label>Preț (€)</label><input type="number"></div>
        <div class="form-group"><label>Oraș</label><input type="text"></div>
        <div class="form-group"><label>Cartier</label><input type="text"></div>
        <div class="form-group full"><label>Descriere</label><textarea></textarea></div>
      </div>
    `;
  } else if (activeFormCategory === 'comercial') {
    wrap.innerHTML = `
      <div class="form-grid">
        <div class="form-group full"><label>Titlu anunț</label><input type="text" placeholder="ex: Spațiu birouri clasa A Pipera"></div>
        <div class="form-group">
          <label>Regim</label>
          <select><option>Vânzare</option><option>Închiriere</option></select>
        </div>
        <div class="form-group">
          <label>Tip spațiu</label>
          <select><option>Birouri</option><option>Retail</option><option>Depozit</option><option>Industrial</option><option>Showroom</option></select>
        </div>
        <div class="form-group"><label>Suprafață totală (mp)</label><input type="number"></div>
        <div class="form-group"><label>Suprafață utilă (mp)</label><input type="number"></div>
        <div class="form-group"><label>Etaj</label><input type="number"></div>
        <div class="form-group"><label>Locuri parcare</label><input type="number"></div>
        <div class="form-group"><label>Înălțime liberă (m)</label><input type="number" step="0.1"></div>
        <div class="form-group">
          <label>Clasă clădire</label>
          <select><option>A</option><option>B</option><option>C</option></select>
        </div>
        <div class="form-group"><label>Preț €/mp/lună (chirie)</label><input type="number"></div>
        <div class="form-group"><label>Preț total € (vânzare)</label><input type="number"></div>
        <div class="form-group"><label>Oraș</label><input type="text"></div>
        <div class="form-group full"><label>Specificații tehnice</label><textarea placeholder="Curent trifazic, rampă, etc."></textarea></div>
      </div>
    `;
  } else if (activeFormCategory === 'terenuri') {
    wrap.innerHTML = `
      <div class="form-grid">
        <div class="form-group full"><label>Titlu anunț</label><input type="text" placeholder="ex: Teren intravilan Corbeanca"></div>
        <div class="form-group">
          <label>Tip teren</label>
          <select>
            <option>Intravilan rezidențial</option>
            <option>Intravilan comercial</option>
            <option>Extravilan agricol</option>
            <option>Industrial</option>
          </select>
        </div>
        <div class="form-group">
          <label>Unitate</label>
          <select><option>mp</option><option>ha</option></select>
        </div>
        <div class="form-group"><label>Suprafață</label><input type="number"></div>
        <div class="form-group"><label>Front stradal (ml)</label><input type="number"></div>
        <div class="form-group">
          <label>Acces drum</label>
          <select><option>Asfaltat</option><option>Pietruit</option><option>Câmp</option></select>
        </div>
        <div class="form-group"><label>Zonare PUG</label><input type="text" placeholder="ex: L1a, M3, etc."></div>
        <div class="form-group"><label>CUT</label><input type="number" step="0.1"></div>
        <div class="form-group"><label>POT (%)</label><input type="number"></div>
        <div class="form-group"><label>Județ</label><input type="text"></div>
        <div class="form-group"><label>Localitate</label><input type="text"></div>
        <div class="form-group"><label>Preț total (€)</label><input type="number"></div>
        <div class="form-group full">
          <label>Utilități disponibile</label>
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px">
            <label class="checkbox-item"><input type="checkbox" value="apa"> Apă</label>
            <label class="checkbox-item"><input type="checkbox" value="curent"> Curent</label>
            <label class="checkbox-item"><input type="checkbox" value="gaz"> Gaz</label>
            <label class="checkbox-item"><input type="checkbox" value="canalizare"> Canalizare</label>
          </div>
        </div>
        <div class="form-group full"><label>Vecinătăți & descriere</label><textarea></textarea></div>
      </div>
    `;
  }
}

function submitNewProperty(e) {
  e.preventDefault();
  closeAddModal();
  showToast(`Proprietate adăugată în categoria ${capitalize(activeFormCategory)}!`);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.querySelector('.toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  if (checkLogin()) {
    showDashboard();
  } else {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
  }
});
