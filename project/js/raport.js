// ============================================
// RAPORT.JS — Pagina de raport CMA partajabil
// /r/:token → fetch din rapoarte_cma → render
// ============================================

function getToken() {
  const m = location.pathname.match(/\/r\/([^\/?#]+)/);
  if (m) return decodeURIComponent(m[1]);
  return new URLSearchParams(location.search).get('t');
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function fmtEur(v) {
  if (!v && v !== 0) return '—';
  return new Intl.NumberFormat('ro-RO').format(Math.round(+v)) + ' €';
}

function fmtEurMp(v) {
  if (!v && v !== 0) return '—';
  return new Intl.NumberFormat('ro-RO').format(Math.round(+v)) + ' €/mp';
}

function sursaClass(s) {
  const m = { storia: 'sursa-storia', imobiliare: 'sursa-imobiliare', olx: 'sursa-olx' };
  return m[(s||'').toLowerCase()] || '';
}

function incredereClass(v) {
  if (v === 'date') return 'incredere-date';
  if (v === 'prior') return 'incredere-prior';
  return 'incredere-inferenta';
}

function incredereLabel(v) {
  if (v === 'date') return '🟢 date';
  if (v === 'prior') return '🟡 prior';
  return '🔵 inf.';
}

function segmentTag(seg) {
  return seg === 'nou'
    ? '<span class="tag-nou">nou</span>'
    : '<span class="tag-vechi">vechi</span>';
}

function renderTopbar(branded, titlu) {
  const el = document.getElementById('topbar');
  if (!branded) { el.className = 'topbar hidden'; return; }
  el.className = 'topbar';
  el.innerHTML = `
    <div class="tb-brand">EVEN<small>IMOBILIARE</small></div>
    <div class="tb-label"><i class="fa-solid fa-chart-bar" style="color:var(--gold);margin-right:6px"></i>Analiză CMA</div>
  `;
}

function renderFacts(subj) {
  const facts = [];
  if (subj.zona)      facts.push(['Zonă', esc(subj.zona)]);
  if (subj.camere)    facts.push(['Camere', subj.camere]);
  if (subj.mp_util)   facts.push(['Suprafață', subj.mp_util + ' mp']);
  if (subj.etaj)      facts.push(['Etaj', esc(subj.etaj)]);
  if (subj.an)        facts.push(['An', subj.an]);
  if (subj.stare)     facts.push(['Stare', esc(subj.stare)]);
  if (subj.segment)   facts.push(['Tip bloc', subj.segment === 'nou' ? 'Nou' : 'Vechi']);
  if (subj.pret_cerut) facts.push(['Preț cerut', fmtEur(subj.pret_cerut)]);

  return `<div class="facts">${facts.map(([l,v]) =>
    `<div class="fact">
      <div class="fact-label">${l}</div>
      <div class="fact-val">${v}</div>
    </div>`
  ).join('')}</div>`;
}

function renderBanda(banda) {
  if (!banda) return '';
  return `
    <div class="banda-card">
      <div class="section-eyebrow">Bandă de preț · segment ${esc(banda.segment || '')} · evaluare obiectivă</div>
      <div class="banda-range">
        <span class="banda-num">${fmtEur(banda.val_jos)}</span>
        <span class="banda-sep">–</span>
        <span class="banda-num">${fmtEur(banda.val_sus)}</span>
      </div>
      <div class="banda-sub">${fmtEurMp(banda.eur_mp_jos)} – ${fmtEurMp(banda.eur_mp_sus)} · median ${fmtEurMp(banda.eur_mp_median)}</div>
      ${banda.pozitionare ? `<div class="banda-pozitionare"><i class="fa-solid fa-crosshairs"></i> Poziționare: ${esc(banda.pozitionare)}</div>` : ''}
      ${banda.pozitionare_motiv ? `<div style="margin-top:14px;font-size:13.5px;color:rgba(255,255,255,0.75);line-height:1.6">${esc(banda.pozitionare_motiv)}</div>` : ''}
    </div>`;
}

function renderCompsTable(comps) {
  if (!comps || !comps.length) return '<p style="color:var(--muted)">Nicio comparabilă disponibilă.</p>';

  const rows = comps.map(c => {
    const sursaLbl = esc(c.sursa || '—');
    const vechimeTxt = c.vechime_anunt_zile
      ? `<span class="${c.vechime_anunt_zile > 60 ? 'zile-vechi' : ''}">${c.vechime_anunt_zile}z</span>`
      : '—';
    const tipVanz = c.tip_vanzator === 'privat'
      ? '<span class="comp-tip-vanz tip-privat">privat</span>'
      : '<span class="comp-tip-vanz tip-agentie">agenție</span>';
    const urlLink = c.url
      ? `<a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer" class="link-sursa"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
      : '';

    return `<tr>
      <td><span class="comp-sursa ${sursaClass(c.sursa)}">${sursaLbl}</span> ${urlLink}</td>
      <td>${fmtEur(c.pret)}</td>
      <td>${c.mp_util ? c.mp_util + ' mp' : '—'}</td>
      <td>${esc(c.etaj || '—')}</td>
      <td>${c.an || '—'} ${segmentTag(c.segment)}</td>
      <td class="eur-mp-bold">${fmtEurMp(c.eur_mp)}</td>
      <td class="adj-val">${c.adj_val ? fmtEur(c.adj_val) : '—'}</td>
      <td>${c.incredere ? `<span class="incredere-badge ${incredereClass(c.incredere)}">${incredereLabel(c.incredere)}</span>` : '—'}</td>
      <td>${tipVanz}</td>
      <td>${vechimeTxt}</td>
    </tr>`;
  }).join('');

  return `
    <div class="comps-table-wrap">
      <table class="comps">
        <thead>
          <tr>
            <th>Sursă</th>
            <th>Preț</th>
            <th>mp util</th>
            <th>Etaj</th>
            <th>An · tip</th>
            <th>€/mp</th>
            <th>Val. ajustată</th>
            <th>Încredere</th>
            <th>Vânzător</th>
            <th>Vechime</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function drawBandaChart(canvasId, comps, banda) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !banda) return;

  const labels = comps.map((c, i) => c.sursa ? c.sursa.toUpperCase() + ' ' + (i+1) : 'Comp ' + (i+1));
  const eurMp = comps.map(c => c.eur_mp || null);
  const medianVal = banda.eur_mp_median;
  const josVal = banda.eur_mp_jos;
  const susVal = banda.eur_mp_sus;

  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: '€/mp comparabile',
          data: comps.map((c, i) => ({ x: i, y: c.eur_mp || null })),
          backgroundColor: comps.map(c =>
            c.segment === 'nou' ? 'rgba(29,78,216,0.75)' : 'rgba(200,169,110,0.85)'
          ),
          pointRadius: 8,
          pointHoverRadius: 10,
        },
        {
          label: 'Median',
          data: [{ x: -0.5, y: medianVal }, { x: comps.length - 0.5, y: medianVal }],
          type: 'line',
          borderColor: '#1C2340',
          borderWidth: 2,
          borderDash: [6,3],
          pointRadius: 0,
          fill: false,
        },
        {
          label: 'Bandă p25–p75',
          data: [{ x: -0.5, y: josVal }, { x: comps.length - 0.5, y: josVal }],
          type: 'line',
          borderColor: 'rgba(200,169,110,0.4)',
          borderWidth: 1,
          pointRadius: 0,
          fill: '+1',
          backgroundColor: 'rgba(200,169,110,0.10)',
        },
        {
          label: '',
          data: [{ x: -0.5, y: susVal }, { x: comps.length - 0.5, y: susVal }],
          type: 'line',
          borderColor: 'rgba(200,169,110,0.4)',
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
        },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              if (ctx.datasetIndex !== 0) return null;
              const c = comps[ctx.dataIndex];
              return [
                `${c.sursa?.toUpperCase()} · ${c.mp_util || '?'} mp · an ${c.an || '?'}`,
                `€/mp: ${new Intl.NumberFormat('ro-RO').format(Math.round(c.eur_mp || 0))}`,
                c.tip_vanzator ? `Vânzător: ${c.tip_vanzator}` : '',
              ].filter(Boolean);
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          min: -0.5,
          max: comps.length - 0.5,
          ticks: {
            stepSize: 1,
            callback: (v) => {
              const i = Math.round(v);
              if (i < 0 || i >= comps.length) return '';
              return labels[i];
            },
            maxRotation: 30,
            font: { size: 11 },
          },
          grid: { display: false },
        },
        y: {
          ticks: {
            callback: v => new Intl.NumberFormat('ro-RO').format(v),
            font: { size: 11 },
          },
          grid: { color: 'rgba(0,0,0,0.05)' },
        }
      }
    }
  });
}

