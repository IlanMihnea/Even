// GET /api/property?id=rez-001
// Returns a single property with its assigned agent details.
// Also returns similar properties (same categorie + oras, different id, limit 3).

const supabase = require('./_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Parametrul "id" este obligatoriu' });

  // Fetch property
  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return res.status(404).json({ error: 'Proprietatea nu a fost găsită' });
    console.error('Property fetch error:', error);
    return res.status(500).json({ error: error.message });
  }

  // Fetch assigned agent
  let agent = null;
  if (property.agent_id) {
    const { data } = await supabase
      .from('agents')
      .select('id, nume, rol, email, telefon, foto, proprietati_vandute, ani')
      .eq('id', property.agent_id)
      .single();
    agent = data;
  }

  // Fetch similar properties (same category & city, different id, active, limit 3)
  const { data: similare } = await supabase
    .from('properties')
    .select('id, titlu, pret, suprafata, camere, etaj, oras, cartier, imagini, regim, tip, compartimentare, confort, moneda')
    .eq('categorie', property.categorie)
    .eq('oras', property.oras)
    .eq('activ', true)
    .neq('id', id)
    .limit(3);

  return res.status(200).json({
    property,
    agent,
    similare: similare || []
  });
};
