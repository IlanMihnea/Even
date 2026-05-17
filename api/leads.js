// POST /api/leads
// Body (JSON):
//   email*       — required
//   mesaj*       — required
//   nume         — optional
//   telefon      — optional
//   property_id  — optional (links lead to a property)
//   project_id   — optional (links lead to a project)
//   agent_id     — optional (routes to specific agent)
//   tip          — contact | vizionare | oferta (default: contact)
//   sursa        — website | facebook | google | referral (default: website)
//
// On success: stores lead in DB + sends email notification → 201 { ok: true, lead_id }

const supabase = require('./_supabase');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIP_LABELS = { contact: 'Mesaj contact', vizionare: 'Solicitare vizionare', oferta: 'Cerere ofertă' };

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    email, mesaj, nume, telefon,
    property_id, project_id, agent_id,
    tip = 'contact',
    sursa = 'website'
  } = req.body || {};

  // Validation
  if (!email || !mesaj) return res.status(400).json({ error: 'Câmpuri obligatorii: email, mesaj' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Adresă de email invalidă' });
  if (!['contact', 'vizionare', 'oferta'].includes(tip)) return res.status(400).json({ error: 'Tip invalid' });

  // Resolve property/project title & agent for the notification email
  let titluProprietate = null;
  let agentEmail = null;

  if (property_id) {
    const { data } = await supabase
      .from('properties')
      .select('titlu, agent_id, agents(email, nume)')
      .eq('id', property_id)
      .single();
    if (data) {
      titluProprietate = data.titlu;
      if (data.agents) agentEmail = data.agents.email;
    }
  } else if (project_id) {
    const { data } = await supabase
      .from('projects')
      .select('nume')
      .eq('id', project_id)
      .single();
    if (data) titluProprietate = data.nume;
  }

  // If agent_id passed directly, get their email
  if (!agentEmail && agent_id) {
    const { data } = await supabase.from('agents').select('email').eq('id', agent_id).single();
    if (data) agentEmail = data.email;
  }

  // Persist lead
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      property_id: property_id || null,
      project_id:  project_id  || null,
      agent_id:    agent_id    || null,
      nume:        nume        || null,
      email,
      telefon:     telefon     || null,
      mesaj,
      tip,
      sursa,
      status: 'nou'
    })
    .select('id, created_at')
    .single();

  if (error) {
    console.error('Lead insert error:', error);
    return res.status(500).json({ error: 'Eroare la salvarea cererii. Încearcă din nou.' });
  }

  // Email notification (non-blocking on failure — lead is already saved)
  const recipients = [process.env.OWNER_EMAIL];
  if (agentEmail && agentEmail !== process.env.OWNER_EMAIL) recipients.push(agentEmail);

  const proprietateRow = titluProprietate
    ? `<tr><td style="padding:6px 12px"><strong>Proprietate:</strong></td><td style="padding:6px 12px">${escapeHtml(titluProprietate)}</td></tr>`
    : '';

  const tipLabel = TIP_LABELS[tip] || tip;

  // Skip email if Resend not configured (lead is still saved → return success)
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email notification.');
    return res.status(201).json({ ok: true, lead_id: lead.id, email_sent: false });
  }

  const FROM = process.env.RESEND_FROM || 'EVEN <onboarding@resend.dev>';
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM,
      to: recipients,
      reply_to: email,
      subject: `[EVEN] ${tipLabel}${titluProprietate ? ' — ' + titluProprietate : ''}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1C2340;border-bottom:2px solid #E8B86D;padding-bottom:8px">
            ${escapeHtml(tipLabel)} — EVEN Real Estate
          </h2>
          <table cellpadding="0" cellspacing="0" style="font-size:14px;width:100%">
            <tr><td style="padding:6px 12px"><strong>Tip:</strong></td><td style="padding:6px 12px">${escapeHtml(tipLabel)}</td></tr>
            ${proprietateRow}
            <tr><td style="padding:6px 12px"><strong>Nume:</strong></td><td style="padding:6px 12px">${escapeHtml(nume || '-')}</td></tr>
            <tr><td style="padding:6px 12px"><strong>Email:</strong></td><td style="padding:6px 12px">${escapeHtml(email)}</td></tr>
            <tr><td style="padding:6px 12px"><strong>Telefon:</strong></td><td style="padding:6px 12px">${escapeHtml(telefon || '-')}</td></tr>
            <tr><td style="padding:6px 12px"><strong>Sursă:</strong></td><td style="padding:6px 12px">${escapeHtml(sursa)}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#f9f9f9;border-radius:6px;font-size:14px;line-height:1.7">
            ${escapeHtml(mesaj).replace(/\n/g, '<br>')}
          </div>
          <p style="font-size:11px;color:#aaa;margin-top:20px">Lead ID: ${lead.id} · ${new Date(lead.created_at).toLocaleString('ro-RO')}</p>
        </div>
      `
    })
  }).catch(err => { console.error('Resend fetch failed:', err); return { ok: false }; });

  let resendDebug = null;
  if (emailRes && !emailRes.ok) {
    const body = typeof emailRes.text === 'function' ? await emailRes.text().catch(() => '') : '';
    console.error('Resend error:', body);
    resendDebug = { status: emailRes.status, body };
  } else if (emailRes && emailRes.ok) {
    const body = typeof emailRes.json === 'function' ? await emailRes.json().catch(() => null) : null;
    resendDebug = { status: emailRes.status, body };
  }

  return res.status(201).json({ ok: true, lead_id: lead.id, _resend: resendDebug });
};
