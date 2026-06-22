// ============================================================
// CMA-VIEW.JS — Renderer partajat raport CMA
// Faza A: contract JSON + modul comun
// Faza B: 3 grafice brand-corecte
// Faza D: @media print
// Depinde de: Chart.js 4.x, fonturi Cormorant + DM Sans
// API: CmaView.render(data, el) | CmaView.destroy(el)
// ============================================================

const CmaView = (function () {

  // ── Paletă EVEN (Brand Guidelines §4) ────────────────────
  const C = {
    midnight:  '#1C2340',
    midnightSoft: '#243056',
    sage:      '#7A9B92',
    sageMid:   '#9AB5AD',
    gold:      '#C8A96E',
    paper:     '#FAF8F2',
    linen:     '#F1F0EC',
    pebble:    '#E8E4DC',
    stone:     '#D6D2C7',
    slateNavy: '#3B5A7A',
    moss:      '#5A7A52',
    mossMid:   '#7A9A72',
    ink:       '#2A2A2A',
    muted:     '#7A7670',
  };

  // ── Helpers ───────────────────────────────────────────────
  let _stylesInjected = false;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function fmt(v) {
    if (v == null || v === '') return '—';
    return new Intl.NumberFormat('ro-RO').format(Math.round(+v));
  }
  const fmtEur   = v => (v == null ? '—' : fmt(v) + ' €');
  const fmtEurMp = v => (v == null ? '—' : fmt(v) + ' €/mp');

  // ── CSS Injection ─────────────────────────────────────────
  function injectStyles() {
    if (_stylesInjected || document.getElementById('cmav-styles')) { _stylesInjected = true; return; }
    _stylesInjected = true;

    const css = `
/* ═══ CmaView — scoped styles ═══════════════════════════════ */
.cmav {
  font-family: 'DM Sans', -apple-system, sans-serif;
  color: ${C.ink};
  background: ${C.linen};
  padding: 32px;
  border-radius: 20px;
  -webkit-font-smoothing: antialiased;
}

/* Header */
.cmav-eyebrow {
  font-size: 10px; letter-spacing: 0.26em; text-transform: uppercase;
  font-weight: 600; color: ${C.sage}; margin-bottom: 6px;
}
.cmav-title {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 26px; font-weight: 500; color: ${C.midnight};
  margin: 0 0 4px; line-height: 1.15;
}
.cmav-meta {
  font-size: 12px; color: ${C.muted}; margin-bottom: 28px;
}

/* Facts strip */
.cmav-facts {
  display: flex; flex-wrap: wrap; gap: 0;
  border: 1px solid ${C.pebble}; border-radius: 12px; overflow: hidden;
  margin-bottom: 24px; background: ${C.pebble};
}
.cmav-fact { background: ${C.paper}; padding: 15px 18px; flex: 1 1 110px; }
.cmav-fact-label {
  font-size: 9.5px; letter-spacing: 0.18em; text-transform: uppercase;
  color: ${C.muted}; margin-bottom: 5px;
}
.cmav-fact-val {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 19px; font-weight: 600; color: ${C.midnight}; line-height: 1;
}

/* Banda hero (dark card) */
.cmav-banda {
  background: ${C.midnight}; color: #fff;
  border-radius: 16px; padding: 26px 30px; margin-bottom: 24px;
}
.cmav-banda-eyebrow {
  font-size: 10px; letter-spacing: 0.26em; text-transform: uppercase;
  font-weight: 600; color: ${C.sage}; margin-bottom: 12px;
}
.cmav-banda-range {
  display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-bottom: 6px;
}
.cmav-banda-num {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(24px, 3.2vw, 36px); font-weight: 600; line-height: 1;
}
.cmav-banda-sep { color: rgba(255,255,255,0.25); font-size: 20px; }
.cmav-banda-sub {
  font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 14px; line-height: 1.6;
}
.cmav-estimare {
  display: inline-flex; align-items: baseline; gap: 12px; flex-wrap: wrap;
  background: rgba(200,169,110,0.11); border: 1px solid rgba(200,169,110,0.32);
  border-radius: 10px; padding: 12px 20px;
}
.cmav-est-label {
  font-size: 9.5px; letter-spacing: 0.2em; text-transform: uppercase;
  color: rgba(255,255,255,0.45); font-weight: 600;
}
.cmav-est-val {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 28px; font-weight: 600; color: ${C.gold}; line-height: 1;
}
.cmav-pozitionare {
  margin-top: 14px; font-size: 13px; color: rgba(255,255,255,0.6);
  font-style: italic; line-height: 1.65;
}

/* Charts grid */
.cmav-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 24px;
}
.cmav-chart-full { grid-column: 1 / -1; }
.cmav-chart-card {
  background: ${C.paper}; border: 1px solid ${C.pebble};
  border-radius: 14px; padding: 22px 22px 18px;
}
.cmav-chart-title {
  font-size: 9.5px; letter-spacing: 0.2em; text-transform: uppercase;
  font-weight: 600; color: ${C.muted}; margin-bottom: 14px;
}
.cmav-chart-wrap { position: relative; }
.cmav-chart-wrap.h220 { height: 220px; }
.cmav-chart-wrap.h180 { height: 180px; }
.cmav-chart-legend {
  display: flex; gap: 12px; flex-wrap: wrap; margin-top: 10px;
  font-size: 11px; color: ${C.muted};
}
.cmav-ldot {
  display: inline-block; width: 7px; height: 7px; border-radius: 50%;
  margin-right: 4px; vertical-align: middle;
}
.cmav-lline {
  display: inline-block; width: 14px; height: 0; border-top: 1.5px dashed;
  margin-right: 4px; vertical-align: middle;
}
.cmav-lband {
  display: inline-block; width: 14px; height: 8px;
  background: rgba(200,169,110,0.12); border: 1px solid rgba(200,169,110,0.35);
  margin-right: 4px; vertical-align: middle;
}

/* Table section */
.cmav-table-sec {
  background: ${C.paper}; border: 1px solid ${C.pebble};
  border-radius: 14px; overflow: hidden; margin-bottom: 24px;
}
.cmav-table-head { padding: 18px 22px 0; }
.cmav-sec-eyebrow {
  font-size: 9.5px; letter-spacing: 0.2em; text-transform: uppercase;
  font-weight: 600; color: ${C.sage}; margin-bottom: 3px;
}
.cmav-sec-title {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 19px; font-weight: 500; color: ${C.midnight}; margin: 0 0 14px;
}
.cmav-tscroll { overflow-x: auto; }
.cmav-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.cmav-table thead th {
  background: ${C.midnight}; color: rgba(255,255,255,0.72);
  font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase;
  font-weight: 600; padding: 10px 12px; text-align: left; white-space: nowrap;
}
.cmav-table tbody td {
  padding: 10px 12px; border-bottom: 1px solid ${C.pebble}; vertical-align: middle;
}
.cmav-table tbody tr:last-child td { border-bottom: none; }
.cmav-table tbody tr:hover td { background: ${C.linen}; }
.cmav-table .cmav-tr-vandut td { background: rgba(90,122,82,0.05); }
.cmav-table .cmav-tr-vandut:hover td { background: rgba(90,122,82,0.09); }
.cmav-sbadge {
  font-size: 9.5px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase;
  padding: 2px 7px; border-radius: 4px; white-space: nowrap;
}
.sb-storia    { background: #E0F2FE; color: #0369A1; }
.sb-imob      { background: #FFF7ED; color: #C2410C; }
.sb-olx       { background: #F0FDF4; color: #15803D; }
.sb-vandut    { background: rgba(90,122,82,0.14); color: ${C.moss}; }
.cmav-inc {
  font-size: 9.5px; padding: 2px 6px; border-radius: 4px; font-weight: 600;
}
.inc-date  { background: #DCFCE7; color: #15803D; }
.inc-prior { background: #FEF9C3; color: #A16207; }
.inc-inf   { background: #EFF6FF; color: #1D4ED8; }
.cmav-eur-bold { font-weight: 700; color: ${C.midnight}; }
.cmav-tag-nou   { color: ${C.moss}; font-size: 10px; font-weight: 600; }
.cmav-tag-vechi { color: ${C.muted}; font-size: 10px; }
.cmav-zile-old  { color: #B45309; font-weight: 600; }
.cmav-link-src  { color: ${C.gold}; font-size: 11px; margin-left: 4px; text-decoration: none; }
.cmav-link-src:hover { text-decoration: underline; }

/* Voce EVEN */
.cmav-voce {
  background: ${C.midnight}; border-radius: 14px; padding: 26px 30px; margin-bottom: 24px;
}
.cmav-voce-label {
  font-size: 9.5px; letter-spacing: 0.2em; text-transform: uppercase;
  font-weight: 600; color: ${C.sage}; margin-bottom: 12px;
}
.cmav-voce-text {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 17px; line-height: 1.85; color: rgba(255,255,255,0.82); white-space: pre-line;
}

/* Disclaimer */
.cmav-disclaimer {
  font-size: 12px; color: ${C.muted}; line-height: 1.7;
  border-top: 1px solid ${C.pebble}; padding-top: 18px;
}

/* ── @media print ─────────────────────────────────────────── */
@media print {
  body > * { display: none !important; }
  body > #cma-print-root { display: block !important; }
  .modal, .apl-shell, .apl-login, .toast { display: none !important; }

  #cma-print-root {
    display: block !important;
    position: static !important;
    margin: 0 !important;
  }
  #cma-print-root .cmav {
    background: #fff !important;
    padding: 16mm 18mm !important;
    border-radius: 0 !important;
  }
  #cma-print-root .cmav-banda,
  #cma-print-root .cmav-voce {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  #cma-print-root .cmav-table thead {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  #cma-print-root .cmav-table-sec,
  #cma-print-root .cmav-chart-card,
  #cma-print-root .cmav-banda { page-break-inside: avoid; }
  #cma-print-root .cmav-charts { grid-template-columns: 1fr 1fr; }
  #cma-print-root::after {
    content: 'EVEN · Analiză comparativă de piață · even-imobiliare.ro';
    display: block; text-align: center; font-size: 10px; color: #888;
    margin-top: 24px; padding-top: 10px; border-top: 1px solid #e0e0e0;
    font-family: 'DM Sans', sans-serif; letter-spacing: 0.05em;
  }
}

@media (max-width: 640px) {
  .cmav-charts { grid-template-columns: 1fr; }
  .cmav-chart-full { grid-column: 1; }
}
`;
    const el = document.createElement('style');
    el.id = 'cmav-styles';
    el.textContent = css;
    document.head.appendChild(el);
  }

  // ── HTML Builders ─────────────────────────────────────────

  function buildFacts(subj) {
    if (!subj) return '';
    const items = [];
    if (subj.zona)      items.push(['Zonă',     esc(subj.zona)]);
    if (subj.camere)    items.push(['Camere',   subj.camere]);
    if (subj.mp_util)   items.push(['Suprafață', subj.mp_util + ' mp']);
    if (subj.etaj)      items.push(['Etaj',     esc(subj.etaj)]);
    if (subj.an)        items.push(['An',       subj.an]);
    if (subj.stare)     items.push(['Stare',    esc(subj.stare)]);
    if (subj.segment)   items.push(['Tip bloc', subj.segment === 'nou' ? 'Nou' : 'Vechi']);
    if (subj.pret_cerut) items.push(['Preț cerut', fmtEur(subj.pret_cerut)]);
    if (!items.length) return '';

    return `<div class="cmav-facts">${
      items.map(([l, v]) => `<div class="cmav-fact">
        <div class="cmav-fact-label">${l}</div>
        <div class="cmav-fact-val">${v}</div>
      </div>`).join('')
    }</div>`;
  }

  function buildBanda(banda) {
    if (!banda) return '';
    const hasPonderat = banda.val_ponderat != null;
    return `<div class="cmav-banda">
      <div class="cmav-banda-eyebrow">Bandă de preț · evaluare obiectivă</div>
      <div class="cmav-banda-range">
        <span class="cmav-banda-num">${fmtEur(banda.val_jos)}</span>
        <span class="cmav-banda-sep">–</span>
        <span class="cmav-banda-num">${fmtEur(banda.val_sus)}</span>
      </div>
      <div class="cmav-banda-sub">
        ${fmtEurMp(banda.eur_mp_jos)} – ${fmtEurMp(banda.eur_mp_sus)}
        · median ${fmtEurMp(banda.eur_mp_median)}
        ${banda.segment ? `· segment ${esc(banda.segment)}` : ''}
      </div>
      ${hasPonderat ? `<div class="cmav-estimare">
        <span class="cmav-est-label">Estimare EVEN</span>
        <span class="cmav-est-val">${fmtEur(banda.val_ponderat)}</span>
      </div>` : ''}
      ${banda.pozitionare_motiv ? `<div class="cmav-pozitionare">${esc(banda.pozitionare_motiv)}</div>` : ''}
    </div>`;
  }

  function buildCharts() {
    return `<div class="cmav-charts">

      <div class="cmav-chart-card cmav-chart-full">
        <div class="cmav-chart-title">Distribuție €/mp · Bandă de valoare p25–p75</div>
        <div class="cmav-chart-wrap h220"><canvas class="cmav-c-banda"></canvas></div>
        <div class="cmav-chart-legend">
          <span><i class="cmav-ldot" style="background:${C.slateNavy}"></i>Bloc nou</span>
          <span><i class="cmav-ldot" style="background:${C.stone}"></i>Bloc vechi</span>
          <span><i class="cmav-ldot" style="background:${C.moss}"></i>Vândut</span>
          <span><i class="cmav-lline" style="border-color:${C.midnight}"></i>Median</span>
          <span><i class="cmav-lband"></i>Bandă p25–p75</span>
        </div>
      </div>

      <div class="cmav-chart-card">
        <div class="cmav-chart-title">Compoziție încredere ajustări</div>
        <div class="cmav-chart-wrap h180" style="display:flex;align-items:center;justify-content:center">
          <canvas class="cmav-c-donut" width="180" height="180"></canvas>
        </div>
      </div>

      <div class="cmav-chart-card">
        <div class="cmav-chart-title">Distribuție €/mp · Nou vs Vechi</div>
        <div class="cmav-chart-wrap h180"><canvas class="cmav-c-strip"></canvas></div>
        <div class="cmav-chart-legend">
          <span><i class="cmav-ldot" style="background:${C.slateNavy}"></i>Bloc nou</span>
          <span><i class="cmav-ldot" style="background:${C.stone}"></i>Bloc vechi</span>
        </div>
      </div>

    </div>`;
  }

  function buildTable(comps) {
    if (!comps || !comps.length) return '';

    const rows = comps.map(c => {
      const isVandut = !!c.vandut;
      let sbCls, sbLbl;
      if (isVandut) {
        sbCls = 'sb-vandut'; sbLbl = '🔒 Vândut';
      } else {
        const sMap = { storia: 'sb-storia', imobiliare: 'sb-imob', olx: 'sb-olx' };
        sbCls = sMap[(c.sursa || '').toLowerCase()] || '';
        sbLbl = esc(c.sursa || '—');
      }
      const incCls = c.incredere === 'date' ? 'inc-date' : c.incredere === 'prior' ? 'inc-prior' : 'inc-inf';
      const incLbl = c.incredere === 'date' ? '🟢 date' : c.incredere === 'prior' ? '🟡 prior' : '🔵 inf.';
      const segTag = c.segment === 'nou'
        ? '<span class="cmav-tag-nou">nou</span>'
        : '<span class="cmav-tag-vechi">vechi</span>';
      const zileCls = (c.vechime_anunt_zile || 0) > 90 ? ' cmav-zile-old' : '';
      const zileTxt = c.vechime_anunt_zile ? `<span class="${zileCls}">${c.vechime_anunt_zile}z</span>` : '—';
      const urlLink = (c.url && !isVandut)
        ? `<a href="${esc(c.url)}" target="_blank" rel="noopener" class="cmav-link-src">↗</a>` : '';

      return `<tr class="${isVandut ? 'cmav-tr-vandut' : ''}">
        <td><span class="cmav-sbadge ${sbCls}">${sbLbl}</span>${urlLink}</td>
        <td>${fmtEur(c.pret)}</td>
        <td>${c.mp_util ? c.mp_util + ' mp' : '—'}</td>
        <td>${esc(c.etaj || '—')}</td>
        <td>${c.an || '—'} ${segTag}</td>
        <td class="cmav-eur-bold">${fmtEurMp(c.eur_mp)}</td>
        <td>${c.adj_val ? fmtEur(c.adj_val) : '—'}</td>
        <td><span class="cmav-inc ${incCls}">${incLbl}</span></td>
        <td>${c.tip_vanzator === 'privat' ? 'privat' : 'agenție'}</td>
        <td>${zileTxt}</td>
      </tr>`;
    }).join('');

    return `<div class="cmav-table-sec">
      <div class="cmav-table-head">
        <div class="cmav-sec-eyebrow">Comparabile</div>
        <h3 class="cmav-sec-title" style="font-family:'Cormorant Garamond',Georgia,serif">Anunțuri similare · aduse la subiect</h3>
      </div>
      <div class="cmav-tscroll">
        <table class="cmav-table">
          <thead><tr>
            <th>Sursă</th><th>Preț</th><th>mp util</th><th>Etaj</th>
            <th>An · tip</th><th>€/mp</th><th>Val. ajustată</th>
            <th>Încredere</th><th>Vânzător</th><th>Vechime</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
  }

  function buildVoce(voce) {
    if (!voce) return '';
    return `<div class="cmav-voce">
      <div class="cmav-voce-label">Perspectiva EVEN · Citire pentru proprietar</div>
      <div class="cmav-voce-text">${esc(voce)}</div>
    </div>`;
  }

  function buildHTML(data) {
    const subj   = data.subiect || {};
    const comps  = data.comps   || [];
    const banda  = data.banda   || null;
    const branded = data.branded !== false;
    const dateStr = new Date().toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' });

    return `<div class="cmav">
      <div class="cmav-eyebrow">${branded ? 'EVEN · ' : ''}Analiză comparativă de piață</div>
      <h2 class="cmav-title" style="font-family:'Cormorant Garamond',Georgia,serif">${esc(data.titlu || '—')}</h2>
      <div class="cmav-meta">${comps.length} comparabile · generat ${esc(dateStr)}</div>
      ${buildFacts(subj)}
      ${buildBanda(banda)}
      ${buildCharts()}
      ${buildTable(comps)}
      ${buildVoce(data.voce)}
      <div class="cmav-disclaimer">
        <strong>Onestitate:</strong> Prețurile din această analiză sunt prețuri <em>cerute</em>,
        nu neapărat prețuri <em>obținute</em> la tranzacție. Eșantionul reflectă stocul activ la
        data generării. O analiză mai precisă include tranzacțiile reale din zonă.
      </div>
    </div>`;
  }

  // ── Chart Renderers ───────────────────────────────────────

  function drawBanda(canvas, comps, banda) {
    if (!canvas || !banda || !window.Chart) return;
    const n = comps.length;
    if (!n) return;

    const jos    = banda.eur_mp_jos;
    const sus    = banda.eur_mp_sus;
    const median = banda.eur_mp_median;

    const dotColors = comps.map(c => c.vandut ? C.moss : (c.segment === 'nou' ? C.slateNavy : C.stone));

    new Chart(canvas, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: '€/mp',
            data: comps.map((c, i) => ({ x: i, y: c.eur_mp || null })),
            backgroundColor: dotColors,
            pointRadius: 7, pointHoverRadius: 9,
          },
          {
            label: '_jos',
            data: [{ x: -0.5, y: jos }, { x: n - 0.5, y: jos }],
            type: 'line',
            borderColor: 'rgba(200,169,110,0.32)', borderWidth: 1,
            pointRadius: 0, fill: '+1',
            backgroundColor: 'rgba(200,169,110,0.07)',
          },
          {
            label: '_sus',
            data: [{ x: -0.5, y: sus }, { x: n - 0.5, y: sus }],
            type: 'line',
            borderColor: 'rgba(200,169,110,0.32)', borderWidth: 1,
            pointRadius: 0, fill: false,
          },
          {
            label: '_median',
            data: [{ x: -0.5, y: median }, { x: n - 0.5, y: median }],
            type: 'line',
            borderColor: C.midnight, borderWidth: 1.5,
            borderDash: [5, 3], pointRadius: 0, fill: false,
          },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            filter: ctx => ctx.datasetIndex === 0,
            callbacks: {
              label: ctx => {
                const c = comps[ctx.dataIndex];
                if (!c) return null;
                return [
                  `${c.vandut ? '🔒 VÂNDUT' : (c.sursa || '?').toUpperCase()} · ${c.mp_util || '?'} mp · ${c.an || '?'}`,
                  `€/mp: ${fmt(c.eur_mp)}`,
                ];
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear', min: -0.5, max: n - 0.5,
            ticks: {
              stepSize: 1,
              callback: v => {
                const i = Math.round(v);
                if (i < 0 || i >= n) return '';
                const c = comps[i];
                return c.vandut ? '🔒' : ((c.sursa || '').substring(0, 3).toUpperCase() + (i + 1));
              },
              font: { size: 10, family: 'DM Sans, sans-serif' }, color: C.muted,
            },
            grid: { display: false },
          },
          y: {
            ticks: {
              callback: v => new Intl.NumberFormat('ro-RO').format(v),
              font: { size: 10, family: 'DM Sans, sans-serif' }, color: C.muted,
            },
            grid: { color: 'rgba(28,35,64,0.05)' },
          }
        }
      }
    });
  }

  function drawDonut(canvas, comps) {
    if (!canvas || !window.Chart) return;
    let date = 0, prior = 0, inf = 0;
    comps.forEach(c => {
      if (c.incredere === 'date') date++;
      else if (c.incredere === 'prior') prior++;
      else inf++;
    });
    if (!date && !prior && !inf) return;

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Din date 🟢', 'Prior 🟡', 'Inferență 🔵'],
        datasets: [{
          data: [date, prior, inf],
          backgroundColor: [C.moss, C.gold, C.sageMid],
          borderWidth: 2, borderColor: C.paper,
          hoverBorderWidth: 0,
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 10.5, family: 'DM Sans, sans-serif' },
              color: C.muted, padding: 10, boxWidth: 9, boxHeight: 9,
            }
          },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} comp.` } }
        },
        cutout: '60%',
      }
    });
  }

  function drawStrip(canvas, comps, banda) {
    if (!canvas || !window.Chart) return;

    const nou   = comps.filter(c => c.segment === 'nou'  && c.eur_mp && !c.vandut).map(c => c.eur_mp);
    const vechi = comps.filter(c => c.segment !== 'nou'  && c.eur_mp && !c.vandut).map(c => c.eur_mp);

    if (!nou.length && !vechi.length) {
      canvas.closest('.cmav-chart-card').style.display = 'none';
      return;
    }

    const datasets = [];
    if (vechi.length) datasets.push({
      label: 'Bloc vechi',
      data: vechi.map(v => ({ x: v, y: 0 })),
      backgroundColor: C.stone, pointRadius: 8, pointHoverRadius: 10,
    });
    if (nou.length) datasets.push({
      label: 'Bloc nou',
      data: nou.map(v => ({ x: v, y: 1 })),
      backgroundColor: C.slateNavy, pointRadius: 8, pointHoverRadius: 10,
    });

    // Banda vertical markers
    if (banda) {
      const bandaSets = [
        { x: banda.eur_mp_jos }, { x: banda.eur_mp_sus }
      ].map(pt => ({
        label: '_banda',
        data: [{ x: pt.x, y: -0.5 }, { x: pt.x, y: 1.5 }],
        type: 'line',
        borderColor: 'rgba(200,169,110,0.45)', borderWidth: 1.5,
        borderDash: [4, 3], pointRadius: 0, fill: false,
      }));
      datasets.push(...bandaSets);
    }

    const yLabels = ['Bloc vechi', 'Bloc nou'];

    new Chart(canvas, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            filter: ctx => !ctx.dataset.label?.startsWith('_'),
            callbacks: {
              label: ctx => ` ${fmtEurMp(ctx.parsed.x)}`,
            }
          }
        },
        scales: {
          x: {
            ticks: {
              callback: v => new Intl.NumberFormat('ro-RO').format(v),
              font: { size: 10, family: 'DM Sans, sans-serif' }, color: C.muted,
            },
            grid: { color: 'rgba(28,35,64,0.05)' },
          },
          y: {
            min: -0.5, max: 1.5,
            ticks: {
              stepSize: 1,
              callback: v => yLabels[Math.round(v)] || '',
              font: { size: 10, family: 'DM Sans, sans-serif' }, color: C.muted,
            },
            grid: { color: 'rgba(28,35,64,0.04)' },
          }
        }
      }
    });
  }

  // ── Public API ────────────────────────────────────────────

  function render(data, el) {
    injectStyles();
    destroy(el);
    el.innerHTML = buildHTML(data);

    const comps = data.comps || [];
    const banda = data.banda || null;

    requestAnimationFrame(() => {
      drawBanda(el.querySelector('.cmav-c-banda'), comps, banda);
      drawDonut(el.querySelector('.cmav-c-donut'), comps);
      drawStrip(el.querySelector('.cmav-c-strip'), comps, banda);
    });
  }

  function destroy(el) {
    if (!el) return;
    el.querySelectorAll('canvas').forEach(c => {
      const inst = window.Chart && Chart.getChart(c);
      if (inst) inst.destroy();
    });
  }

  return { render, destroy };

})();