function drawAdjChart(canvasId, comps) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const withAdj = comps.filter(c => c.adj_val);
  if (!withAdj.length) {
    ctx.closest('.chart-card').style.display = 'none';
    return;
  }

  const labels = withAdj.map((c, i) => (c.sursa || '').toUpperCase() + ' ' + (i+1));
  const colors = withAdj.map(c => {
    if (c.incredere === 'date') return 'rgba(21,128,61,0.80)';
    if (c.incredere === 'prior') return 'rgba(161,98,7,0.75)';
    return 'rgba(29,78,216,0.70)';
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Valoare ajustată la subiect (€)',
        data: withAdj.map(c => c.adj_val),
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const c = withAdj[ctx.dataIndex];
              return [
                `Valoare ajustată: ${new Intl.NumberFormat('ro-RO').format(Math.round(c.adj_val))} €`,
                `Preț cerut: ${new Intl.NumberFormat('ro-RO').format(Math.round(c.pret || 0))} €`,
                `Ajustări: ${c.n_adj || 0} · Încredere: ${c.incredere || '—'}`,
              ];
            }
          }
        }
      },
      scales: {
        x: { ticks: { font: { size: 11 } }, grid: { display: false } },
        y: {
          ticks: {
            callback: v => new Intl.NumberFormat('ro-RO').format(v),
            font: { size: 11 },
          },
          grid: { color: 'rgba(0,0,0,0.05)' }
        }
      }
    }
  });
}

