// POST /api/contracts-terminate   (admin only — requires Supabase session Bearer token)
// Body (JSON): { id, reason?, noticeDays? }   — noticeDays defaults to 30
//
// Formally ends a SIGNED contract by unilateral denunciation (art. IV.4.4):
//   - generates a branded "Notificare de denunțare" PDF
//   - emails it to every party (+ OWNER_EMAIL) as proof of written notice
//   - records the termination on the contract (data.termination) so the admin
//     list shows it as denounced, with the effective date.
// → 200 { ok: true, effectiveLocal }

const supabase = require('./_supabase');
const { buildTerminationDoc } = require('./_contracts/termination');
const { renderPdf } = require('./_contracts/pdf');
const { sendEmail, terminationEmail } = require('./_contracts/notify');

function roLong(d) {
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // --- admin auth ---
  const auth = req.headers.authorization || '';
  const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!jwt) return res.status(401).json({ error: 'Neautentificat' });
  const { data: userData, error: authErr } = await supabase.auth.getUser(jwt);
  if (authErr || !userData || !userData.user) return res.status(401).json({ error: 'Sesiune invalidă' });

  const { id, reason, noticeDays } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id lipsă' });
  const days = Number(noticeDays) > 0 ? Math.round(Number(noticeDays)) : 30;

  // load the contract
  const { data: contract, error: cErr } = await supabase
    .from('contracts')
    .select('id, title, status, data')
    .eq('id', id)
    .single();
  if (cErr || !contract) return res.status(404).json({ error: 'Contractul nu există' });
  if (contract.status !== 'signed')
    return res.status(400).json({ error: 'Se pot denunța doar contractele semnate.' });

  // parties = the signers (everyone who signed gets the notice)
  const { data: signers, error: sErr } = await supabase
    .from('contract_signers')
    .select('name, email, client_data')
    .eq('contract_id', id);
  if (sErr) return res.status(500).json({ error: 'Eroare la încărcarea semnatarilor' });

  const recipients = (signers || []).map((s) => {
    const cd = s.client_data || {};
    return { name: cd.name || s.name, domiciliu: cd.domiciliu, cnp: cd.cnp };
  });

  const now = new Date();
  const effective = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const dateLocal = roLong(now);
  const effectiveLocal = roLong(effective);
  const cmeta = (contract.data && contract.data.meta) || {};

  // build + render the notice PDF
  const doc = buildTerminationDoc({
    meta: {
      contractTitle: contract.title,
      contractNr: cmeta.nr,
      contractDate: cmeta.data,
      noticeNr: `${now.getFullYear()}-D${String(id).slice(0, 6)}`,
    },
    recipients,
    reason,
    noticeDays: days,
    dateLocal,
    effectiveLocal,
  });
  const pdf = await renderPdf(doc);

  // store the notice in the private bucket
  const path = `${id}-denuntare.pdf`;
  const { error: upErr } = await supabase.storage
    .from('signed-contracts')
    .upload(path, pdf, { contentType: 'application/pdf', upsert: true });
  if (upErr) console.error('notice upload error:', upErr);

  // record the termination on the contract (keep status 'signed' — it WAS valid)
  const newData = Object.assign({}, contract.data, {
    termination: { at: now.toISOString(), effective: effective.toISOString(), effectiveLocal, noticeDays: days, reason: reason || null, noticePath: path },
  });
  await supabase.from('contracts').update({ data: newData }).eq('id', id);

  // email the notice to every party (+ the agency owner copy)
  const title = contract.title || 'Contract';
  const attachments = [{ filename: 'Notificare_denuntare_EVEN.pdf', content: pdf.toString('base64') }];
  const emails = [...new Set((signers || []).map((s) => s.email).filter(Boolean))];
  if (process.env.OWNER_EMAIL) emails.push(process.env.OWNER_EMAIL);
  await Promise.all(emails.map((to) =>
    sendEmail({ to, subject: `[EVEN] Notificare de denunțare: ${title}`, html: terminationEmail({ contractTitle: title, effectiveLocal, noticeDays: days }), attachments })
  ));

  return res.status(200).json({ ok: true, effectiveLocal });
};
