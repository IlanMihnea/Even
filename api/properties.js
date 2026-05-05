// GET /api/properties
// Query params:
//   categorie       — rezidential | comercial | terenuri
//   regim           — vanzare | inchiriere
//   tip             — apartament | vila | casa | duplex | studio | birouri | retail | depozit | showroom | industrial | intravilan-rezidential | intravilan-comercial | extravilan-agricol | industrial
//   oras            — partial match
//   cartier         — partial match
//   camere          — exact (1,2,3,4,5+)
//   camere_min/max  — range
//   pret_min/max    — range (EUR)
//   suprafata_min/max — range (mp)
//   etaj_min/max    — range
//   compartimentare — decomandat | semidecomandat | nedecomandat | circular | duplex | open-space
//   confort         — 1 | 2 | 3 | lux
//   mobilat         — nemobilat | partial-mobilat | mobilat | mobilat-lux
//   tip_incalzire   — centrala-proprie | centrala-bloc | termoficare | pompa-caldura | podea-radianta
//   parcare         — true | false
//   balcon          — true | false
//   an_constructie_min/max — range
//   q               — full-text search (titlu, descriere, oras, cartier)
//   page            — default 1
//   limit           — default 12, max 50
//   sort            — pret | suprafata | camere | an_constructie (default: id)
//   order           — asc | desc (default: desc)

const supabase = require('./_supabase');

const ALLOWED_SORTS = ['pret', 'suprafata', 'camere', 'an_constructie', 'pret_mp', 'suprafata_totala'];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const {
    categorie, regim, tip, oras, cartier,
    camere, camere_min, camere_max,
    pret_min, pret_max,
    suprafata_min, suprafata_max,
    etaj_min, etaj_max,
    compartimentare, confort, mobilat, tip_incalzire,
    parcare, balcon,
    an_constructie_min, an_constructie_max,
    q,
    page = '1',
    limit = '12',
    sort,
    order = 'desc'
  } = req.query;

  let query = supabase.from('properties').select('*', { count: 'exact' }).eq('activ', true);

  // Category & transaction
  if (categorie)        query = query.eq('categorie', categorie);
  if (regim)            query = query.eq('regim', regim);
  if (tip)              query = query.eq('tip', tip);

  // Location
  if (oras)             query = query.ilike('oras', `%${oras}%`);
  if (cartier)          query = query.ilike('cartier', `%${cartier}%`);

  // Rooms
  if (camere)           query = query.eq('camere', parseInt(camere));
  else {
    if (camere_min)     query = query.gte('camere', parseInt(camere_min));
    if (camere_max)     query = query.lte('camere', parseInt(camere_max));
  }

  // Price
  if (pret_min)         query = query.gte('pret', parseFloat(pret_min));
  if (pret_max)         query = query.lte('pret', parseFloat(pret_max));

  // Surface
  if (suprafata_min)    query = query.gte('suprafata', parseFloat(suprafata_min));
  if (suprafata_max)    query = query.lte('suprafata', parseFloat(suprafata_max));

  // Floor
  if (etaj_min)         query = query.gte('etaj', parseInt(etaj_min));
  if (etaj_max)         query = query.lte('etaj', parseInt(etaj_max));

  // Apartment-specific
  if (compartimentare)  query = query.eq('compartimentare', compartimentare);
  if (confort)          query = query.eq('confort', confort);
  if (mobilat)          query = query.eq('mobilat', mobilat);
  if (tip_incalzire)    query = query.eq('tip_incalzire', tip_incalzire);
  if (parcare !== undefined && parcare !== '') query = query.eq('parcare', parcare === 'true');
  if (balcon  !== undefined && balcon  !== '') query = query.eq('balcon',  balcon  === 'true');

  // Year built
  if (an_constructie_min) query = query.gte('an_constructie', parseInt(an_constructie_min));
  if (an_constructie_max) query = query.lte('an_constructie', parseInt(an_constructie_max));

  // Full-text search
  if (q) {
    const safe = q.replace(/[%_]/g, '\\$&');
    query = query.or(
      `titlu.ilike.%${safe}%,descriere.ilike.%${safe}%,oras.ilike.%${safe}%,cartier.ilike.%${safe}%,adresa.ilike.%${safe}%`
    );
  }

  // Pagination
  const pageNum  = Math.max(1, parseInt(page)  || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 12));
  const offset   = (pageNum - 1) * limitNum;

  // Sorting
  const sortCol  = ALLOWED_SORTS.includes(sort) ? sort : 'id';
  const ascending = order === 'asc';
  query = query.range(offset, offset + limitNum - 1).order(sortCol, { ascending });

  const { data, error, count } = await query;

  if (error) {
    console.error('Properties fetch error:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({
    properties: data,
    total: count,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil((count || 0) / limitNum)
  });
};
