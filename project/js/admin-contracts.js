// ============================================
// CONTRACTE — semnare digitală (admin)
// Depinde de: _supabase (db.js), escapeHtmlAdm (admin.js)
// ============================================

const CONTRACT_DEFAULT_BODY = `# II. Obiectul contractului
2.1. Proprietarul încredințează Agenției intermedierea în vederea vânzării imobilului ce face obiectul prezentului contract, conform descrierii și actelor puse la dispoziție de Proprietar.
2.3. Prețul de vânzare solicitat este de **350.000 EUR**. Poate fi modificat numai prin acordul scris al părților.

# III. Comisionul
3.1. Comisionul de intermediere este de **3% din prețul de vânzare**. Dacă prețul final de vânzare atinge sau depășește 400.000 EUR, comisionul este de **4% din prețul de vânzare**. Agenția nu este plătitoare de TVA; comisionul nu include TVA.
3.2. Comisionul este datorat de Proprietar (Vânzător).
3.3. Comisionul devine scadent la momentul semnării contractului autentic de vânzare-cumpărare și se achită prin transfer bancar în contul Agenției indicat la art. I.

# IV. Durata și exclusivitatea
4.1. Contractul se încheie pe durata de **6 luni** de la data semnării.
4.2. Pe durata contractului, Proprietarul acordă Agenției exclusivitate: nu va încredința imobilul altei agenții și nu va face publicitate proprie pentru vânzare.
4.4. Oricare parte poate denunța unilateral contractul printr-o notificare scrisă cu un preaviz de 30 de zile.

# V. Obligațiile părților
5.1. **Agenția** se obligă: să promoveze imobilul pe cheltuiala sa (anunțuri, fotografii, panou), să prezinte potențiali cumpărători, să asiste părțile până la finalizarea tranzacției și să trateze datele Proprietarului conform legii.
5.2. **Proprietarul** se obligă: să pună la dispoziție actele imobilului, să permită vizionările și să nu ocolească Agenția în relația cu clienții prezentați de aceasta.

# VI. Protecția datelor (GDPR)
6.1. Clientul își exprimă acordul ca Agenția să prelucreze datele sale cu caracter personal în scopul executării prezentului contract, conform Regulamentului (UE) 2016/679. Datele sunt stocate în Uniunea Europeană.

# VII. Dispoziții finale
7.1. Litigiile se soluționează amiabil, iar în lipsa unei soluții, de instanțele competente. Contractul a fost citit, înțeles și acceptat de părți și semnat electronic, semnătura electronică având valoarea juridică prevăzută de Regulamentul (UE) 910/2014 (eIDAS).`;

async function adminToken() {
  const { data } = await _supabase.auth.getSession();
  return (data && data.session && data.session.access_token) || null;
}

// Build an API URL on the canonical host. The apex domain 308-redirects to www,
// which breaks the CORS preflight on POST (authorization header) → "failed to fetch".
// Targeting www directly avoids the redirect.
function apiUrl(path) {
  let origin = location.origin;
  if (location.hostname === 'even-imobiliare.ro') origin = 'https://www.even-imobiliare.ro';
  return origin + path;
}

