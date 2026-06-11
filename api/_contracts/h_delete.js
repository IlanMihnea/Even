// action=delete   (admin only — requires Supabase session Bearer token)
// Body (JSON): { id }   — the contract id to permanently remove
//
// Hard-deletes a contract so nothing of it remains:
//   - removes the stored signed PDF and any denunțare notice from the bucket
//   - deletes the contract row; signer rows cascade (FK on delete cascade),
//     so every personal sign link goes dead (404) and the email is gone too.
// Use for junk/test contracts. Irreversible.
// → 200 { ok: true }

const supabase = require('../_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization || '';
  const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!jwt) return res.status(401).json({ error: 'Neautentificat' });
  const { data: userData, error: authErr } = await supabase.auth.getUser(jwt);
  if (authErr || !userData || !userData.user) return res.status(401).json({ error: 'Sesiune invalidă' });

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id lipsă' });

  const { data: contract, error: getErr } = await supabase
    .from('contracts')
    .select('id, signed_pdf_path, data')
    .eq('id', id)
    .single();
  if (getErr || !contract) return res.status(404).json({ error: 'Contractul nu există' });

  // remove any stored PDFs (signed contract + denunțare notice) — best-effort
  const paths = [];
  if (contract.signed_pdf_path) paths.push(contract.signed_pdf_path);
  const noticePath = contract.data && contract.data.termination && contract.data.termination.noticePath;
  if (noticePath) paths.push(noticePath);
  if (paths.length) {
    const { error: rmErr } = await supabase.storage.from('signed-contracts').remove(paths);
    if (rmErr) console.error('pdf remove error:', rmErr);
  }

  // delete the contract — signer rows cascade
  const { error: delErr } = await supabase.from('contracts').delete().eq('id', id);
  if (delErr) {
    console.error('contract delete error:', delErr);
    return res.status(500).json({ error: 'Eroare la ștergerea contractului' });
  }

  return res.status(200).json({ ok: true });
};