function renderPage(r) {
  const branded = r.branded !== false;
  const subj = r.subiect || {};
  const comps = r.comps || [];
  const banda = r.banda || null;

  renderTopbar(branded, r.titlu);

  const now = new Date();
  const dateStr = now.toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' });

  document.getElementById('root').innerHTML = `
    <div class="wrap page">

      <div class="rpt-header">
        <div class="rpt-eyebrow"><i class="fa-solid fa-chart-bar"></i> Analiză comparativă de piață</div>
        <h1 class="rpt-title">${esc(r.titlu)}</h1>
        <div class="rpt-meta">
          ${comps.length} comparabile · surse: imobiliare.ro · Storia · OLX
          · generat ${esc(dateStr)}
        </div>
      </div>

      ${renderFacts(subj)}

      ${banda ? renderBanda(banda) : ''}

      <div class="section">
        <div class="section-eyebrow">Comparabile</div>
        <h2 class="section-title">Anunțuri similare pe piață</h2>
        ${renderCompsTable(comps)}
      </div>

      <div class="section">
        <div class="section-eyebrow">Vizualizare</div>
        <h2 class="section-title">Distribuție €/mp · bandă de valoare</h2>
        <div class="chart-card">
          <div class="chart-title"><i class="fa-solid fa-chart-scatter" style="color:var(--gold)"></i> €/mp per comparabilă față de banda p25–p75</div>
          <div class="chart-wrap"><canvas id="chartBanda"></canvas></div>
          <div style="margin-top:12px;display:flex;gap:16px;flex-wrap:wrap;font-size:11.5px;color:var(--muted)">
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:rgba(200,169,110,0.85);margin-right:4px"></span>Bloc vechi</span>
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:rgba(29,78,216,0.75);margin-right:4px"></span>Bloc nou</span>
            <span><span style="display:inline-block;width:20px;height:2px;background:#1C2340;margin-right:4px;vertical-align:middle"></span>Median</span>
            <span><span style="display:inline-block;width:20px;height:10px;background:rgba(200,169,110,0.15);border:1px solid rgba(200,169,110,0.4);margin-right:4px"></span>Bandă p25–p75</span>
          </div>
        </div>

        <div class="chart-card" id="adjChartCard">
          <div class="chart-title"><i class="fa-solid fa-sliders" style="color:var(--gold)"></i> Valoare ajustată la subiect per comparabilă</div>
          <div class="chart-wrap"><canvas id="chartAdj"></canvas></div>
          <div style="margin-top:12px;display:flex;gap:16px;flex-wrap:wrap;font-size:11.5px;color:var(--muted)">
            <span><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:rgba(21,128,61,0.80);margin-right:4px"></span>🟢 din date</span>
            <span><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:rgba(161,98,7,0.75);margin-right:4px"></span>🟡 prior șablon</span>
            <span><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:rgba(29,78,216,0.70);margin-right:4px"></span>🔵 inferență</span>
          </div>
        </div>
      </div>

      ${r.voce ? `
      <div class="section">
        <div class="section-eyebrow">Perspectiva EVEN</div>
        <h2 class="section-title">Citire pentru proprietar</h2>
        <div class="voce-card">
          <div class="voce-label"><i class="fa-solid fa-quote-left"></i> Vocea EVEN</div>
          <div class="voce-text">${esc(r.voce)}</div>
        </div>
      </div>` : ''}

      <div class="onestitate">
        <i class="fa-solid fa-circle-info" style="color:var(--gold);margin-right:6px"></i>
        <strong>Onestitate:</strong> Prețurile din această analiză sunt prețuri <em>cerute</em>, nu neapărat prețuri <em>obținute</em> la tranzacție.
        Eșantionul reflectă stocul activ la data generării. O analiză mai precisă include tranzacțiile reale din zonă.
      </div>

    </div>`;

  document.getElementById('footer').style.display = 'block';
  if (!branded) {
    document.querySelectorAll('.branded-only').forEach(el => el.style.display = 'none');
  }

  // Grafice după ce DOM-ul e randat
  requestAnimationFrame(() => {
    if (comps.length) drawBandaChart('chartBanda', comps, banda);
    if (comps.length) drawAdjChart('chartAdj', comps);
  });
}

function renderError(msg) {
  document.getElementById('root').innerHTML = `
    <div class="state">
      <div class="f-brand">EVEN</div>
      <p>${esc(msg)}</p>
    </div>`;
}

async function init() {
  const token = getToken();
  if (!token) { renderError('Link invalid sau expirat.'); return; }

  try {
    const { data, error } = await _supabase
      .from('rapoarte_cma')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) {
      renderError('Raportul nu a fost găsit sau a fost dezactivat.');
      return;
    }
    renderPage(data);
  } catch (e) {
    renderError('Eroare la încărcarea raportului.');
  }
}

if (document.readyState !== 'loading') init();
else document.addEventListener('DOMContentLoaded', init);
