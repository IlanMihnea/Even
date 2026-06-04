// ============================================================
//  ADMIN-EDITOR.JS — Editor de poze pentru imobiliare
//  Editare neistructivă (expunere, umbre, lumini, temperatură…)
//  cu PRESETURI reutilizabile aplicabile pe mai multe poze deodată.
//  100% client-side (canvas). Export: descărcare individuală sau .ZIP.
// ============================================================

(function () {
  'use strict';

  // ---------- Config adjustments (ordine + metadate UI) ----------
  // Toate au valoarea neutră 0. Range -100..100 (excepție claritate/vignetă 0..100).
  const CONTROLS = [
    { key: 'exposure',   label: 'Expunere',    min: -100, max: 100, group: 'Lumină' },
    { key: 'contrast',   label: 'Contrast',    min: -100, max: 100, group: 'Lumină' },
    { key: 'highlights', label: 'Lumini',      min: -100, max: 100, group: 'Lumină' },
    { key: 'shadows',    label: 'Umbre',       min: -100, max: 100, group: 'Lumină' },
    { key: 'whites',     label: 'Alburi',      min: -100, max: 100, group: 'Lumină' },
    { key: 'blacks',     label: 'Negruri',     min: -100, max: 100, group: 'Lumină' },
    { key: 'temperature',label: 'Temperatură', min: -100, max: 100, group: 'Culoare' },
    { key: 'tint',       label: 'Tentă',       min: -100, max: 100, group: 'Culoare' },
    { key: 'saturation', label: 'Saturație',   min: -100, max: 100, group: 'Culoare' },
    { key: 'vibrance',   label: 'Vibranță',    min: -100, max: 100, group: 'Culoare' },
    { key: 'clarity',    label: 'Claritate',   min: 0,    max: 100, group: 'Detaliu' },
    { key: 'vignette',   label: 'Vignetă',     min: 0,    max: 100, group: 'Detaliu' },
  ];
  const ADJ_KEYS = CONTROLS.map(c => c.key);

  function blankAdj() {
    const a = {};
    ADJ_KEYS.forEach(k => { a[k] = 0; });
    return a;
  }

  // ---------- Presetări încorporate ----------
  const BUILTIN_PRESETS = [
    { id: 'b_natural', name: 'Natural', builtin: true, adj: { ...blankAdj(),
        exposure: 5, contrast: 6, highlights: -14, shadows: 22, whites: 6, vibrance: 10, clarity: 8 } },
    { id: 'b_luminos', name: 'Luminos & Curat', builtin: true, adj: { ...blankAdj(),
        exposure: 14, contrast: 8, highlights: -22, shadows: 28, whites: 10, temperature: 2, vibrance: 12, clarity: 12 } },
    { id: 'b_cald', name: 'Cald & Primitor', builtin: true, adj: { ...blankAdj(),
        exposure: 7, contrast: 6, highlights: -12, shadows: 18, temperature: 16, tint: 3, vibrance: 12, clarity: 8 } },
    { id: 'b_hdr', name: 'HDR Imobiliare', builtin: true, adj: { ...blankAdj(),
        exposure: 4, contrast: 4, highlights: -34, shadows: 40, whites: 12, blacks: 8, vibrance: 16, clarity: 20 } },
    { id: 'b_lux', name: 'Lux Editorial', builtin: true, adj: { ...blankAdj(),
        contrast: 14, highlights: -10, shadows: 10, blacks: -8, saturation: -4, vibrance: 6, clarity: 10, vignette: 16 } },
    { id: 'b_bw', name: 'Alb-Negru', builtin: true, adj: { ...blankAdj(),
        contrast: 12, highlights: -10, shadows: 16, saturation: -100, clarity: 12 } },
  ];
  const LS_PRESETS = 'even_photo_presets';

  function loadCustomPresets() {
    try { return JSON.parse(localStorage.getItem(LS_PRESETS) || '[]'); }
    catch { return []; }
  }
  function saveCustomPresets(list) {
    localStorage.setItem(LS_PRESETS, JSON.stringify(list));
  }
  function allPresets() { return [...BUILTIN_PRESETS, ...loadCustomPresets()]; }

  // ---------- State ----------
  const state = {
    photos: [],          // { id, name, full(Image), w, h, preview(canvas), adj }
    activeId: null,
    selected: new Set(), // ids selectate pentru aplicare în lot / export
    showOriginal: false, // hold „înainte/după”
    booted: false,
  };
  let _seq = 0;
  const PREVIEW_MAX = 1400; // px latura mare pentru editare live
  const THUMB_MAX = 220;

  const $ = (id) => document.getElementById(id);

  // ============================================================
  //  MOTORUL DE EDITARE — pipeline pe ImageData
  // ============================================================

  function clamp255(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }
  function smoothstep(e0, e1, x) {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  }

  // LUT 256 pentru operațiile dependente doar de valoarea canalului
  // (expunere, contrast, lumini, umbre, alburi, negruri).
  function buildToneLUT(adj) {
    const lut = new Uint8ClampedArray(256);
    const expF = Math.pow(2, adj.exposure / 100);          // 0.5 .. 2
    const cF = 1 + adj.contrast / 100;                     // 0 .. 2
    const hi = adj.highlights / 100, sh = adj.shadows / 100;
    const wh = adj.whites / 100, bl = adj.blacks / 100;
    for (let v = 0; v < 256; v++) {
      let n = v / 255;
      n *= expF;                                           // expunere (multiplicativ)
      n = (n - 0.5) * cF + 0.5;                            // contrast (pivot 0.5)
      // umbre — ridică/coboară tonurile joase
      const shMask = 1 - smoothstep(0.0, 0.55, n);
      n += sh * 0.5 * shMask * (n + 0.04);
      // lumini — recuperează/întărește tonurile înalte
      const hiMask = smoothstep(0.45, 1.0, n);
      n += hi * 0.5 * hiMask * (1 - n + 0.04);
      // alburi / negruri — capetele histogramei
      n += wh * 0.35 * smoothstep(0.6, 1.0, n);
      n += bl * 0.35 * (1 - smoothstep(0.0, 0.4, n));
      lut[v] = clamp255(Math.round(n * 255));
    }
    return lut;
  }

  function hasColorWork(adj) {
    return adj.temperature || adj.tint || adj.saturation || adj.vibrance;
  }

  // Aplică tot pipeline-ul pe un <canvas> sursă, desenând rezultatul în destCanvas.
  function process(srcCanvas, adj, destCanvas) {
    const w = srcCanvas.width, h = srcCanvas.height;
    destCanvas.width = w; destCanvas.height = h;
    const sctx = srcCanvas.getContext('2d', { willReadFrequently: true });
    const dctx = destCanvas.getContext('2d');
    const img = sctx.getImageData(0, 0, w, h);
    const d = img.data;

    const lut = buildToneLUT(adj);
    const doColor = hasColorWork(adj);
    const temp = adj.temperature / 100, tint = adj.tint / 100;
    const sat = adj.saturation / 100, vib = adj.vibrance / 100;

    for (let i = 0; i < d.length; i += 4) {
      let r = lut[d[i]], g = lut[d[i + 1]], b = lut[d[i + 2]];

      if (doColor) {
        // temperatură: cald = +roșu / -albastru
        r = clamp255(r + temp * 30);
        b = clamp255(b - temp * 30);
        // tentă: verde <-> magenta
        g = clamp255(g + tint * 24);

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (sat) {
          r = clamp255(lum + (r - lum) * (1 + sat));
          g = clamp255(lum + (g - lum) * (1 + sat));
          b = clamp255(lum + (b - lum) * (1 + sat));
        }
        if (vib) {
          // vibranță: împinge mai tare pixelii puțin saturați
          const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
          const curSat = (mx - mn) / 255;
          const amt = vib * (1 - curSat);
          r = clamp255(lum + (r - lum) * (1 + amt));
          g = clamp255(lum + (g - lum) * (1 + amt));
          b = clamp255(lum + (b - lum) * (1 + amt));
        }
      }

      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }

    // Claritate — unsharp mask simplu (convoluție 3x3)
    if (adj.clarity > 0) sharpen(img, adj.clarity / 100);
    // Vignetă — radial darken
    if (adj.vignette > 0) vignette(img, adj.vignette / 100);

    dctx.putImageData(img, 0, 0);
  }

  function sharpen(img, amount) {
    const { width: w, height: h, data: d } = img;
    const src = new Uint8ClampedArray(d); // copie a tonurilor procesate
    const a = amount * 0.8;               // intensitate
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const o = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          const k = o + c;
          const blur = (
            src[k - 4] + src[k + 4] + src[k - w * 4] + src[k + w * 4]
          ) * 0.25;
          d[k] = clamp255(src[k] + (src[k] - blur) * a * 2);
        }
      }
    }
  }

  function vignette(img, amount) {
    const { width: w, height: h, data: d } = img;
    const cx = w / 2, cy = h / 2;
    const maxD = Math.sqrt(cx * cx + cy * cy);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxD;
        const fall = smoothstep(0.55, 1.0, dist) * amount;
        if (!fall) continue;
        const o = (y * w + x) * 4;
        const f = 1 - fall * 0.85;
        d[o] *= f; d[o + 1] *= f; d[o + 2] *= f;
      }
    }
  }

  // ============================================================
  //  ÎNCĂRCARE POZE
  // ============================================================

  function downscaleToCanvas(imgEl, maxSide) {
    const scale = Math.min(1, maxSide / Math.max(imgEl.naturalWidth, imgEl.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(imgEl.naturalWidth * scale);
    c.height = Math.round(imgEl.naturalHeight * scale);
    c.getContext('2d').drawImage(imgEl, 0, 0, c.width, c.height);
    return c;
  }

  function loadFiles(fileList) {
    const files = [...fileList].filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    let loaded = 0;
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const id = 'p' + (++_seq);
        const photo = {
          id,
          name: file.name.replace(/\.[^.]+$/, ''),
          full: img,
          w: img.naturalWidth,
          h: img.naturalHeight,
          preview: downscaleToCanvas(img, PREVIEW_MAX),
          adj: blankAdj(),
        };
        state.photos.push(photo);
        state.selected.add(id);
        if (!state.activeId) state.activeId = id;
        if (++loaded === files.length) {
          renderFilmstrip();
          renderStage();
          updateBars();
        } else {
          renderFilmstrip();
        }
      };
      img.onerror = () => { URL.revokeObjectURL(url); toast('Nu am putut încărca ' + file.name); };
      img.src = url;
    });
  }

  // ============================================================
  //  RANDARE UI
  // ============================================================

  function activePhoto() { return state.photos.find(p => p.id === state.activeId) || null; }

  function renderStage() {
    const wrap = $('peStage');
    const empty = $('peEmpty');
    const p = activePhoto();
    if (!p) {
      if (empty) empty.style.display = '';
      if (wrap) wrap.style.display = 'none';
      return;
    }
    if (empty) empty.style.display = 'none';
    if (wrap) wrap.style.display = '';
    const canvas = $('peCanvas');
    if (state.showOriginal) {
      canvas.width = p.preview.width; canvas.height = p.preview.height;
      canvas.getContext('2d').drawImage(p.preview, 0, 0);
    } else {
      process(p.preview, p.adj, canvas);
    }
    $('peStageName').textContent = p.name;
    $('peStageDims').textContent = `${p.w}×${p.h}px`;
  }

  // Re-randare live debounced (pe rAF) la mișcarea sliderelor
  let _raf = null;
  function scheduleStage() {
    if (_raf) return;
    _raf = requestAnimationFrame(() => { _raf = null; renderStage(); });
  }

  function renderFilmstrip() {
    const strip = $('peStrip');
    if (!strip) return;
    if (!state.photos.length) { strip.innerHTML = ''; return; }
    strip.innerHTML = state.photos.map(p => {
      const sel = state.selected.has(p.id) ? ' is-sel' : '';
      const act = p.id === state.activeId ? ' is-active' : '';
      return `
        <div class="pe-thumb${act}${sel}" data-id="${p.id}">
          <div class="pe-thumb-img"><canvas data-thumb="${p.id}"></canvas></div>
          <button type="button" class="pe-thumb-check" data-sel="${p.id}" title="Selectează pentru lot">
            <i class="fa-solid fa-check"></i>
          </button>
          <button type="button" class="pe-thumb-x" data-del="${p.id}" title="Elimină"><i class="fa-solid fa-xmark"></i></button>
          <span class="pe-thumb-name">${escapeHtml(p.name)}</span>
        </div>`;
    }).join('');
    // randează miniaturile editate
    state.photos.forEach(p => {
      const cv = strip.querySelector(`canvas[data-thumb="${p.id}"]`);
      if (cv) renderThumb(p, cv);
    });
  }

  function renderThumb(p, canvas) {
    // sursă mică pentru viteză
    if (!p._thumbSrc) p._thumbSrc = downscaleToCanvas(p.full, THUMB_MAX);
    process(p._thumbSrc, p.adj, canvas);
  }

  function refreshActiveThumb() {
    const p = activePhoto(); if (!p) return;
    const cv = document.querySelector(`#peStrip canvas[data-thumb="${p.id}"]`);
    if (cv) renderThumb(p, cv);
  }

  function renderSliders() {
    const wrap = $('peControls');
    if (!wrap) return;
    const groups = {};
    CONTROLS.forEach(c => { (groups[c.group] = groups[c.group] || []).push(c); });
    wrap.innerHTML = Object.entries(groups).map(([g, items]) => `
      <div class="pe-ctrl-group">
        <div class="pe-ctrl-group-title">${g}</div>
        ${items.map(c => `
          <div class="pe-ctrl" data-key="${c.key}">
            <div class="pe-ctrl-head">
              <label>${c.label}</label>
              <span class="pe-ctrl-val" data-val="${c.key}">0</span>
            </div>
            <input type="range" class="pe-range" data-slider="${c.key}"
                   min="${c.min}" max="${c.max}" value="0" step="1">
          </div>`).join('')}
      </div>`).join('');
    syncSlidersToActive();
  }

  function syncSlidersToActive() {
    const p = activePhoto();
    const adj = p ? p.adj : blankAdj();
    ADJ_KEYS.forEach(k => {
      const s = document.querySelector(`[data-slider="${k}"]`);
      const v = document.querySelector(`[data-val="${k}"]`);
      if (s) s.value = adj[k];
      if (v) v.textContent = adj[k];
      const ctrl = document.querySelector(`.pe-ctrl[data-key="${k}"]`);
      if (ctrl) ctrl.classList.toggle('is-touched', adj[k] !== 0);
    });
  }

  function renderPresets() {
    const wrap = $('pePresets');
    if (!wrap) return;
    const custom = loadCustomPresets();
    const chip = (pr) => `
      <div class="pe-preset" data-preset="${pr.id}">
        <button type="button" class="pe-preset-apply" data-apply="${pr.id}">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          <span>${escapeHtml(pr.name)}</span>
        </button>
        ${pr.builtin ? '' : `<button type="button" class="pe-preset-del" data-delpreset="${pr.id}" title="Șterge preset"><i class="fa-solid fa-trash"></i></button>`}
      </div>`;
    wrap.innerHTML = `
      <div class="pe-preset-row">${BUILTIN_PRESETS.map(chip).join('')}</div>
      ${custom.length ? `<div class="pe-preset-sub">Presetările mele</div><div class="pe-preset-row">${custom.map(chip).join('')}</div>` : ''}
    `;
  }

  function updateBars() {
    const n = state.photos.length;
    const sel = state.selected.size;
    const cntPhotos = $('peCountPhotos');
    if (cntPhotos) cntPhotos.textContent = n ? `${n} ${n === 1 ? 'poză' : 'poze'}` : '';
    const selLabel = $('peSelInfo');
    if (selLabel) selLabel.textContent = `${sel} selectate`;
    const hasPhotos = n > 0;
    ['peApplySel', 'peApplyAll', 'peSavePreset', 'peExportSel', 'peExportAll', 'peExportZip', 'peSelectAll', 'peClearAll', 'peResetActive']
      .forEach(id => { const el = $(id); if (el) el.disabled = !hasPhotos; });
  }

  // ============================================================
  //  ACȚIUNI
  // ============================================================

  function setActive(id) {
    state.activeId = id;
    renderFilmstrip();
    renderStage();
    syncSlidersToActive();
  }

  function toggleSelect(id) {
    if (state.selected.has(id)) state.selected.delete(id);
    else state.selected.add(id);
    renderFilmstrip();
    updateBars();
  }

  function deletePhoto(id) {
    const p = state.photos.find(x => x.id === id);
    if (p && p.full && p.full.src.startsWith('blob:')) URL.revokeObjectURL(p.full.src);
    state.photos = state.photos.filter(x => x.id !== id);
    state.selected.delete(id);
    if (state.activeId === id) state.activeId = state.photos[0] ? state.photos[0].id : null;
    renderFilmstrip();
    renderStage();
    syncSlidersToActive();
    updateBars();
  }

  function setAdjValue(key, value) {
    const p = activePhoto(); if (!p) return;
    p.adj[key] = value;
    const v = document.querySelector(`[data-val="${key}"]`);
    if (v) v.textContent = value;
    const ctrl = document.querySelector(`.pe-ctrl[data-key="${key}"]`);
    if (ctrl) ctrl.classList.toggle('is-touched', value !== 0);
    scheduleStage();
  }

  function resetActive() {
    const p = activePhoto(); if (!p) return;
    p.adj = blankAdj();
    syncSlidersToActive();
    renderStage();
    refreshActiveThumb();
  }

  function applyPresetToPhoto(p, adj) { p.adj = { ...adj }; }

  function applyPreset(presetId, targetIds) {
    const pr = allPresets().find(x => x.id === presetId);
    if (!pr) return;
    targetIds.forEach(id => {
      const p = state.photos.find(x => x.id === id);
      if (p) applyPresetToPhoto(p, pr.adj);
    });
    renderFilmstrip();
    renderStage();
    syncSlidersToActive();
    toast(`„${pr.name}” aplicat pe ${targetIds.length} ${targetIds.length === 1 ? 'poză' : 'poze'}`);
  }

  // Aplicarea presetului din chip: pe pozele selectate (sau pe activă dacă niciuna)
  function applyPresetSmart(presetId) {
    const ids = state.selected.size ? [...state.selected] : (state.activeId ? [state.activeId] : []);
    if (!ids.length) return;
    applyPreset(presetId, ids);
  }

  function saveCurrentAsPreset() {
    const p = activePhoto();
    if (!p) return;
    const name = (prompt('Nume preset:', 'Presetul meu') || '').trim();
    if (!name) return;
    const list = loadCustomPresets();
    list.push({ id: 'c' + Date.now(), name, adj: { ...p.adj } });
    saveCustomPresets(list);
    renderPresets();
    toast(`Preset „${name}” salvat`);
  }

  function deletePreset(id) {
    const list = loadCustomPresets().filter(x => x.id !== id);
    saveCustomPresets(list);
    renderPresets();
  }

  function selectAll() { state.photos.forEach(p => state.selected.add(p.id)); renderFilmstrip(); updateBars(); }
  function clearAllSel() { state.selected.clear(); renderFilmstrip(); updateBars(); }

  // ---------- Export ----------

  function renderFullBlob(p, quality = 0.92) {
    return new Promise(resolve => {
      const out = document.createElement('canvas');
      process(srcFull(p), p.adj, out); // întotdeauna la rezoluție maximă
      out.toBlob(b => resolve(b), 'image/jpeg', quality);
    });
  }
  // sursă full-res ca un canvas
  function srcFull(p) {
    const c = document.createElement('canvas');
    c.width = p.w; c.height = p.h;
    c.getContext('2d', { willReadFrequently: true }).drawImage(p.full, 0, 0);
    return c;
  }

  function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  async function exportPhotos(ids, asZip) {
    if (!ids.length) return;
    const btnIds = ['peExportSel', 'peExportAll', 'peExportZip'];
    btnIds.forEach(id => { const b = $(id); if (b) b.disabled = true; });
    const prog = $('peExportProg');
    try {
      if (asZip && window.JSZip) {
        const zip = new JSZip();
        for (let i = 0; i < ids.length; i++) {
          const p = state.photos.find(x => x.id === ids[i]);
          if (prog) prog.textContent = `Procesez ${i + 1}/${ids.length}…`;
          await new Promise(r => setTimeout(r)); // lasă UI-ul să respire
          const blob = await renderFullBlob(p);
          zip.file(`${safeName(p.name)}-even.jpg`, blob);
        }
        if (prog) prog.textContent = 'Împachetez .zip…';
        const content = await zip.generateAsync({ type: 'blob' });
        downloadBlob(content, 'poze-even.zip');
      } else {
        for (let i = 0; i < ids.length; i++) {
          const p = state.photos.find(x => x.id === ids[i]);
          if (prog) prog.textContent = `Descarc ${i + 1}/${ids.length}…`;
          const blob = await renderFullBlob(p);
          downloadBlob(blob, `${safeName(p.name)}-even.jpg`);
          await new Promise(r => setTimeout(r, 250));
        }
      }
      if (prog) prog.textContent = 'Gata ✓';
      setTimeout(() => { if (prog) prog.textContent = ''; }, 2500);
      toast('Export finalizat');
    } catch (err) {
      console.error(err);
      if (prog) prog.textContent = '';
      toast('Eroare la export: ' + err.message);
    } finally {
      updateBars();
    }
  }

  function safeName(s) {
    return (s || 'poza').replace(/[^a-z0-9\-_]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'poza';
  }

  // ============================================================
  //  HELPERS
  // ============================================================

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, m =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function toast(msg) {
    // refolosește toastul global din admin dacă există
    if (typeof window.showToast === 'function') return window.showToast(msg);
    const t = document.getElementById('toast');
    if (!t) return;
    const span = t.querySelector('.toast-msg');
    if (span) span.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ============================================================
  //  WIRING
  // ============================================================

  function boot() {
    if (state.booted) return;
    const view = $('view-editor');
    if (!view) return;
    state.booted = true;

    renderSliders();
    renderPresets();
    updateBars();

    // input fișiere + dropzone
    const fileInput = $('peFileInput');
    if (fileInput) fileInput.addEventListener('change', e => { loadFiles(e.target.files); e.target.value = ''; });

    const dz = $('peDrop');
    if (dz) {
      ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('is-over'); }));
      ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); if (ev === 'dragleave' && dz.contains(e.relatedTarget)) return; dz.classList.remove('is-over'); }));
      dz.addEventListener('drop', e => { if (e.dataTransfer && e.dataTransfer.files) loadFiles(e.dataTransfer.files); });
    }

    // slidere (delegat)
    const controls = $('peControls');
    if (controls) {
      controls.addEventListener('input', e => {
        const s = e.target.closest('[data-slider]');
        if (!s) return;
        setAdjValue(s.dataset.slider, parseInt(s.value, 10));
      });
      controls.addEventListener('change', e => {
        if (e.target.closest('[data-slider]')) refreshActiveThumb();
      });
      // dublu-click pe slider = reset acel canal
      controls.addEventListener('dblclick', e => {
        const s = e.target.closest('[data-slider]');
        if (!s) return;
        s.value = 0; setAdjValue(s.dataset.slider, 0); refreshActiveThumb();
      });
    }

    // filmstrip (delegat)
    const strip = $('peStrip');
    if (strip) {
      strip.addEventListener('click', e => {
        const sel = e.target.closest('[data-sel]');
        if (sel) { toggleSelect(sel.dataset.sel); return; }
        const del = e.target.closest('[data-del]');
        if (del) { deletePhoto(del.dataset.del); return; }
        const thumb = e.target.closest('.pe-thumb');
        if (thumb) setActive(thumb.dataset.id);
      });
    }

    // presetări (delegat)
    const presets = $('pePresets');
    if (presets) {
      presets.addEventListener('click', e => {
        const apply = e.target.closest('[data-apply]');
        if (apply) { applyPresetSmart(apply.dataset.apply); return; }
        const del = e.target.closest('[data-delpreset]');
        if (del) { if (confirm('Ștergi acest preset?')) deletePreset(del.dataset.delpreset); }
      });
    }

    // butoane bară
    const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
    on('peApplySel', () => { /* aplică adj active pe selectate */ applyActiveToSelected(); });
    on('peApplyAll', () => applyActiveToAll());
    on('peSavePreset', saveCurrentAsPreset);
    on('peResetActive', resetActive);
    on('peSelectAll', selectAll);
    on('peClearAll', clearAllSel);
    on('peExportSel', () => exportPhotos([...state.selected], false));
    on('peExportZip', () => exportPhotos(state.selected.size ? [...state.selected] : state.photos.map(p => p.id), true));
    on('peExportAll', () => exportPhotos(state.photos.map(p => p.id), false));

    // înainte/după — ține apăsat
    const beforeBtn = $('peBefore');
    if (beforeBtn) {
      const down = () => { state.showOriginal = true; renderStage(); };
      const up = () => { state.showOriginal = false; renderStage(); };
      beforeBtn.addEventListener('mousedown', down);
      beforeBtn.addEventListener('touchstart', e => { e.preventDefault(); down(); }, { passive: false });
      ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => beforeBtn.addEventListener(ev, up));
    }
  }

  // Copiază reglajele pozei active pe restul (fără preset salvat)
  function applyActiveToSelected() {
    const p = activePhoto(); if (!p) return;
    const ids = [...state.selected].filter(id => id !== p.id);
    ids.forEach(id => { const t = state.photos.find(x => x.id === id); if (t) t.adj = { ...p.adj }; });
    renderFilmstrip();
    toast(`Reglaje copiate pe ${ids.length} ${ids.length === 1 ? 'poză' : 'poze'} selectate`);
  }
  function applyActiveToAll() {
    const p = activePhoto(); if (!p) return;
    const ids = state.photos.map(x => x.id).filter(id => id !== p.id);
    ids.forEach(id => { const t = state.photos.find(x => x.id === id); if (t) t.adj = { ...p.adj }; });
    renderFilmstrip();
    toast(`Reglaje copiate pe toate (${ids.length})`);
  }

  // boot când se intră pe ruta #editor (sau imediat dacă deja acolo)
  function maybeBoot() {
    if ((location.hash.slice(1) || '') === 'editor') boot();
  }
  window.addEventListener('hashchange', maybeBoot);
  if (document.readyState !== 'loading') maybeBoot();
  else document.addEventListener('DOMContentLoaded', maybeBoot);

  // expune câteva funcții pentru debugging eventual
  window.EVENPhotoEditor = { boot, state };
})();
