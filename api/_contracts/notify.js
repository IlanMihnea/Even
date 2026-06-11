// EVEN — email helpers for the contract-signing flow (via Resend).
const FROM = process.env.RESEND_FROM || 'EVEN <onboarding@resend.dev>';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Branded email shell (inline styles — email clients ignore <style>).
function shell(title, bodyHtml) {
  return `
  <div style="background:#F1F0EC;padding:32px 0;font-family:'DM Sans',Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#FAF8F2;border:1px solid #E8E5DC;border-radius:16px;overflow:hidden">
      <div style="padding:22px 28px;border-bottom:1px solid #E8E5DC">
        <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:4px;color:#1C2340;font-weight:700">E V E N</div>
        <div style="font-size:10px;letter-spacing:3px;color:#7A9B92;font-weight:700;margin-top:2px">IMOBILIARE CU PLAN</div>
      </div>
      <div style="padding:28px">
        <h1 style="font-family:Georgia,serif;font-size:24px;color:#1C2340;margin:0 0 16px">${esc(title)}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:16px 28px;border-top:1px solid #E8E5DC;font-size:11px;color:#9a9590">
        EVEN · AMIT ESTATE S.R.L. · CUI 53340194 · Piatra Neamț
      </div>
    </div>
  </div>`;
}

function button(url, label) {
  return `<a href="${esc(url)}" style="display:inline-block;background:#1C2340;color:#FAF8F2;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:999px">${esc(label)}</a>`;
}

// Invite to sign (sent to each signer when the contract is created).
function inviteEmail({ signerName, role, contractTitle, url, total }) {
  const body = `
    <p style="font-size:15px;line-height:1.6;color:#4a4640;margin:0 0 18px">
      Bună${signerName ? ' ' + esc(signerName) : ''},<br>
      Ai de semnat <b style="color:#1C2340">${esc(contractTitle)}</b>${role ? ' (în calitate de ' + esc(role) + ')' : ''}.
      ${total > 1 ? 'Contractul are ' + total + ' semnatari — fiecare semnează din linkul lui, în orice ordine, pe același document.' : ''}
    </p>
    <p style="margin:0 0 22px">${button(url, 'Deschide și semnează')}</p>
    <p style="font-size:12px;line-height:1.5;color:#9a9590;margin:0">
      Linkul este personal — nu îl distribui. La semnare se înregistrează data, ora, IP-ul și o amprentă
      digitală (SHA-256) pentru integritate juridică (eIDAS). Datele sunt stocate în Uniunea Europeană.
    </p>`;
  return shell('Semnează contractul', body);
}

// Final signed copy (sent to everyone once all have signed).
function signedCopyEmail({ contractTitle }) {
  const body = `
    <p style="font-size:15px;line-height:1.6;color:#4a4640;margin:0 0 18px">
      Contractul <b style="color:#1C2340">${esc(contractTitle)}</b> a fost semnat de toți semnatarii.
      Găsești atașată copia PDF semnată — identică pentru fiecare parte.
    </p>
    <p style="font-size:12px;line-height:1.5;color:#9a9590;margin:0">
      Documentul include semnăturile tuturor părților și confirmarea electronică (dată, oră, IP, amprentă SHA-256).
      Păstrează-l; are valoare juridică conform Reg. (UE) 910/2014 (eIDAS).
    </p>`;
  return shell('Contract semnat', body);
}

// Termination notice (denunțare) — sent to the parties when the agency ends a contract.
function terminationEmail({ contractTitle, effectiveLocal, noticeDays }) {
  const body = `
    <p style="font-size:15px;line-height:1.6;color:#4a4640;margin:0 0 18px">
      Vă transmitem notificarea de <b style="color:#1C2340">denunțare unilaterală</b> a contractului
      <b style="color:#1C2340">${esc(contractTitle)}</b>.
      Conform contractului, denunțarea produce efecte după un preaviz de ${esc(noticeDays || 30)} de zile,
      respectiv începând cu data de <b style="color:#1C2340">${esc(effectiveLocal)}</b>.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#4a4640;margin:0 0 18px">
      Notificarea semnată este atașată în format PDF. Vă rugăm să confirmați primirea.
    </p>
    <p style="font-size:12px;line-height:1.5;color:#9a9590;margin:0">
      Până la data încetării, obligațiile scadente ale părților rămân datorate.
    </p>`;
  return shell('Notificare de denunțare', body);
}

async function sendEmail({ to, subject, html, attachments }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email to', to);
    return { skipped: true };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html, attachments }),
  }).catch((e) => { console.error('Resend fetch failed:', e); return { ok: false }; });
  if (res && res.ok === false) {
    const b = typeof res.text === 'function' ? await res.text().catch(() => '') : '';
    console.error('Resend error:', b);
  }
  return res;
}

module.exports = { sendEmail, inviteEmail, signedCopyEmail, terminationEmail };