async function renderContracts() {
  const wrap = document.getElementById('contractsWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div style="color:var(--gray-400);padding:8px">Se încarcă...</div>';
  const { data, error } = await _supabase
    .from('contracts')
    .select('id, title, status, created_at, data, contract_signers(role, name, status, position, token)')
    .order('created_at', { ascending: false });
  if (error) { wrap.innerHTML = '<div style="color:var(--danger);padding:8px">Eroare la încărcare.</div>'; return; }
  if (!data || !data.length) { wrap.innerHTML = '<div class="ct-empty">Niciun contract încă. Apasă „Contract nou".</div>'; return; }
  wrap.innerHTML = data.map(renderContractCard).join('');
}

function ctStatusBadge(status) {
  const map = { sent: ['Trimis', 'blue'], partial: ['Parțial semnat', 'gold'], signed: ['Semnat', 'green'], draft: ['Draft', 'grey'], void: ['Anulat', 'grey'] };
  const m = map[status] || [status, 'grey'];
  return '<span class="ct-badge ct-badge-' + m[1] + '">' + m[0] + '</span>';
}

function renderContractCard(c) {
  const signers = (c.contract_signers || []).slice().sort(function (a, b) { return (a.position || 0) - (b.position || 0); });
  const signedN = signers.filter(function (s) { return s.status === 'signed'; }).length;
  const rows = signers.map(function (s) {
    const done = s.status === 'signed';
    const link = location.origin + '/sign.html?token=' + s.token;
    return '<div class="ct-srow">' +
      '<span class="ct-sdot ' + (done ? 'is-done' : '') + '"></span>' +
      '<span class="ct-sname">' + escapeHtmlAdm(s.name || '—') + ' <span class="ct-srole">' + escapeHtmlAdm(s.role || '') + '</span></span>' +
      (done ? '<span class="ct-sdone">semnat</span>'
            : '<button class="apl-btn apl-btn-ghost apl-btn-sm" onclick="ctCopy(\'' + link + '\')"><i class="fa-regular fa-copy"></i> Copiază link</button>') +
      '</div>';
  }).join('');
  const safeTitle = (c.title || 'Contract').replace(/'/g, "\\'");
  const term = (c.data && c.data.termination) || null;

  // Action button depends on state:
  //  - signed (in force, not denounced) → "Denunță" (formal termination)
  //  - draft/sent/partial → "Anulează" (void: kills links, cleans the list)
  //  - signed+denounced or void → no button
  let actionBtn = '';
  if (c.status === 'signed' && !term) {
    actionBtn = '<button class="ct-term" title="Denunță contractul (notificare scrisă)" onclick="openTerminate(\'' + c.id + '\', \'' + safeTitle + '\')"><i class="fa-solid fa-file-circle-xmark"></i></button>';
  } else if (c.status !== 'signed' && c.status !== 'void') {
    actionBtn = '<button class="ct-void" title="Anulează contractul" onclick="ctVoid(\'' + c.id + '\', \'' + safeTitle + '\')"><i class="fa-solid fa-ban"></i></button>';
  }
  // Permanent delete — available on any contract (incl. signed test/junk contracts).
  const delBtn = '<button class="ct-del" title="Șterge definitiv" onclick="ctDelete(\'' + c.id + '\', \'' + safeTitle + '\')"><i class="fa-solid fa-trash"></i></button>';

  const termMark = term
    ? '<div class="ct-term-mark"><i class="fa-solid fa-file-circle-xmark"></i> Denunțat · efect din ' + escapeHtmlAdm(term.effectiveLocal || '—') +
      '<button class="ct-dl" onclick="ctDownload(\'' + c.id + '\', \'notice\')"><i class="fa-solid fa-download"></i> Descarcă notificarea</button></div>'
    : '';

  // Signed contracts: let the admin open/download the final signed PDF.
  const signedBar = c.status === 'signed'
    ? '<div class="ct-foot"><button class="ct-dl ct-dl-ink" onclick="ctDownload(\'' + c.id + '\', \'signed\')"><i class="fa-solid fa-file-pdf"></i> Descarcă contractul semnat</button></div>'
    : '';

  return '<div class="ct-card' + (c.status === 'void' ? ' is-void' : '') + (term ? ' is-term' : '') + '">' +
    '<div class="ct-card-head"><div><h3>' + escapeHtmlAdm(c.title || 'Contract') + '</h3>' +
    '<span class="ct-date">' + new Date(c.created_at).toLocaleDateString('ro-RO') + '</span></div>' +
    '<div class="ct-card-meta">' + ctStatusBadge(c.status) + '<span class="ct-prog">' + signedN + '/' + signers.length + ' semnături</span>' +
    actionBtn + delBtn +
    '</div></div>' +
    termMark +
    '<div class="ct-srows">' + rows + '</div>' +
    signedBar + '</div>';
}

function ctCopy(url) {
  navigator.clipboard.writeText(url).then(function () { ctNotify('Link copiat ✓', true); }, function () { ctNotify('Nu am putut copia linkul', false); });
}

// Cancel a contract (void) without destroying evidence: the PDF + audit stay as
// archive, but the links go dead and it shows as "Anulat".
async function ctVoid(id, title) {
  const label = title ? '„' + title + '"' : 'acest contract';
  if (!confirm('Anulezi ' + label + '?\n\nContractul va fi marcat „Anulat", linkurile de semnare devin inactive, dar PDF-ul și dovada se păstrează ca arhivă.\n\nNotă: dacă era deja semnat, anularea NU îi anulează efectul juridic — pentru asta e nevoie de o notificare scrisă de denunțare.')) return;

  const token = await adminToken();
  if (!token) { ctNotify('Sesiune expirată. Reautentifică-te.', false); return; }

  try {
    const res = await fetch(apiUrl('/api/contracts?action=void'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ id: id }),
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out.error || 'Eroare la anulare');
    await renderContracts();
    ctNotify('Contract anulat.', true);
  } catch (err) {
    ctNotify('Eroare: ' + err.message, false);
  }
}

// Download a stored PDF (notice / signed contract) via a short-lived signed URL.
// Mobile-safe: open the tab synchronously inside the tap gesture, then redirect
// it once the signed URL is ready (window.open after an await is popup-blocked
// on iOS/Android).
async function ctDownload(id, kind) {
  const win = window.open('', '_blank');
  const fail = function (msg) { if (win) win.close(); ctNotify(msg, false); };
  try {
    const token = await adminToken();
    if (!token) return fail('Sesiune expirată. Reautentifică-te.');
    const res = await fetch(apiUrl('/api/contracts?action=file'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ id: id, kind: kind }),
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out.error || 'Eroare la descărcare');
    if (win) win.location = out.url; else window.location.href = out.url;
  } catch (err) {
    fail('Eroare: ' + err.message);
  }
}

