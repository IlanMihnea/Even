// GET /api/category-counts
// Returns count of active properties per category: { rezidential, comercial, terenuri }

const supabase = require('./_supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { data, error } = await supabase
    .from('properties')
    .select('categorie')
    .eq('activ', true);

  if (error) return res.status(500).json({ error: error.message });

  const counts = { rezidential: 0, comercial: 0, terenuri: 0 };
  (data || []).forEach(row => {
    if (row.categorie in counts) counts[row.categorie]++;
  });

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return res.status(200).json(counts);
};
