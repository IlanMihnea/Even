// GET /api/projects              — list all active projects
// GET /api/projects?id=proj-001  — single project with units
// GET /api/projects?oras=Cluj    — filter by city
// GET /api/projects?status=finalizat|construire|pre-vanzare

const supabase = require('./_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id, oras, status } = req.query;

  if (id) {
    // Single project with full units
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Proiect negăsit' });
      return res.status(500).json({ error: error.message });
    }

    const { data: unitati } = await supabase
      .from('project_units')
      .select('*')
      .eq('project_id', id)
      .order('etaj', { ascending: true })
      .order('numar', { ascending: true });

    // Unit stats summary
    const stats = { disponibil: 0, rezervat: 0, vandut: 0, total: 0 };
    (unitati || []).forEach(u => {
      stats.total++;
      if (stats[u.status] !== undefined) stats[u.status]++;
    });

    return res.status(200).json({
      project: { ...project, unitati: unitati || [], stats }
    });
  }

  // List projects
  let query = supabase.from('projects').select('*').eq('activ', true);
  if (oras)   query = query.ilike('oras', `%${oras}%`);
  if (status) query = query.eq('status', status);
  query = query.order('progres', { ascending: false });

  const { data, error } = await query;
  if (error) {
    console.error('Projects fetch error:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ projects: data });
};
