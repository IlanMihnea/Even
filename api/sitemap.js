const supabase = require('./_supabase');

const BASE = 'https://even-imobiliare.ro';

const STATIC_PAGES = [
  { url: '/', priority: '1.0' },
  { url: '/listings-rezidential.html', priority: '0.9' },
  { url: '/listings-comercial.html', priority: '0.9' },
  { url: '/listings-terenuri.html', priority: '0.9' },
  { url: '/projects.html', priority: '0.8' },
  { url: '/about.html', priority: '0.7' },
  { url: '/contact.html', priority: '0.7' },
  { url: '/terms.html', priority: '0.3' },
  { url: '/privacy.html', priority: '0.3' },
];

const CATEGORY_PAGE = {
  rezidential: 'property-rezidential.html',
  comercial: 'property-comercial.html',
  terenuri: 'property-teren.html',
};

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

  const [{ data: properties }, { data: projects }] = await Promise.all([
    supabase.from('properties').select('id, categorie').eq('activ', true),
    supabase.from('projects').select('id').eq('activ', true),
  ]);

  const urls = [];

  for (const page of STATIC_PAGES) {
    urls.push(`  <url><loc>${BASE}${page.url}</loc><priority>${page.priority}</priority></url>`);
  }

  for (const p of (properties || [])) {
    const pageName = CATEGORY_PAGE[p.categorie];
    if (!pageName) continue;
    urls.push(`  <url><loc>${BASE}/${pageName}?id=${p.id}</loc><priority>0.8</priority></url>`);
  }

  for (const p of (projects || [])) {
    urls.push(`  <url><loc>${BASE}/project-detail.html?id=${p.id}</loc><priority>0.7</priority></url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(xml);
};
