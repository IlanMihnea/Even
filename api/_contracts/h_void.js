// POST /api/contracts-void   (admin only — requires Supabase session Bearer token)
// Body (JSON): { id }   — the contract id to cancel
//
// Cancels a contract WITHOUT destroying evidence:
//   - sets status = 'void' (shown as "Anulat" in the admin list)
//   - keeps the signed PDF, the SHA-256 hash and the full audit trail as archive
//   - the sign endpoint refuses to sign a voided contract, so any still-open
//     personal links go dead too.
// Note: for an already-signed contract this does NOT undo its legal force — the
// signed copy was emailed to every party. Real cancellation is a written notice
// (denunțare/reziliere, art. IV.4 of the contract).
// → 200 { ok: true }

const supabase = require('../_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // --- admin auth: verify the Supabase session JWT ---
  const auth = req.headers.authorization || '';
  const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!jwt) return res.status(401).json({ error: 'Neautentificat' });
  const { data: userData, error: authErr } = await supabase.auth.getUser(jwt);
  if (authErr || !userData || !userData.user) return res.status(401).json({ error: 'Sesiune invalidă' });

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id lipsă' });

  const { data: updated, error: upErr } = await supabase
    .from('contracts')
    .update({ status: 'void' })
    .eq('id', id)
    .select('id');
  if (upErr) {
    console.error('contract void error:', upErr);
    return res.status(500).json({ error: 'Eroare la anularea contractului' });
  }
  if (!updated || updated.length === 0) return res.status(404).json({ error: 'Contractul nu există' });

  return res.status(200).json({ ok: true });
};
