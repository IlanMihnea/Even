// ============================================
// ADMIN.JS — Supabase auth + real data
// ============================================

let activeAdminTab = 'rezidential';
let activeFormCategory = 'rezidential';
let editingProperty = null;        // null = add mode; object = edit mode
let existingImages = [];           // URLs păstrate la editare (ce nu a fost șters)

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

  const { error } = await _supabase.auth.signInWithPassword({ email, password });

  if (error) {
    btn.disabled = false;
    btn.textContent = 'Autentificare';
    const hint = document.querySelector('.login-hint');
    if (hint) hint.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="color:#e84545"></i> ${error.message}`;
  } else {
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
  renderAdminTabs();
  await Promise.all([renderStats(), renderTable(), renderAgentsTable()]);
}

// ---------- STATS ----------

async function renderStats() {
  const statsGrid = document.getElementById('statsGrid');
  statsGrid.innerHTML = '<div style="color:var(--gray-400);padding:8px">Se încarcă...</div>';
  try {
    const [allProps, projects] = await Promise.all([getAllPropertiesAdmin(), getProjects()]);
    const counts = {
      rezidential: allProps.filter(p => p.categorie === 'rezidential').length,
      comercial: allProps.filter(p => p.categorie === 'comercial').length,
      terenuri: allProps.filter(p => p.categorie === 'terenuri').length,
      proiecte: projects.length
    };
    const stats = [
      { cat: 'rezidential', icon: 'fa-home', label: 'Rezidențial', count: counts.rezidential },
      { cat: 'comercial', icon: 'fa-building', label: 'Comercial', count: counts.comercial },
      { cat: 'terenuri', icon: 'fa-map', label: 'Terenuri', count: counts.terenuri },
      { cat: 'proiecte', icon: 'fa-city', label: 'Proiecte noi', count: counts.proiecte }
    ];
    statsGrid.innerHTML = stats.map(s => `
      <div class="stat-card ${s.cat}">
        <div class="stat-icon"><i class="fa-solid ${s.icon}"></i></div>
        <div class="stat-num">${s.count}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    `).join('');
  } catch (err) {
    statsGrid.innerHTML = '<div style="color:#e84545;padding:8px">Eroare la încărcarea statisticilor</div>';
    console.error(err);
  }
}

// ---------- TABS & TABLE ----------

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

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

async function renderTable() {
  const wrap = document.getElementById('tableWrap');
  wrap.innerHTML = '<div style="padding:24px;color:var(--gray-400)"><i class="fa-solid fa-spinner fa-spin"></i> Se încarcă...</div>';

  let data, columns;
  try {
    if (activeAdminTab === 'rezidential') {
      data = await getProperties('rezidential');
      columns = [
        { key: 'titlu', label: 'Titlu' },
        { key: 'tip', label: 'Tip' },
        { key: 'regim', label: 'Regim', render: v => `<span class="badge badge-${v}">${v}</span>` },
        { key: 'oras', label: 'Oraș' },
        { key: 'camere', label: 'Camere' },
        { key: 'pret', label: 'Preț', render: v => formatPrice(v) }
      ];
    } else if (activeAdminTab === 'comercial') {
      data = await getProperties('comercial');
      columns = [
        { key: 'titlu', label: 'Titlu' },
        { key: 'tipSpatiu', label: 'Tip spațiu' },
        { key: 'clasaCladire', label: 'Clasă' },
        { key: 'oras', label: 'Oraș' },
        { key: 'suprafataTotala', label: 'mp', render: v => v + ' mp' },
        { key: 'pret', label: 'Preț', render: (v, r) => v ? `${v} €/mp/lună` : formatPrice(r.pretTotal) }
      ];
    } else {
      data = await getProperties('terenuri');
      columns = [
        { key: 'titlu', label: 'Titlu' },
        { key: 'tip', label: 'Tip' },
        { key: 'judet', label: 'Județ' },
        { key: 'suprafata', label: 'Suprafață', render: (v, r) => `${v} ${r.unitate}` },
        { key: 'pretTotal', label: 'Preț', render: v => formatPrice(v) }
      ];
    }
  } catch (err) {
    wrap.innerHTML = '<div style="padding:24px;color:#e84545">Eroare la încărcarea datelor</div>';
    console.error(err);
    return;
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
                <span class="icon-btn" onclick="editProperty('${row.id}', '${activeAdminTab}')"><i class="fa-solid fa-pen"></i></span>
                <span class="icon-btn danger" onclick="confirmDeleteProperty('${row.id}')"><i class="fa-solid fa-trash"></i></span>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function renderAgentsTable() {
  const wrap = document.getElementById('agentsWrap');
  wrap.innerHTML = '<div style="padding:24px;color:var(--gray-400)"><i class="fa-solid fa-spinner fa-spin"></i> Se încarcă...</div>';
  try {
    const agents = await getAgents();
    wrap.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr><th>Nume</th><th>Rol</th><th>Email</th><th>Telefon</th><th>Vândute</th><th></th></tr>
        </thead>
        <tbody>
          ${agents.map(a => `
            <tr>
              <td><strong>${a.nume}</strong></td>
              <td>${a.rol}</td>
              <td>${a.email}</td>
              <td>${a.telefon}</td>
              <td>${a.proprietatiVandute}</td>
              <td>
                <div class="table-actions">
                  <span class="icon-btn" onclick="alert('Editare agent — în curând')"><i class="fa-solid fa-pen"></i></span>
                  <span class="icon-btn danger" onclick="alert('Ștergere agent — în curând')"><i class="fa-solid fa-trash"></i></span>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    wrap.innerHTML = '<div style="padding:24px;color:#e84545">Eroare la încărcarea agenților</div>';
    console.error(err);
  }
}

// ---------- CRUD ----------

async function confirmDeleteProperty(id) {
  if (!confirm(`Arhivezi proprietatea ${id}? Va fi ascunsă din listinguri.`)) return;
  try {
    await deleteProperty(id);
    showToast('Proprietate arhivată.');
    await renderTable();
    await renderStats();
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

// ---------- MODAL ADD ----------
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
        <div class="form-group full"><label>Vecinătăți & descriere</label><textarea name="descriere"></textarea></div>
        ${imageUploadBlock()}
      </div>
    `;
  }
  hydrateFormValues();
  renderImaginiPreview();
}

// ---------- IMAGE UPLOAD UI ----------

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
    await Promise.all([renderStats(), renderTable()]);
  } catch (err) {
    alert('Eroare la salvare: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvează proprietatea';
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
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
