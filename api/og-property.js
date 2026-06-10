const fs = require('fs');
const path = require('path');
const supabase = require('./_supabase');

const BASE_URL = 'https://even-imobiliare.ro';
const OG_DEFAULT = `${BASE_URL}/design/og-default.jpg`;

const PAGE_CONFIG = {
  rezidential: {
    table: 'properties',
    filter: { categorie: 'rezidential' },
    file: 'property-rezidential.html',
  },
  comercial: {
    table: 'properties',
    filter: { categorie: 'comercial' },
    file: 'property-comercial.html',
  },
  teren: {
    table: 'properties',
    filter: { categorie: 'terenuri' },
    file: 'property-teren.html',
  },
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatPrice(n) {
  if (!n) return null;
  return new Intl.NumberFormat('ro-RO').format(n) + ' €';
}

function buildTitle(p, page) {
  const price = formatPrice(p.pret || p.pret_total);
  const location = p.cartier || p.oras || '';
  const parts = [esc(p.titlu)];
  if (location) parts.push(esc(location));
  if (price) parts.push(price);
  parts.push('EVEN');
  return parts.join(' · ');
}

function buildDescription(p) {
  const raw = String(p.descriere || '').replace(/<[^>]+>/g, '').trim();
  return esc(raw.slice(0, 155)) || null;
}

function buildJsonLd(p, page, canonicalUrl) {
  const price = p.pret || p.pret_total;
  const image = (p.imagini && p.imagini[0]) || OG_DEFAULT;

  const obj = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: p.titlu,
    description: String(p.descriere || '').replace(/<[^>]+>/g, '').trim().slice(0, 500) || undefined,
    url: canonicalUrl,
    image: image,
    address: {
      '@type': 'PostalAddress',
      streetAddress: p.adresa || p.cartier || '',
      addressLocality: p.oras || 'București',
      addressCountry: 'RO',
    },
  };

  if (price) {
    obj.offers = {
      '@type': 'Offer',
      price: String(price),
      priceCurrency: p.moneda || 'EUR',
      availability: 'https://schema.org/InStock',
    };
  }

  // Clean up undefined fields
  Object.keys(obj).forEach(k => obj[k] === undefined && delete obj[k]);
  if (obj.address) Object.keys(obj.address).forEach(k => !obj.address[k] && delete obj.address[k]);

  return JSON.stringify(obj);
}

function injectHead(html, injections) {
  // Replace each existing tag if found, otherwise inject before </head>
  let result = html;

  // Title
  if (injections.title) {
    result = result.replace(/<title>[^<]*<\/title>/, `<title>${injections.title}</title>`);
  }

  // meta description
  if (injections.description) {
    result = result.replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${injections.description}">`
    );
  }

  // og:title
  result = result.replace(
    /<meta property="og:title"[^>]*>/,
    `<meta property="og:title" content="${injections.ogTitle}">`
  );

  // og:description
  if (injections.ogDescription) {
    result = result.replace(
      /<meta property="og:description"[^>]*>/,
      `<meta property="og:description" content="${injections.ogDescription}">`
    );
  }

  // og:image — replace the default with the property image
  if (injections.ogImage) {
    result = result.replace(
      /<meta property="og:image" content="[^"]*">/,
      `<meta property="og:image" content="${injections.ogImage}">`
    );
  }

  // Inject canonical + og:url + JSON-LD before </head>
  const extras = [];
  if (injections.canonical) {
    extras.push(`  <link rel="canonical" href="${injections.canonical}">`);
    extras.push(`  <meta property="og:url" content="${injections.canonical}">`);
  }
  if (injections.jsonLd) {
    extras.push(`  <script type="application/ld+json">${injections.jsonLd}</script>`);
  }

  if (extras.length) {
    result = result.replace('</head>', extras.join('\n') + '\n</head>');
  }

  return result;
}

module.exports = async (req, res) => {
  const { page, id } = req.query;

  const config = PAGE_CONFIG[page];
  if (!config) {
    res.status(400).end('Unknown page');
    return;
  }

  // Read the static HTML shell from disk
  const htmlPath = path.join(process.cwd(), 'project', config.file);
  let html;
  try {
    html = fs.readFileSync(htmlPath, 'utf8');
  } catch {
    res.status(500).end('Could not read HTML file');
    return;
  }

  // If no id, serve the HTML as-is (listing page hit without a property)
  if (!id) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=86400');
    res.status(200).send(html);
    return;
  }

  // Fetch property from Supabase
  let query = supabase.from(config.table).select('*').eq('id', id);
  const { data: property, error } = await query.single();

  // On error or inactive property, serve HTML unmodified (JS handles the state)
  if (error || !property || property.activ === false) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).send(html);
    return;
  }

  const canonicalUrl = `${BASE_URL}/${config.file}?id=${id}`;
  const ogImage = (property.imagini && property.imagini[0]) ? esc(property.imagini[0]) : OG_DEFAULT;
  const title = buildTitle(property, page);
  const description = buildDescription(property);

  const patched = injectHead(html, {
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogImage,
    canonical: esc(canonicalUrl),
    jsonLd: buildJsonLd(property, page, canonicalUrl),
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=86400');
  res.status(200).send(patched);
};
