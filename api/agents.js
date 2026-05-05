// GET /api/agents          — list all agents
// GET /api/agents?id=ag-001 — single agent with their active listings

const supabase = require('./_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;

  if (id) {
    // Single agent + their properties
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return res.status(404).json({ error: 'Agent negăsit' });

    const { data: proprietati } = await supabase
      .from('properties')
      .select('id, titlu, pret, suprafata, camere, oras, cartier, imagini, regim, tip, categorie, moneda, activ')
      .eq('agent_id', id)
      .eq('activ', true)
      .order('id', { ascending: false });

    return res.status(200).json({ agent, proprietati: proprietati || [] });
  }

  // All agents
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('ani', { ascending: false });

  if (error) {
    console.error('Agents fetch error:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ agents: data });
};
