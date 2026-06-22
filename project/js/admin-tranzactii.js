// ============================================================
// ADMIN-TRANZACTII.JS — Vânzări reale (ancora CMA)
// Pattern: identic cu buyer profiles din admin.js
// ============================================================

let allTranzactiiCache = [];
let editingTranzactie = null;

// ---------- RENDER TABLE ----------

async function renderTranzactiiTable() {
  const wrap = document.getElementById('tranzactiiWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div style="padding:24px;color:var(--gray-400)"><i class="fa-solid fa-spinner fa-spin"></i> Se încarcă...</div>';

  const ok = await tranzactiiTableExists();
  if (!ok) {
    wrap.innerHTML = '<div style="padding:32px;color:var(--gray-500);text-align:center;background:var(--gray-50);border-radius:8px">Tabelul <code>tranzactii</code> nu există încă. Rulează migrația SQL din <code>seed/migration-tranzactii-2026-06.sql</code> în Supabase.</div>';
    return;
  }

  try {
    const list = await getTranzactii();
    allTranzactiiCache = list;

    const q = (document.getElementById('tranzactiiSearchInput')?.value || '').toLowerCase();
    const camereF = document.getElementById('tranzactiiCamereFilter')?.value || '';
    const filtered = list.filter(t => {
      if (camereF && String(t.camere) !== camereF) return false;
      if (q) {
        const hay = [t.cartier, t.adresa, t.tip, t.vedere, t.stare, t.observatii].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (!filtered.length) {
      wrap.innerHTML = '<div style="padding:32px;color:var(--gray-500);text-align:center;background:var(--gray-50);border-radius:8px">Nicio tranzacție cu aceste filtre.</div>';
      return;
    }

    const rows = filtered.map(t => {
      const disc = (t.pretCerut && t.pretVandut)
        ? Math.round((1 - t.pretVandut / t.pretCerut) * 100)
        : null;
      const tvaLabel = t.tvaInclus === false
        ? '<span class="apl-pill" style="background:#fff8e1;color:#b45309;border:1px solid #fde68a">net +TVA</span>'
        : t.tvaInclus === true
          ? '<span class="apl-pill" style="background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0">TVA incl.</span>'
          : '<span class="apl-pill" style="color:var(--gray-400)">—</span>';
      const pretCerutFmt = t.pretCerut ? `€${Number(t.pretCerut).toLocaleString('ro-RO')}` : '—';
      const pretVandutFmt = t.pretVandut ? `€${Number(t.pretVandut).toLocaleString('ro-RO')}` : '—';
      const discBadge = disc != null
        ? `<span style="color:${disc > 0 ? '#e84545' : '#15803d'};font-size:12px;font-weight:600">${disc > 0 ? '-' : '+'}${Math.abs(disc)}%</span>`
        : '';

      return `
        <tr>
          <td>${t.dataVanzare || '—'}</td>
          <td>${escapeHtmlAdm(t.cartier || '—')}</td>
          <td>${t.camere || '—'}</td>
          <td>${t.suprafataUtila || '—'} mp</td>
          <td>${escapeHtmlAdm(t.stare || '—')}</td>
          <td>${pretCerutFmt} → <b>${pretVandutFmt}</b> ${discBadge}</td>
          <td>${tvaLabel}</td>
          <td class="apl-col-actions">
            <button class="apl-btn apl-btn-ghost apl-btn-sm" title="Editează" onclick="openTranzactieModal('${t.id}')">
              <i class="fa-solid fa-pencil"></i>
            </button>
            <button class="apl-btn apl-btn-ghost apl-btn-sm apl-btn-danger" title="Șterge" onclick="confirmDeleteTranzactie('${t.id}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>`;
    }).join('');

    wrap.innerHTML = `
      <div class="trz-summary">
        <span><b>${filtered.length}</b> tranzacție${filtered.length !== 1 ? 'i' : ''}</span>
        ${buildTrzStats(filtered)}
      </div>
      <table class="apl-table">
        <thead>
          <tr>
            <th>Dată</th><th>Zonă</th><th>Cam.</th><th>mp util</th>
            <th>Stare</th><th>Cerut → Obținut</th><th>TVA</th><th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  } catch (err) {
    wrap.innerHTML = `<div style="padding:24px;color:#e84545">Eroare: ${escapeHtmlAdm(err.message)}</div>`;
    console.error(err);
  }
}

function buildTrzStats(list) {
  const withDisc = list.filter(t => t.pretCerut && t.pretVandut);
  if (!withDisc.length) return '';
  const avgDisc = withDisc.reduce((s, t) => s + (1 - t.pretVandut / t.pretCerut), 0) / withDisc.length;
  const avgMp = list.filter(t => t.suprafataUtila && t.pretVandut).map(t => t.pretVandut / t.suprafataUtila);
  const meanMp = avgMp.length ? Math.round(avgMp.reduce((a, b) => a + b, 0) / avgMp.length) : null;
  return `
    <span>· discount mediu <b>${Math.round(avgDisc * 100)}%</b></span>
    ${meanMp ? `<span>· €/mp mediu obținut <b>€${meanMp.toLocaleString('ro-RO')}</b></span>` : ''}`;
}

// ---------- MODAL ----------

function openTranzactieModal(id) {
  editingTranzactie = id ? (allTranzactiiCache.find(t => t.id === id) || null) : null;
  const modal = document.getElementById('tranzactieModal');
  const title = document.getElementById('tranzactieModalTitle');
  if (title) title.textContent = editingTranzactie ? 'Editează tranzacție' : 'Tranzacție vândută nouă';
  renderTranzactieForm(editingTranzactie);
  if (modal) modal.classList.add('open');
}

function closeTranzactieModal() {
  const modal = document.getElementById('tranzactieModal');
  if (modal) modal.classList.remove('open');
  editingTranzactie = null;
}

function renderTranzactieForm(t) {
  const f = document.getElementById('tranzactieForm');
  if (!f) return;
  const v = (field, fallback = '') => t ? (t[field] != null ? t[field] : fallback) : fallback;
  const sel = (field, val) => t && t[field] === val ? ' selected' : '';

  f.innerHTML = `
    <div class="trz-form-grid">

      <div class="trz-form-group">
        <div class="trz-form-group-title">Imobil</div>

        <div class="ct-grid">
          <label class="ct-field"><span>Dată vânzare <span class="req">*</span></span>
            <input type="date" id="trzDataVanzare" value="${v('dataVanzare')}" required>
          </label>
          <label class="ct-field"><span>Tip</span>
            <select id="trzTip">
              <option value="apartament"${sel('tip','apartament')}>Apartament</option>
              <option value="casa"${sel('tip','casa')}>Casă</option>
              <option value="vila"${sel('tip','vila')}>Vilă</option>
              <option value="spatiu-comercial"${sel('tip','spatiu-comercial')}>Spațiu comercial</option>
              <option value="teren"${sel('tip','teren')}>Teren</option>
            </select>
          </label>
          <label class="ct-field"><span>Cartier / Reper</span>
            <input type="text" id="trzCartier" value="${escapeHtmlAdm(v('cartier'))}" placeholder="ex: Virtuții, Como Park">
          </label>
          <label class="ct-field"><span>Adresă (opțional)</span>
            <input type="text" id="trzAdresa" value="${escapeHtmlAdm(v('adresa'))}" placeholder="str. X nr. Y">
          </label>
        </div>
      </div>

      <div class="trz-form-group">
        <div class="trz-form-group-title">Caracteristici</div>

        <div class="ct-grid">
          <label class="ct-field"><span>Camere</span>
            <select id="trzCamere">
              <option value="">—</option>
              ${[1,2,3,4,5].map(n => `<option value="${n}"${t && t.camere === n ? ' selected':''}>${n}</option>`).join('')}
            </select>
          </label>
          <label class="ct-field"><span>mp utili <span class="req">*</span></span>
            <input type="number" id="trzSuprafataUtila" value="${v('suprafataUtila')}" min="1" step="0.5" required placeholder="59">
          </label>
          <label class="ct-field"><span>mp totali</span>
            <input type="number" id="trzSuprafataTotala" value="${v('suprafataTotala')}" min="1" step="0.5" placeholder="67">
          </label>
          <label class="ct-field"><span>Etaj</span>
            <input type="number" id="trzEtaj" value="${v('etaj')}" placeholder="10">
          </label>
          <label class="ct-field"><span>Total etaje</span>
            <input type="number" id="trzEtajTotal" value="${v('etajTotal')}" placeholder="11">
          </label>
          <label class="ct-field"><span>An construcție</span>
            <input type="number" id="trzAnConstructie" value="${v('anConstructie')}" min="1900" max="2030" placeholder="2024">
          </label>
          <label class="ct-field"><span>Stare</span>
            <select id="trzStare">
              <option value="">—</option>
              <option value="nefinisat"${sel('stare','nefinisat')}>Nefinisat</option>
              <option value="locuibil"${sel('stare','locuibil')}>Locuibil</option>
              <option value="renovat"${sel('stare','renovat')}>Renovat</option>
              <option value="lux"${sel('stare','lux')}>Lux / premium</option>
            </select>
          </label>
          <label class="ct-field"><span>Mobilat</span>
            <select id="trzMobilat">
              <option value="">—</option>
              <option value="nemobilat"${sel('mobilat','nemobilat')}>Nemobilat</option>
              <option value="partial-mobilat"${sel('mobilat','partial-mobilat')}>Parțial</option>
              <option value="mobilat"${sel('mobilat','mobilat')}>Mobilat</option>
              <option value="mobilat-lux"${sel('mobilat','mobilat-lux')}>Mobilat lux</option>
            </select>
          </label>
          <label class="ct-field"><span>Vedere</span>
            <input type="text" id="trzVedere" value="${escapeHtmlAdm(v('vedere'))}" placeholder="lac, oras, curte...">
          </label>
        </div>

        <div style="display:flex;gap:20px;margin-top:10px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="trzParcare" ${v('parcare') ? 'checked' : ''}> Parcare
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="trzBalcon" ${v('balcon') ? 'checked' : ''}> Balcon
          </label>
        </div>
      </div>

      <div class="trz-form-group">
        <div class="trz-form-group-title">Prețuri</div>

        <div class="ct-grid">
          <label class="ct-field"><span>Preț cerut inițial (net, €)</span>
            <input type="number" id="trzPretCerut" value="${v('pretCerut')}" min="1" step="100" placeholder="160000">
          </label>
          <label class="ct-field"><span>Preț obținut (net, €) <span class="req">*</span></span>
            <input type="number" id="trzPretVandut" value="${v('pretVandut')}" min="1" step="100" required placeholder="155000">
          </label>
          <label class="ct-field ct-col2"><span>TVA</span>
            <select id="trzTvaInclus">
              <option value="null"${t && t.tvaInclus == null ? ' selected' : ''}>Necunoscut (nu e specificat în anunț)</option>
              <option value="false"${t && t.tvaInclus === false ? ' selected' : ''}>Net + TVA (prețul NU include TVA)</option>
              <option value="true"${t && t.tvaInclus === true ? ' selected' : ''}>TVA inclus (preț gross)</option>
            </select>
          </label>
          <label class="ct-field"><span>Zile pe piață</span>
            <input type="number" id="trzZilePiata" value="${v('zilePePiata')}" min="0" placeholder="30">
          </label>
          <label class="ct-field"><span>Finanțare</span>
            <select id="trzFinantare">
              <option value="">—</option>
              <option value="cash"${sel('finantare','cash')}>Cash</option>
              <option value="credit"${sel('finantare','credit')}>Credit</option>
              <option value="mixt"${sel('finantare','mixt')}>Mixt</option>
            </select>
          </label>
        </div>
      </div>

      <div class="trz-form-group">
        <div class="trz-form-group-title">Altele</div>
        <label class="ct-field ct-col2"><span>Observații</span>
          <textarea id="trzObservatii" rows="3" placeholder="detalii relevante pentru calibrare CMA...">${escapeHtmlAdm(v('observatii'))}</textarea>
        </label>
      </div>

    </div>`;
}

async function submitTranzactie(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvează...'; }

  const tvaRaw = document.getElementById('trzTvaInclus')?.value;
  const tvaVal = tvaRaw === 'true' ? true : tvaRaw === 'false' ? false : null;

  const obj = {
    id: editingTranzactie?.id || undefined,
    dataVanzare: document.getElementById('trzDataVanzare')?.value,
    tip: document.getElementById('trzTip')?.value || 'apartament',
    cartier: document.getElementById('trzCartier')?.value.trim() || null,
    adresa: document.getElementById('trzAdresa')?.value.trim() || null,
    camere: parseInt(document.getElementById('trzCamere')?.value) || null,
    suprafataUtila: parseFloat(document.getElementById('trzSuprafataUtila')?.value) || null,
    suprafataTotala: parseFloat(document.getElementById('trzSuprafataTotala')?.value) || null,
    etaj: document.getElementById('trzEtaj')?.value !== '' ? parseInt(document.getElementById('trzEtaj').value) : null,
    etajTotal: parseInt(document.getElementById('trzEtajTotal')?.value) || null,
    anConstructie: parseInt(document.getElementById('trzAnConstructie')?.value) || null,
    stare: document.getElementById('trzStare')?.value || null,
    mobilat: document.getElementById('trzMobilat')?.value || null,
    parcare: document.getElementById('trzParcare')?.checked || false,
    balcon: document.getElementById('trzBalcon')?.checked || false,
    vedere: document.getElementById('trzVedere')?.value.trim() || null,
    pretCerut: parseFloat(document.getElementById('trzPretCerut')?.value) || null,
    pretVandut: parseFloat(document.getElementById('trzPretVandut')?.value),
    tvaInclus: tvaVal,
    zilePePiata: parseInt(document.getElementById('trzZilePiata')?.value) || null,
    finantare: document.getElementById('trzFinantare')?.value || null,
    observatii: document.getElementById('trzObservatii')?.value.trim() || null,
  };

  if (!obj.dataVanzare || !obj.suprafataUtila || !obj.pretVandut) {
    showToast('Completează câmpurile obligatorii: dată, mp utili, preț obținut.');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvează'; }
    return;
  }

  try {
    await upsertTranzactie(obj);
    closeTranzactieModal();
    showToast(editingTranzactie ? 'Tranzacție actualizată.' : 'Tranzacție salvată.');
    await renderTranzactiiTable();
  } catch (err) {
    showToast('Eroare la salvare: ' + err.message);
    console.error(err);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvează'; }
  }
}

async function confirmDeleteTranzactie(id) {
  const t = allTranzactiiCache.find(x => x.id === id);
  const label = t ? `${t.cartier || ''} ${t.dataVanzare || ''}`.trim() : id;
  if (!confirm(`Șterge tranzacția "${label}"? Această acțiune nu poate fi anulată.`)) return;
  try {
    await deleteTranzactie(id);
    showToast('Tranzacție ștearsă.');
    await renderTranzactiiTable();
  } catch (err) {
    showToast('Eroare la ștergere: ' + err.message);
    console.error(err);
  }
}
