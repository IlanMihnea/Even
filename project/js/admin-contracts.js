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

async function renderContracts() {
  const wrap = document.getElementById('contractsWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div style="color:var(--gray-400);padding:8px">Se încarcă...</div>';
  const { data, error } = await _supabase
    .from('contracts')
    .select('id, title, status, created_at, contract_signers(role, name, status, position, token)')
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
  return '<div class="ct-card">' +
    '<div class="ct-card-head"><div><h3>' + escapeHtmlAdm(c.title || 'Contract') + '</h3>' +
    '<span class="ct-date">' + new Date(c.created_at).toLocaleDateString('ro-RO') + '</span></div>' +
    '<div class="ct-card-meta">' + ctStatusBadge(c.status) + '<span class="ct-prog">' + signedN + '/' + signers.length + ' semnături</span></div></div>' +
    '<div class="ct-srows">' + rows + '</div></div>';
}

function ctCopy(url) {
  navigator.clipboard.writeText(url).then(function () { ctNotify('Link copiat ✓', true); }, function () { ctNotify('Nu am putut copia linkul', false); });
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
  const box = document.getElementById('ctSigners');
  const row = document.createElement('div');
  row.className = 'ct-signer-row';
  row.innerHTML =
    '<input type="text" placeholder="Rol (ex. Proprietar)" class="ct-s-role" value="' + escapeHtmlAdm(data.role || '') + '">' +
    '<input type="text" placeholder="Nume" class="ct-s-name" value="' + escapeHtmlAdm(data.name || '') + '">' +
    '<input type="email" placeholder="Email" class="ct-s-email" value="' + escapeHtmlAdm(data.email || '') + '">' +
    '<button type="button" class="ct-s-del" onclick="this.closest(\'.ct-signer-row\').remove()" aria-label="Șterge"><i class="fa-solid fa-xmark"></i></button>';
  box.appendChild(row);
}

async function submitContract(e) {
  e.preventDefault();
  const btn = document.getElementById('ctSubmitBtn');
  const signers = [].slice.call(document.querySelectorAll('#ctSigners .ct-signer-row')).map(function (r) {
    return {
      role: r.querySelector('.ct-s-role').value.trim(),
      name: r.querySelector('.ct-s-name').value.trim(),
      email: r.querySelector('.ct-s-email').value.trim(),
    };
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
    const res = await fetch('/api/contracts-create', {
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
