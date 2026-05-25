// POST /api/import-imobiliare  { url }
// Fetches an imobiliare.ro listing page, parses JSON-LD + URL slug + description,
// returns a camelCase object that matches the admin "Add property" form fields.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&nbsp;/g, ' ');
}

function pickFirst(graph, type) {
  return graph.find(n => n['@type'] === type);
}
function pickAll(graph, type) {
  return graph.filter(n => n['@type'] === type);
}

function parseSlug(url) {
  // ex: /oferta/apartament-de-inchiriat-sector-1-pajura-mobilat-2-camere-275527180
  const m = url.match(/\/oferta\/([^/?#]+)/i);
  if (!m) return {};
  const slug = m[1].toLowerCase();
  const out = { slug };

  // regim
  if (/-de-inchiriat-|-inchiriat-|-inchiriere-/.test(slug)) out.regim = 'inchiriere';
  else if (/-de-vanzare-|-vanzare-/.test(slug)) out.regim = 'vanzare';

  // tip + categorie
  const typeMap = {
    apartament: { categorie: 'rezidential', tip: 'apartament' },
    garsoniera: { categorie: 'rezidential', tip: 'studio' },
    studio:     { categorie: 'rezidential', tip: 'studio' },
    casa:       { categorie: 'rezidential', tip: 'casa' },
    vila:       { categorie: 'rezidential', tip: 'vila' },
    duplex:     { categorie: 'rezidential', tip: 'duplex' },
    teren:      { categorie: 'terenuri',    tip: 'intravilan-rezidential' },
    spatiu:     { categorie: 'comercial',   tip: 'birouri' },
    birouri:    { categorie: 'comercial',   tip: 'birouri' },
    hala:       { categorie: 'comercial',   tip: 'industrial' },
    depozit:    { categorie: 'comercial',   tip: 'depozit' },
  };
  for (const k of Object.keys(typeMap)) {
    if (slug.startsWith(k + '-')) { Object.assign(out, typeMap[k]); break; }
  }

  // camere
  const cm = slug.match(/(\d+)-camere/);
  if (cm) out.camere = +cm[1];

  // sector
  const sm = slug.match(/sector-(\d)/);
  if (sm) out.sector = +sm[1];

  return out;
}

// imobiliare.ro caps JSON-LD product.description at ~1000 chars (often ending
// mid-HTML-entity like `via&...`). The full description lives elsewhere in
// the page — typically inside one of the inline JSON blobs (Next.js / Nuxt
// state, embedded data scripts). Walk every <script type="application/json">
// and any other inline JSON blob, find the longest string that begins like
// the short description we already have, and use that as the canonical body.
function findLongestStringByPrefix(node, prefix, best) {
  if (typeof node === 'string') {
    if (node.length > best.value && node.startsWith(prefix)) best.value = node.length, best.text = node;
    return;
  }
  if (Array.isArray(node)) { for (const n of node) findLongestStringByPrefix(n, prefix, best); return; }
  if (node && typeof node === 'object') {
    for (const k in node) findLongestStringByPrefix(node[k], prefix, best);
  }
}

function extractFullDescription(html, shortDesc) {
  if (!shortDesc) return shortDesc;
  const stripped = shortDesc.replace(/&[#\w]*\.{0,3}$/, '').trim();
  const prefix = stripped.slice(0, 60);
  if (!prefix) return shortDesc;

  const best = { value: shortDesc.length, text: shortDesc };

  // Strategy A: every <script type="application/json"> block
  const jsonScripts = html.match(/<script[^>]*type=["']application\/(?:ld\+)?json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const block of jsonScripts) {
    const body = block.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
    try {
      const data = JSON.parse(body);
      findLongestStringByPrefix(data, prefix, best);
    } catch (_) { /* skip malformed */ }
  }

  // Strategy B: inline state assignments (Nuxt / Next / custom)
  const stateRgx = /(?:window\.__NUXT__|window\.__INITIAL_STATE__|window\.__NEXT_DATA__|window\.__APOLLO_STATE__)\s*=\s*(\{[\s\S]*?\});?<\/script>/g;
  let m;
  while ((m = stateRgx.exec(html))) {
    try {
      const data = JSON.parse(m[1]);
      findLongestStringByPrefix(data, prefix, best);
    } catch (_) { /* skip */ }
  }

  // Strategy C: raw HTML body — find prefix and read forward to a natural end
  if (best.text.length <= shortDesc.length + 10) {
    const idx = html.indexOf(prefix);
    if (idx >= 0) {
      // grab a generous window, then strip HTML and decode
      const window2 = html.slice(idx, idx + 8000);
      const cleaned = window2.replace(/<\/?[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleaned.length > best.text.length) best.text = cleaned;
    }
  }

  return best.text || shortDesc;
}

function parseDescription(desc) {
  const out = {};
  if (!desc) return out;
  const d = desc.toLowerCase();

  // an constructie (1900-2099)
  const anM = desc.match(/(?:finalizat[ăa]?\s+(?:în|in)\s+|construc[tț]ie\s+|anul?\s+|din\s+anul?\s+)(\d{4})/i)
            || desc.match(/\b(19\d{2}|20\d{2})\b/);
  if (anM) {
    const y = +anM[1]; if (y >= 1900 && y <= 2100) out.anConstructie = y;
  }

  // etaj X din Y
  const etM = desc.match(/etaj(?:ul)?\s+(\d{1,2})\s+(?:din|\/)\s+(\d{1,2})/i);
  if (etM) { out.etaj = +etM[1]; out.etajTotal = +etM[2]; }

  // suprafata utila / totala (mp)
  const sUtil = desc.match(/suprafa[tț][ăa]\s+util[ăa][^0-9]{0,15}(\d{2,4})/i);
  const sTot  = desc.match(/suprafa[tț][ăa]\s+total[ăa][^0-9]{0,15}(\d{2,4})/i);
  if (sUtil) out.suprafata = +sUtil[1];
  if (sTot)  out.suprafataTotala = +sTot[1];

  // compartimentare
  if (/semidecomandat/i.test(d)) out.compartimentare = 'semidecomandat';
  else if (/nedecomandat/i.test(d)) out.compartimentare = 'nedecomandat';
  else if (/decomandat/i.test(d)) out.compartimentare = 'decomandat';

  // mobilat
  if (/mobilat\s+lux|lux\s+mobilat/i.test(d)) out.mobilat = 'mobilat-lux';
  else if (/par[tț]ial\s+mobilat|semi-?mobilat/i.test(d)) out.mobilat = 'partial-mobilat';
  else if (/nemobilat/i.test(d)) out.mobilat = 'nemobilat';
  else if (/\bmobilat[ăa]?\b/i.test(d)) out.mobilat = 'mobilat';

  // incalzire
  if (/central[ăa]\s+proprie/i.test(d)) out.tipIncalzire = 'centrala-proprie';
  else if (/central[ăa]\s+bloc/i.test(d)) out.tipIncalzire = 'centrala-bloc';
  else if (/termoficare/i.test(d)) out.tipIncalzire = 'termoficare';
  else if (/pomp[ăa]\s+de\s+c[ăa]ldur[ăa]/i.test(d)) out.tipIncalzire = 'pompa-caldura';
  else if (/podea\s+radiant[ăa]/i.test(d)) out.tipIncalzire = 'podea-radianta';

  // booleans
  out.parcare = /\bparcare\b|loc\s+de\s+parcare|parking/i.test(d);
  out.balcon  = /\bbalcon|balcoane/i.test(d);

  // terase
  const terM = desc.match(/(\d+)\s*teras[ăae]/i);
  if (terM) out.terase = +terM[1];
  else if (/teras[ăa]/i.test(d)) out.terase = 1;

  return out;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
  const url = body && body.url;
  if (!url || !/^https?:\/\/(www\.)?imobiliare\.ro\/oferta\//i.test(url)) {
    return res.status(400).json({ error: 'URL invalid. Trebuie să fie un link imobiliare.ro/oferta/...' });
  }

  let html;
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ro-RO,ro;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    });
    if (!r.ok) return res.status(502).json({ error: `imobiliare.ro a răspuns cu ${r.status}` });
    html = await r.text();
  } catch (e) {
    return res.status(502).json({ error: 'Nu am putut accesa pagina: ' + e.message });
  }

  // Extract JSON-LD
  const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!ldMatch) return res.status(422).json({ error: 'Nu am găsit date structurate în pagină.' });

  let graph;
  try {
    const parsed = JSON.parse(ldMatch[1]);
    graph = parsed['@graph'] || [parsed];
  } catch (e) {
    return res.status(422).json({ error: 'JSON-LD invalid: ' + e.message });
  }

  const product       = pickFirst(graph, 'Product');
  const accommodation = pickFirst(graph, 'Accommodation');
  const offer         = pickFirst(graph, 'Offer');
  const breadcrumb    = pickFirst(graph, 'BreadcrumbList');
  const agent         = pickFirst(graph, 'RealEstateAgent');
  const places        = pickAll(graph, 'PostalAddress');

  const slugData = parseSlug(url);
  const titlu = decodeEntities(product?.name || '').replace(/\s*\|\s*Imobiliare\.ro\s*$/i, '').trim();
  // JSON-LD description is capped (~1000 chars, often ending in a half entity).
  // Try to recover the full text from inline JSON blobs / HTML body.
  const shortDesc = decodeEntities(product?.description || '');
  let descriere = extractFullDescription(html, shortDesc);
  // Final clean-up: decode any remaining entities and trim trailing truncation
  // markers that some sources leave behind (e.g. `… `, `&...`).
  descriere = decodeEntities(descriere || '')
    .replace(/\s*&[#\w]*\.{2,}\s*$/, '')
    .replace(/\s*…\s*$/, '')
    .trim();
  const descParsed = parseDescription(descriere);

  // Price
  let pret, moneda;
  const ps = offer?.priceSpecification;
  if (ps) { pret = +ps.price || undefined; moneda = ps.priceCurrency || 'EUR'; }

  // Address — imobiliare.ro uses addressLocality=cartier, addressRegion="Sector X".
  // We map: cartier ← addressLocality, oras ← deduced (București if sector present), adresa ← streetAddress.
  const listingAddr = places.find(a => /listing/i.test(a['@id'] || ''));
  const localityRaw = decodeEntities(listingAddr?.addressLocality || '');
  const regionRaw   = decodeEntities(listingAddr?.addressRegion || '');
  const streetRaw   = decodeEntities(listingAddr?.streetAddress || '');

  const cartier = localityRaw || (slugData.slug && slugData.slug.split('-').filter(w =>
    !['apartament','casa','vila','duplex','studio','garsoniera','teren','spatiu','de','inchiriat','vanzare','mobilat','nemobilat','sector','camere'].includes(w)
    && isNaN(+w)
  )[0]);

  // Oras: if region looks like "Sector X" → București; otherwise use region as-is, else fall back to sector heuristic.
  let oras;
  if (/sector\s*\d/i.test(regionRaw) || slugData.sector) oras = 'București';
  else if (regionRaw && !/rom[âa]nia/i.test(regionRaw)) oras = regionRaw;

  // Adresa: prefer the street address; fall back to "Sector X".
  const adresa = streetRaw
              || (slugData.sector ? `Sector ${slugData.sector}` : (regionRaw || undefined));

  const result = {
    sourceUrl: url,
    // category & type
    categorie: slugData.categorie || 'rezidential',
    tip: slugData.tip,
    regim: slugData.regim,
    // core
    titlu,
    descriere,
    pret,
    moneda,
    // residential
    camere: slugData.camere || (accommodation?.numberOfBedrooms ? +accommodation.numberOfBedrooms : undefined),
    dormitoare: accommodation?.numberOfBedrooms ? +accommodation.numberOfBedrooms : undefined,
    bai: accommodation?.numberOfBathroomsTotal ? +accommodation.numberOfBathroomsTotal : undefined,
    suprafata: accommodation?.floorSize ? +accommodation.floorSize : descParsed.suprafata,
    etaj: accommodation?.floorLevel ? +accommodation.floorLevel : descParsed.etaj,
    etajTotal: descParsed.etajTotal,
    anConstructie: descParsed.anConstructie,
    suprafataTotala: descParsed.suprafataTotala,
    compartimentare: descParsed.compartimentare,
    mobilat: descParsed.mobilat
          || (slugData.slug && /-mobilat-/.test(slugData.slug) && !/nemobilat/.test(slugData.slug) ? 'mobilat' : undefined)
          || (slugData.slug && /-nemobilat-/.test(slugData.slug) ? 'nemobilat' : undefined),
    tipIncalzire: descParsed.tipIncalzire,
    parcare: descParsed.parcare,
    balcon: descParsed.balcon,
    terase: descParsed.terase,
    // location
    oras: oras ? oras.charAt(0).toUpperCase() + oras.slice(1) : undefined,
    cartier: cartier ? cartier.charAt(0).toUpperCase() + cartier.slice(1) : undefined,
    adresa,
    // meta
    agenceName: agent?.name,
    // Keep imobiliare image URLs only as a fallback reference (user uploads own)
    imaginiSursa: Array.isArray(product?.image)
      ? product.image.map(i => i['@id'] || i.url).filter(Boolean)
      : [],
  };

  // Strip undefined for cleanliness
  Object.keys(result).forEach(k => result[k] === undefined && delete result[k]);

  return res.status(200).json(result);
};
