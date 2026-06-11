// POST /api/contracts-file   (admin only — requires Supabase session Bearer token)
// Body (JSON): { id, kind }   kind: 'notice' (denunțare) | 'signed' (contract semnat)
//
// Returns a short-lived signed URL to a stored PDF in the private bucket, so the
// admin can download it. The bucket stays private; the URL expires.
// → 200 { url }

const supabase = require('../_supabase');

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

  const { id, kind } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id lipsă' });

  const { data: contract, error: cErr } = await supabase
    .from('contracts')
    .select('id, signed_pdf_path, data')
    .eq('id', id)
    .single();
  if (cErr || !contract) return res.status(404).json({ error: 'Contractul nu există' });

  const path = kind === 'signed'
    ? contract.signed_pdf_path
    : (contract.data && contract.data.termination && contract.data.termination.noticePath);
  if (!path) return res.status(404).json({ error: 'Documentul nu există' });

  const { data: signed, error: sErr } = await supabase.storage
    .from('signed-contracts')
    .createSignedUrl(path, 120); // 2 min, enough to start the download
  if (sErr || !signed) {
    console.error('signed url error:', sErr);
    return res.status(500).json({ error: 'Eroare la generarea linkului' });
  }

  return res.status(200).json({ url: signed.signedUrl });
};
