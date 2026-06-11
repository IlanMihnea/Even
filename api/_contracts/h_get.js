// GET /api/contracts-get?token=...   (public — used by the signing page)
// Returns the clauses + this signer's context. Never exposes other signers' CNP/CI.

const supabase = require('../_supabase');
const { partiesSection, buildBody } = require('./content');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.query && req.query.token;
  if (!token) return res.status(400).json({ error: 'Token lipsă' });

  // signer + its contract
  const { data: signer, error } = await supabase
    .from('contract_signers')
    .select('id, contract_id, role, name, email, status, contracts(title, data, status)')
    .eq('token', token)
    .single();
  if (error || !signer) return res.status(404).json({ error: 'Link invalid sau expirat' });

  const contract = signer.contracts || {};
  const data = contract.data || {};
  const meta = data.meta || {};

  // mark "viewed" (best-effort, only first time)
  if (signer.status === 'pending') {
    supabase.from('contract_signers')
      .update({ status: 'viewed', viewed_at: new Date().toISOString() })
      .eq('id', signer.id).then(() => {}, () => {});
  }

  // siblings: total count + who already signed (names/roles only — no personal data)
  const { data: siblings } = await supabase
    .from('contract_signers')
    .select('name, role, status, position, client_data')
    .eq('contract_id', signer.contract_id)
    .order('position', { ascending: true });
  const all = siblings || [];
  const signedSoFar = all.filter((s) => s.status === 'signed').map((s) => ({ name: s.name, role: s.role }));

  // "Părțile" built from the real signers (incl. data the admin filled in sign-only mode)
  const parties = partiesSection(all.map((s) => ({ name: s.name, role: s.role, clientData: s.client_data })));
  const body = data.sections || buildBody(data.terms || {});
  return res.status(200).json({
    eyebrow: meta.eyebrow || 'Contract',
    title: contract.title || meta.title || 'Contract',
    subtitle: meta.subtitle || '',
    sections: [parties].concat(body),              // real "Părțile" + authored body
    collectData: data.collectData !== false,       // false → sign-only (no personal-data form)
    signer: { role: signer.role, name: signer.name },
    total: all.length,
    signedSoFar,
    alreadySigned: signer.status === 'signed',
    prefill: { name: signer.name || '', email: signer.email || '' },
  });
};
