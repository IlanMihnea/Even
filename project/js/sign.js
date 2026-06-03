/* EVEN — contract signing page logic.
   Loads a contract by ?token=, renders its clauses, captures personal data +
   a drawn signature, and submits. Falls back to a PREVIEW sample when no token
   / API is available, so the page is fully usable during development. */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const token = new URLSearchParams(location.search).get('token');

  // ── sample contract for preview mode (mirrors api/_contracts/template.js) ──
  const SAMPLE = {
    eyebrow: 'Contract',
    title: 'Contract de intermediere imobiliară',
    subtitle: '— mandat de vânzare —',
    prefill: { email: '' },
    signer: { role: 'Proprietar', name: '' },
    total: 2,            // total signers on this contract
    signedSoFar: [],     // who already signed (parallel — any order)
    sections: [
      { h: 'I. Părțile', c: [
        { n: '1.', t: '**AMIT ESTATE S.R.L.**, cu sediul în Piatra Neamț, jud. Neamț, Str. Ion Creangă nr. 9, CUI 53340194, reprezentată prin Ilan-Mihnea Eibenschutz, administrator, denumită în continuare **AGENȚIA** (Intermediarul).' },
        { n: '2.', t: '**CLIENTUL**, cu datele completate mai jos, denumit în continuare **PROPRIETARUL**.' },
      ]},
      { h: 'II. Obiectul contractului', c: [
        { n: '2.1.', t: 'Proprietarul încredințează Agenției intermedierea în vederea vânzării imobilului ce face obiectul prezentului contract, conform actelor puse la dispoziție.' },
        { n: '2.3.', t: 'Prețul de vânzare solicitat este de **350.000 EUR**. Poate fi modificat numai prin acordul scris al părților.' },
      ]},
      { h: 'III. Comisionul', c: [
        { n: '3.1.', t: 'Comisionul de intermediere este de **3% din prețul de vânzare**. Agenția nu este plătitoare de TVA.' },
        { n: '3.3.', t: 'Comisionul devine scadent la momentul semnării contractului autentic de vânzare-cumpărare.' },
      ]},
      { h: 'IV. Durata și exclusivitatea', c: [
        { n: '4.1.', t: 'Contractul se încheie pe durata de **6 luni** de la data semnării.' },
        { n: '4.4.', t: 'Oricare parte poate denunța unilateral contractul printr-o notificare scrisă cu un preaviz de 30 de zile.' },
      ]},
      { h: 'V. Protecția datelor (GDPR)', c: [
        { n: '5.1.', t: 'Clientul își exprimă acordul ca Agenția să prelucreze datele sale conform Reg. (UE) 2016/679. Datele sunt stocate în Uniunea Europeană.' },
      ]},
    ],
  };

  // ── render the contract clauses ──
  function renderContract(data) {
    $('sgnEyebrow').textContent = data.eyebrow || 'Contract';
    $('sgnTitle').textContent = data.title || 'Contract';
    $('sgnSubtitle').textContent = data.subtitle || '';
    $('sgnSubtitle').hidden = !data.subtitle;
    document.title = (data.title || 'Semnează contractul') + ' · EVEN';

    const doc = $('sgnDoc');
    doc.innerHTML = '';
    (data.sections || []).forEach((s) => {
      const h = document.createElement('h3');
      h.textContent = s.h;
      doc.appendChild(h);
      (s.c || []).forEach((cl) => {
        const p = document.createElement('p');
        p.innerHTML = (cl.n ? '<span class="c-num">' + esc(cl.n) + '</span> ' : '') + md(cl.t);
        doc.appendChild(p);
      });
    });

    // progress: this signer's role + a note that there are several signers (parallel)
    const total = data.total || (data.signer && data.signer.total) || 1;
    if (total > 1) {
      $('sgnProgress').hidden = false;
      $('sgnProgressRole').textContent = (data.signer && data.signer.role) || 'Semnatar';
      $('sgnProgressNote').textContent =
        'Acest contract are ' + total + ' semnatari. Fiecare semnează din linkul lui, în orice ordine — pe același document.';
    }

    // who already signed (context for later signers)
    if (data.signedSoFar && data.signedSoFar.length) {
      const wrap = $('sgnSignedSoFar');
      wrap.hidden = false;
      wrap.innerHTML = data.signedSoFar.map((s) =>
        '<div class="sgn-signed-item"><span class="tick"></span>Semnat de <b>' +
        esc(s.name) + '</b>' + (s.role ? ' · ' + esc(s.role) : '') + '</div>'
      ).join('');
    }

    // prefill known fields for this signer
    const pf = data.prefill || {};
    Object.keys(pf).forEach((k) => {
      const el = document.querySelector('input[name="' + k + '"]');
      if (el && pf[k]) el.value = pf[k];
    });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  // escape, then turn **bold** into bold tags (content uses ** markers)
  function md(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  // ── signature pad (retina-crisp, pointer events) ──
  function SignaturePad(canvas) {
    const ctx = canvas.getContext('2d');
    let drawing = false, dirty = false, last = null;

    function resize() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      // preserve current ink
      const prev = dirty ? canvas.toDataURL() : null;
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1C2340';
      if (prev) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, r.width, r.height); img.src = prev; }
    }

    function pos(e) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function start(e) {
      e.preventDefault(); drawing = true; last = pos(e);
      if (!dirty) { dirty = true; canvas.parentElement.classList.add('has-ink'); onChange(); }
    }
    function move(e) {
      if (!drawing) return; e.preventDefault();
      const p = pos(e);
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p;
    }
    function end() { drawing = false; last = null; }

    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('resize', resize);

    let onChange = () => {};
    resize();
    return {
      isEmpty: () => !dirty,
      clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        dirty = false; canvas.parentElement.classList.remove('has-ink'); onChange();
      },
      toDataURL: () => canvas.toDataURL('image/png'),
      onChange(fn) { onChange = fn; },
    };
  }

  // ── boot ──
  async function boot() {
    let data = SAMPLE;
    if (token) {
      try {
        const res = await fetch('/api/contracts-get?token=' + encodeURIComponent(token));
        if (!res.ok) throw new Error('not_found');
        data = await res.json();
      } catch (err) {
        $('sgnLoading').hidden = true;
        $('sgnError').hidden = false;
        return;
      }
    }

    renderContract(data);
    $('sgnLoading').hidden = true;
    $('sgnApp').hidden = false;

    // sign-only contracts: hide the personal-data form, just sign
    const collect = data.collectData !== false;
    if (!collect) $('sgnDataCard').hidden = true;

    const pad = SignaturePad($('sgnPad'));
    const form = $('sgnForm');
    const consent = $('sgnConsent');
    const submit = $('sgnSubmit');

    function valid() {
      return (collect ? form.checkValidity() : true) && consent.checked && !pad.isEmpty();
    }
    function refresh() { submit.disabled = !valid(); }

    form.addEventListener('input', refresh);
    consent.addEventListener('change', refresh);
    pad.onChange(refresh);
    $('sgnClear').addEventListener('click', () => { pad.clear(); refresh(); });

    submit.addEventListener('click', async () => {
      if (!valid()) { form.reportValidity(); return; }
      submit.classList.add('is-loading'); submit.disabled = true;

      const fd = new FormData(form);
      const payload = {
        token,
        client: collect ? Object.fromEntries(fd.entries()) : { name: (data.signer && data.signer.name) || '' },
        signatureDataUrl: pad.toDataURL(),
        consent: true,
        signedAtClient: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      try {
        let result;
        if (!token) {
          // preview: simulate parallel signing — partial if others still pending
          await new Promise((r) => setTimeout(r, 900));
          const signedCount = (data.signedSoFar ? data.signedSoFar.length : 0) + 1;
          const remaining = (data.total || 1) - signedCount;
          result = remaining > 0 ? { status: 'partial', remaining, preview: true }
                                 : { status: 'signed', preview: true };
        } else {
          const res = await fetch('/api/contracts-sign', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('sign_failed');
          result = await res.json();
        }
        submit.classList.remove('is-loading');
        showResult(result);
      } catch (e) {
        submit.classList.remove('is-loading'); submit.disabled = false;
        alert('A apărut o eroare la semnare. Te rugăm să încerci din nou.');
      }
    });
  }

  // Result after signing. Parallel model: either we're still waiting on the
  // other signer(s), or everyone has signed and the document is finalized.
  function showResult(result) {
    $('sgnDone').hidden = false;
    const dl = $('sgnDownload');
    dl.hidden = true;

    if (result.status === 'partial') {
      const n = result.remaining || 1;
      const who = n === 1 ? 'celălalt semnatar' : 'ceilalți ' + n + ' semnatari';
      $('sgnDoneTitle').textContent = 'Semnătura ta e înregistrată';
      $('sgnDoneMsg').textContent =
        'Contractul se finalizează automat după ce semnează și ' + who + '. ' +
        'Vei primi pe email copia PDF semnată de toți.';
    } else {
      $('sgnDoneTitle').textContent = 'Contract semnat';
      $('sgnDoneMsg').textContent = result.preview
        ? 'Mod previzualizare — fluxul de semnare este complet. La conectarea API-ului, aici se generează și se trimite PDF-ul semnat tuturor.'
        : 'Gata! Contractul a fost semnat de toți semnatarii. O copie PDF a fost trimisă pe emailul fiecăruia.';
      if (result.pdfUrl) { dl.hidden = false; dl.href = result.pdfUrl; }
    }
  }

  boot();
})();
