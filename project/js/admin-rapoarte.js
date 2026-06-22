// ============================================================
// ADMIN-RAPOARTE.JS — Rapoarte CMA partajabile
// Publică JSON canonic din skill → link /r/:token
// ============================================================

let allRapoarteCache = [];

const CMA_REQUIRED = ['titlu', 'subiect', 'comps', 'banda'];
const BASE_URL = (() => {
  const o = window.location.origin;
  return (o && o.startsWith('http')) ? o : 'https://www.even-imobiliare.ro';
})();

// ---------- RENDER TABLE ----------

async function renderRapoarteTable() {
  const wrap = document.getElementById('rapoarteWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div style="padding:24px;color:var(--gray-400)"><i class="fa-solid fa-spinner fa-spin"></i> Se încarcă...</div>';

  try {
    const list = await getCmaRapoarte();
    allRapoarteCache = list;

    if (!list.length) {
      wrap.innerHTML = `
        <div style="padding:40px;text-align:center;color:var(--gray-500);background:var(--gray-50);border-radius:8px">
          <i class="fa-solid fa-chart-bar" style="font-size:28px;margin-bottom:12px;opacity:0.3"></i>
          <div>Niciun raport publicat. Folosește formularul de mai sus.</div>
        </div>`;
      return;
    }

    const rows = list.map(r => {
      const link = BASE_URL + '/r/' + r.token;
      const dataStr = r.createdAt
        ? new Date(r.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';
      const activBadge = r.activ
        ? '<span class="apl-pill" style="background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0">activ</span>'
        : '<span class="apl-pill" style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca">dezactivat</span>';
      const brandedBadge = r.branded
        ? '<span class="apl-pill" style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa">EVEN</span>'
        : '<span class="apl-pill" style="color:var(--gray-400)">neutru</span>';
      const compsCount = Array.isArray(r.comps) ? r.comps.length : 0;

      return `<tr>
        <td>
          <div style="font-weight:600;color:var(--gray-900)">${escapeHtmlAdm(r.titlu)}</div>
          <div style="font-size:11px;color:var(--gray-400);margin-top:2px">${compsCount} comparabile</div>
        </td>
        <td>${activBadge} ${brandedBadge}</td>
        <td style="font-size:12px;color:var(--gray-500)">${dataStr}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <a href="${escapeHtmlAdm(link)}" target="_blank" rel="noopener"
               style="font-size:12px;color:var(--apl-blue);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block"
               title="${escapeHtmlAdm(link)}">/r/${escapeHtmlAdm(r.token)}</a>
            <span class="icon-btn" onclick="copyCmaLink('${escapeHtmlAdm(link)}')" title="Copiază link">
              <i class="fa-regular fa-copy"></i>
            </span>
          </div>
        </td>
        <td>
          <div style="display:flex;gap:6px">
            <a class="icon-btn" href="${escapeHtmlAdm(link)}" target="_blank" rel="noopener" title="Deschide raport">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
            ${r.activ
              ? `<span class="icon-btn apl-danger-hover" onclick="dezactivezaRaport(${r.id})" title="Dezactivează">
                  <i class="fa-solid fa-eye-slash"></i>
                 </span>`
              : `<span class="icon-btn" style="opacity:0.35" title="Dezactivat">
                  <i class="fa-solid fa-eye-slash"></i>
                 </span>`
            }
          </div>
        </td>
      </tr>`;
    });

    wrap.innerHTML = `
      <table class="apl-table">
        <thead>
          <tr>
            <th>Proprietate</th>
            <th>Status</th>
            <th>Data</th>
            <th>Link</th>
            <th>Acțiuni</th>
          </tr>
        </thead>
        <tbody>${rows.join('')}</tbody>
      </table>`;

  } catch (e) {
    wrap.innerHTML = `<div style="padding:24px;color:#b91c1c">Eroare la încărcare: ${escapeHtmlAdm(e.message)}</div>`;
  }
}

// ---------- PUBLICĂ ----------

function openPublicaModal() {
  document.getElementById('raportJsonInput').value = '';
  document.getElementById('raportPublicaResult').style.display = 'none';
  document.getElementById('raportPublicaErr').style.display = 'none';
  _resetPreview();
  document.getElementById('raportPublicaModal').classList.add('open');
}

function closePublicaModal() {
  _resetPreview();
  document.getElementById('raportPublicaModal').classList.remove('open');
}

async function submitPublicaRaport() {
  const btn = document.getElementById('raportPublicaBtn');
  const errEl = document.getElementById('raportPublicaErr');
  const resultEl = document.getElementById('raportPublicaResult');
  errEl.style.display = 'none';
  resultEl.style.display = 'none';

  const raw = document.getElementById('raportJsonInput').value.trim();
  if (!raw) { showRaportErr('Lipsa JSON.'); return; }

  let parsed;
  try { parsed = JSON.parse(raw); }
  catch (e) { showRaportErr('JSON invalid: ' + e.message); return; }

  for (const f of CMA_REQUIRED) {
    if (!parsed[f]) { showRaportErr(`Câmp obligatoriu lipsă: "${f}"`); return; }
  }
  if (!Array.isArray(parsed.comps) || !parsed.comps.length) {
    showRaportErr('Câmpul "comps" trebuie să fie un array cu cel puțin o comparabilă.');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Se publică...';

  try {
    // Îmbogățim banda cu estimarea ponderată din obiectiv (câmp extra în JSONB, fără migrare)
    const bandaSave = { ...parsed.banda };
    if (parsed.obiectiv?.ponderat) bandaSave.val_ponderat = parsed.obiectiv.ponderat;

    const saved = await upsertCmaRaport({
      titlu: parsed.titlu,
      branded: parsed.branded !== false,
      subiect: parsed.subiect,
      comps: parsed.comps,
      banda: bandaSave,
      voce: parsed.voce || '',
    });

    const link = BASE_URL + '/r/' + saved.token;
    document.getElementById('raportLinkEl').textContent = link;
    document.getElementById('raportLinkEl').href = link;
    resultEl.style.display = 'block';
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Publicat';
    await renderRapoarteTable();
  } catch (e) {
    showRaportErr('Eroare la publicare: ' + e.message);
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publică';
  }
}

function showRaportErr(msg) {
  const el = document.getElementById('raportPublicaErr');
  el.textContent = msg;
  el.style.display = 'block';
}

async function copyCmaLink(link) {
  try {
    await navigator.clipboard.writeText(link);
    showToast('Link copiat!');
  } catch {
    prompt('Copiază linkul:', link);
  }
}

async function dezactivezaRaport(id) {
  if (!confirm('Dezactivezi raportul? Linkul nu va mai funcționa.')) return;
  try {
    await deactivateCmaRaport(id);
    showToast('Raport dezactivat.');
    await renderRapoarteTable();
  } catch (e) {
    showToast('Eroare: ' + e.message);
  }
}

// ---------- PREVIEW & PDF ----------

let _cmaPreviewData = null;

function _resetPreview() {
  _cmaPreviewData = null;
  const bar  = document.getElementById('raportPreviewBar');
  const body = document.getElementById('raportPreviewBody');
  const card = document.getElementById('raportModalCard');
  if (bar)  bar.style.display = 'none';
  if (card) card.style.maxWidth = '680px';
  if (body && window.CmaView) CmaView.destroy(body);
}

function onRaportJsonInput() {
  const raw = (document.getElementById('raportJsonInput')?.value || '').trim();
  if (!raw) { _resetPreview(); return; }

  let data;
  try { data = JSON.parse(raw); } catch { _resetPreview(); return; }

  for (const f of CMA_REQUIRED) {
    if (!data[f]) { _resetPreview(); return; }
  }
  if (!Array.isArray(data.comps) || !data.comps.length) { _resetPreview(); return; }

  // Îmbogățire bandă cu estimarea ponderată din obiectiv
  if (data.obiectiv?.ponderat && data.banda) {
    data.banda.val_ponderat = data.obiectiv.ponderat;
  }

  _cmaPreviewData = data;

  const bar  = document.getElementById('raportPreviewBar');
  const body = document.getElementById('raportPreviewBody');
  const card = document.getElementById('raportModalCard');
  const tog  = document.getElementById('raportPreviewToggle');

  if (card) card.style.maxWidth = '980px';
  if (bar)  bar.style.display = 'block';
  if (tog)  tog.textContent = '▲ Ascunde';
  if (body) body.style.display = 'block';

  if (body && window.CmaView) CmaView.render(data, body);
}

function toggleRaportPreview() {
  const body = document.getElementById('raportPreviewBody');
  const tog  = document.getElementById('raportPreviewToggle');
  if (!body || !tog) return;
  const hidden = body.style.display === 'none';
  body.style.display = hidden ? 'block' : 'none';
  tog.textContent = hidden ? '▲ Ascunde' : '▼ Arată';
}

async function printCmaReport() {
  if (!_cmaPreviewData || !window.CmaView) return;

  const root = document.getElementById('cma-print-root');
  if (!root) return;

  CmaView.render(_cmaPreviewData, root);

  // Așteptăm ca Chart.js să termine redarea pe canvas
  await new Promise(r => requestAnimationFrame(() => setTimeout(r, 450)));
  window.print();
}
