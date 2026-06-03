// POST /api/contracts-sign   (public — called by the signing page)
// Body (JSON): { token, client:{name,domiciliu,cnp,ciSeria,ciNr,telefon,email},
//                signatureDataUrl, consent, userAgent }
//
// Records this signer's signature + data + audit. When EVERYONE has signed, it
// finalizes the contract exactly once (race-safe for simultaneous signing):
// generates the single PDF with all signatures, stores it, emails it to all.
// → 200 { status: 'partial', remaining } | { status: 'signed' }

const supabase = require('./_supabase');
const { buildContractDoc } = require('./_contracts/template');
const { renderPdf, fingerprint } = require('./_contracts/pdf');
const { sendEmail, signedCopyEmail } = require('./_contracts/notify');

function nowLocal() {
  return new Date().toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest', dateStyle: 'long', timeStyle: 'short' });
}
function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || (req.socket && req.socket.remoteAddress) || null;
}

async function pendingCount(contractId) {
  const { count } = await supabase
    .from('contract_signers')
    .select('id', { count: 'exact', head: true })
    .eq('contract_id', contractId)
    .neq('status', 'signed');
  return count || 0;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, client = {}, signatureDataUrl, consent, userAgent } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Token lipsă' });
  if (!consent) return res.status(400).json({ error: 'Consimțământul este obligatoriu' });
  if (!signatureDataUrl || !/^data:image\/png;base64,/.test(signatureDataUrl))
    return res.status(400).json({ error: 'Semnătură lipsă' });

  // find signer + its contract (to know whether personal data is required)
  const { data: signer, error } = await supabase
    .from('contract_signers')
    .select('id, contract_id, role, name, email, status, contracts(data)')
    .eq('token', token)
    .single();
  if (error || !signer) return res.status(404).json({ error: 'Link invalid sau expirat' });

  const collectData = !(signer.contracts && signer.contracts.data && signer.contracts.data.collectData === false);
  if (collectData) {
    if (!client.name || !client.cnp) return res.status(400).json({ error: 'Nume și CNP obligatorii' });
  } else if (!client.name) {
    client.name = signer.name; // sign-only: fall back to the admin-provided name
  }

  // idempotent: already signed → just report current state
  if (signer.status === 'signed') {
    const remaining = await pendingCount(signer.contract_id);
    return res.status(200).json({ status: remaining > 0 ? 'partial' : 'signed', remaining, alreadySigned: true });
  }

  const signedAtLocal = nowLocal();
  const audit = { email: client.email || signer.email, ip: clientIp(req), userAgent: userAgent || req.headers['user-agent'] || null, signedAtLocal };

  // record this signature
  const { error: upErr } = await supabase
    .from('contract_signers')
    .update({
      status: 'signed',
      signed_at: new Date().toISOString(),
      gdpr_consent: true,
      client_data: client,
      signature: { imageDataUrl: signatureDataUrl, signedAt: signedAtLocal },
      audit,
    })
    .eq('id', signer.id)
    .neq('status', 'signed'); // guard against double-submit
  if (upErr) {
    console.error('signer update error:', upErr);
    return res.status(500).json({ error: 'Eroare la salvarea semnăturii' });
  }

  // anyone left?
  const remaining = await pendingCount(signer.contract_id);
  if (remaining > 0) {
    await supabase.from('contracts').update({ status: 'partial' }).eq('id', signer.contract_id).neq('status', 'signed');
    return res.status(200).json({ status: 'partial', remaining });
  }

  // ── everyone has signed: claim finalization atomically (only one winner) ──
  const { data: claimed } = await supabase
    .from('contracts')
    .update({ status: 'signed', finalized_at: new Date().toISOString() })
    .eq('id', signer.contract_id)
    .neq('status', 'signed')
    .select('id, title, data');
  if (!claimed || claimed.length === 0) {
    // another concurrent request already finalized → nothing more to do
    return res.status(200).json({ status: 'signed' });
  }

  try {
    await finalize(claimed[0]);
  } catch (e) {
    console.error('finalize error:', e);
    // contract is marked signed; finalize can be retried by an admin re-trigger if needed
  }
  return res.status(200).json({ status: 'signed' });
};

// Generate the single signed PDF, store it, email it to every signer.
async function finalize(contract) {
  const { data: rows } = await supabase
    .from('contract_signers')
    .select('position, role, name, email, client_data, signature, audit')
    .eq('contract_id', contract.id)
    .order('position', { ascending: true });
  const all = rows || [];

  const signers = all.map((s) => ({
    position: s.position, role: s.role,
    name: (s.client_data && s.client_data.name) || s.name, // the name the signer attested
    clientData: s.client_data || {},
    signatureDataUrl: s.signature && s.signature.imageDataUrl,
    signedAtLocal: s.signature && s.signature.signedAt,
    audit: s.audit || {},
  }));

  const cdata = contract.data || {};
  const documentHash = fingerprint({
    contract: { meta: cdata.meta, terms: cdata.terms, sections: cdata.sections },
    signatureDataUrl: signers.map((s) => s.signatureDataUrl || '').join('|'),
    signedAt: new Date().toISOString(),
  });

  const doc = buildContractDoc({
    meta: cdata.meta || {},
    terms: cdata.terms || {},
    sections: cdata.sections,
    client: { label: 'PROPRIETARUL' },
    signers,
    documentHash,
  });
  const pdf = await renderPdf(doc);

  // store in the private bucket
  const path = `${contract.id}.pdf`;
  const { error: upErr } = await supabase.storage
    .from('signed-contracts')
    .upload(path, pdf, { contentType: 'application/pdf', upsert: true });
  if (upErr) console.error('storage upload error:', upErr);

  await supabase.from('contracts')
    .update({ signed_pdf_path: path, document_hash: documentHash })
    .eq('id', contract.id);

  // email the signed copy to everyone
  const title = contract.title || (cdata.meta && cdata.meta.title) || 'Contract';
  const attachments = [{ filename: 'Contract_EVEN_semnat.pdf', content: pdf.toString('base64') }];
  const recipients = [...new Set(all.map((s) => s.email).filter(Boolean))];
  if (process.env.OWNER_EMAIL) recipients.push(process.env.OWNER_EMAIL);
  await Promise.all(recipients.map((to) =>
    sendEmail({ to, subject: `[EVEN] Contract semnat: ${title}`, html: signedCopyEmail({ contractTitle: title }), attachments })
  ));
}