// Permanently delete a contract (any status). For junk/test contracts.
// Removes the contract + signers + stored PDFs; every sign link goes dead.
async function ctDelete(id, title) {
  const label = title ? '„' + title + '"' : 'acest contract';
  if (!confirm('ȘTERGERE DEFINITIVĂ — ' + label + ' va fi șters complet (contract, semnatari, PDF-uri). Linkurile devin invalide. Acțiunea NU poate fi anulată.\n\nContinui?')) return;
  if (!confirm('Ești absolut sigur? Apasă OK ca să confirmi ștergerea definitivă.')) return;

  const token = await adminToken();
  if (!token) { ctNotify('Sesiune expirată. Reautentifică-te.', false); return; }

  try {
    const res = await fetch(apiUrl('/api/contracts?action=delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ id: id }),
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out.error || 'Eroare la ștergere');
    await renderContracts();
    ctNotify('Contract șters definitiv.', true);
  } catch (err) {
    ctNotify('Eroare: ' + err.message, false);
  }
}

// ── Denunțare unilaterală (signed contracts) ───────────────────────────────
let _termContractId = null;

function openTerminate(id, title) {
  _termContractId = id;
  document.getElementById('tmTitle').textContent = title || 'acest contract';
  document.getElementById('tmReason').value = '';
  document.getElementById('tmDays').value = '30';
  document.getElementById('terminateModal').classList.add('open');
}
function closeTerminateModal() { document.getElementById('terminateModal').classList.remove('open'); }

async function submitTerminate(e) {
  e.preventDefault();
  if (!_termContractId) return;
  const btn = document.getElementById('tmSubmitBtn');
  const reason = document.getElementById('tmReason').value.trim();
  const noticeDays = parseInt(document.getElementById('tmDays').value, 10) || 30;

  const token = await adminToken();
  if (!token) { ctNotify('Sesiune expirată. Reautentifică-te.', false); return; }

  btn.disabled = true;
  const old = btn.innerHTML;
  btn.innerHTML = 'Se trimite...';
  try {
    const res = await fetch(apiUrl('/api/contracts?action=terminate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ id: _termContractId, reason: reason, noticeDays: noticeDays }),
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out.error || 'Eroare la denunțare');
    closeTerminateModal();
    await renderContracts();
    ctNotify('Notificare de denunțare trimisă — efect din ' + (out.effectiveLocal || '—') + '.', true);
  } catch (err) {
    ctNotify('Eroare: ' + err.message, false);
  } finally {
    btn.disabled = false;
    btn.innerHTML = old;
  }
}

function openContractModal() {
  document.getElementById('ctTitle').value = 'Contract de intermediere imobiliară';
  document.getElementById('ctSubtitle').value = '— mandat de vânzare —';
  document.getElementById('ctNr').value = '';
  document.getElementById('ctDate').value = new Date().toLocaleDateString('ro-RO');
  document.getElementById('ctSignOnly').checked = false;
  document.getElementById('ctBody').value = CONTRACT_DEFAULT_BODY;
  const box = document.getElementById('ctSigners');
  box.innerHTML = '';
  addSignerRow(); addSignerRow();
  document.getElementById('contractModal').classList.add('open');
}
function closeContractModal() { document.getElementById('contractModal').classList.remove('open'); }

function addSignerRow(data) {
  data = data || {};
  const cd = data.clientData || {};
  const box = document.getElementById('ctSigners');
  const row = document.createElement('div');
  row.className = 'ct-signer-row';
  row.innerHTML =
    '<div class="ct-s-main">' +
      '<input type="text" placeholder="Rol (ex. Proprietar)" class="ct-s-role" value="' + escapeHtmlAdm(data.role || '') + '">' +
      '<input type="text" placeholder="Nume și prenume" class="ct-s-name" value="' + escapeHtmlAdm(data.name || '') + '">' +
      '<input type="email" placeholder="Email" class="ct-s-email" value="' + escapeHtmlAdm(data.email || '') + '">' +
      '<button type="button" class="ct-s-del" onclick="this.closest(\'.ct-signer-row\').remove()" aria-label="Șterge"><i class="fa-solid fa-xmark"></i></button>' +
    '</div>' +
    '<div class="ct-s-extra">' +
      '<input type="text" placeholder="Domiciliu (localitate, județ)" class="ct-s-domiciliu" value="' + escapeHtmlAdm(cd.domiciliu || '') + '">' +
      '<input type="text" placeholder="CNP" class="ct-s-cnp" value="' + escapeHtmlAdm(cd.cnp || '') + '">' +
      '<input type="text" placeholder="CI seria" class="ct-s-ciSeria" value="' + escapeHtmlAdm(cd.ciSeria || '') + '">' +
      '<input type="text" placeholder="CI nr." class="ct-s-ciNr" value="' + escapeHtmlAdm(cd.ciNr || '') + '">' +
      '<input type="text" placeholder="Telefon" class="ct-s-telefon" value="' + escapeHtmlAdm(cd.telefon || '') + '">' +
    '</div>';
  box.appendChild(row);
  applySignOnly();
}

// Show the per-signer personal-data fields only in "doar semnătură" mode (admin fills them).
function applySignOnly() {
  const on = document.getElementById('ctSignOnly').checked;
  document.querySelectorAll('#ctSigners .ct-s-extra').forEach(function (e) { e.style.display = on ? 'grid' : 'none'; });
}

async function submitContract(e) {
  e.preventDefault();
  const btn = document.getElementById('ctSubmitBtn');
  const signOnly = document.getElementById('ctSignOnly').checked;
  const signers = [].slice.call(document.querySelectorAll('#ctSigners .ct-signer-row')).map(function (r) {
    const name = r.querySelector('.ct-s-name').value.trim();
    const s = {
      role: r.querySelector('.ct-s-role').value.trim(),
      name: name,
      email: r.querySelector('.ct-s-email').value.trim(),
    };
    if (signOnly) {
      // admin fills the personal data here; signer just signs
      s.clientData = {
        name: name,
        domiciliu: r.querySelector('.ct-s-domiciliu').value.trim(),
        cnp: r.querySelector('.ct-s-cnp').value.trim(),
        ciSeria: r.querySelector('.ct-s-ciSeria').value.trim(),
        ciNr: r.querySelector('.ct-s-ciNr').value.trim(),
        telefon: r.querySelector('.ct-s-telefon').value.trim(),
      };
    }
    return s;
  }).filter(function (s) { return s.email; });
  if (!signers.length) { ctNotify('Adaugă cel puțin un semnatar cu email.', false); return; }

  const payload = {
    title: document.getElementById('ctTitle').value.trim(),
    meta: {
      subtitle: document.getElementById('ctSubtitle').value.trim(),
      nr: document.getElementById('ctNr').value.trim(),
      data: document.getElementById('ctDate').value.trim(),
    },
    bodyText: document.getElementById('ctBody').value,
    collectData: !document.getElementById('ctSignOnly').checked,
    signers: signers,
  };

  const token = await adminToken();
  if (!token) { ctNotify('Sesiune expirată. Reautentifică-te.', false); return; }

  btn.disabled = true;
  const old = btn.innerHTML;
  btn.innerHTML = 'Se trimite...';
  try {
    const res = await fetch(apiUrl('/api/contracts?action=create'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(payload),
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out.error || 'Eroare la creare');
    closeContractModal();
    await renderContracts();
    ctNotify('Contract creat — linkurile au fost trimise pe email.', true);
  } catch (err) {
    ctNotify('Eroare: ' + err.message, false);
  } finally {
    btn.disabled = false;
    btn.innerHTML = old;
  }
}

function ctNotify(msg, ok) {
  let t = document.getElementById('ctToast');
  if (!t) { t = document.createElement('div'); t.id = 'ctToast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'ct-toast show ' + (ok ? 'ok' : 'err');
  clearTimeout(t._h);
  t._h = setTimeout(function () { t.className = 'ct-toast'; }, 3200);
}
