// GET /api/feed-imobiliare  →  application/xml
//
// Feed-ul de oferte pe care imobiliare.ro îl trage automat (la câteva ore) ca să
// sincronizeze portofoliul EVEN. Mecanismul standard de "import automat oferte":
// noi publicăm acest URL, ei îl preiau periodic și adaugă/actualizează/șterg
// anunțurile singuri. Postezi o proprietate în admin (cu flag-ul "Publică pe
// imobiliare.ro") → la următorul pull apare pe portal, hands-off.
//
// Apar în feed DOAR proprietățile care sunt: activ = true ȘI export_imobiliare = true.
// (vezi seed/migration-export-imobiliare-2026-06.sql)
//
// ⚠ FORMATUL XML de mai jos (funcția propertyToOffer + numele tag-urilor) este
// construit pe convențiile uzuale de feed imobiliar din RO. Denumirile EXACTE ale
// câmpurilor le primești de la imobiliare.ro când activezi importul automat
// (XSD / documentația lor de partener). Când le ai, ajustezi DOAR propertyToOffer —
// restul (interogare, escaping, livrare) rămâne neschimbat.
//
// Protecție opțională: setează env FEED_IMOBILIARE_TOKEN și dă-le URL-ul cu
// ?token=... — fără env, feed-ul e public (uneori necesar ca puller-ul lor să-l ia).

const supabase = require('./_supabase');

// ---------- XML helpers ----------
function esc(v) {
  if (v == null) return '';
  return String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
// Pentru text liber lung (descriere) — CDATA, păstrează diacritice/linii.
function cdata(v) {
  if (v == null) return '';
  return `<![CDATA[${String(v).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}
// <tag>val</tag> doar dacă val există (omite câmpurile goale → feed curat).
function tag(name, val, { raw = false } = {}) {
  if (val == null || val === '' || (typeof val === 'number' && Number.isNaN(val))) return '';
  return `    <${name}>${raw ? val : esc(val)}</${name}>\n`;
}

// ---------- MAPARE (singura piesă de ajustat la spec-ul imobiliare.ro) ----------
const TRANZACTIE = { vanzare: 'vanzare', inchiriere: 'inchiriere' };

function pretHeadline(p) {
  // Prețul „de afișat": rezidențial → pret; comercial/teren → pret_total dacă există.
  if (p.pret != null) return p.pret;
  if (p.pret_total != null) return p.pret_total;
  return null;
}

function propertyToOffer(p, agent) {
  const imagini = Array.isArray(p.imagini) ? p.imagini.filter(Boolean) : [];
  const lastmod = p.updated_at || p.created_at;

  let xml = '  <oferta>\n';
  // Identitate
  xml += tag('id', p.imobiliare_ref || p.id);
  xml += tag('referinta', p.id);
  xml += tag('data_actualizare', lastmod && new Date(lastmod).toISOString());
  // Clasificare
  xml += tag('tip_tranzactie', TRANZACTIE[p.regim] || p.regim);
  xml += tag('categorie', p.categorie);
  xml += tag('tip_proprietate', p.tip || p.tip_spatiu);
  // Conținut
  xml += tag('titlu', p.titlu);
  xml += `    <descriere>${cdata(p.descriere)}</descriere>\n`;
  // Preț
  xml += tag('pret', pretHeadline(p));
  xml += tag('pret_total', p.pret_total);
  xml += tag('pret_mp', p.pret_mp);
  xml += tag('moneda', p.moneda || 'EUR');
  xml += tag('pret_negociabil', p.pret_negociabil ? 1 : 0);
  xml += tag('tva', p.plus_tva ? 1 : 0);
  // Suprafețe & structură
  xml += tag('suprafata_utila', p.suprafata_utila || p.suprafata);
  xml += tag('suprafata_totala', p.suprafata_totala);
  xml += tag('numar_camere', p.camere);
  xml += tag('numar_dormitoare', p.dormitoare);
  xml += tag('numar_bai', p.bai);
  xml += tag('etaj', p.etaj);
  xml += tag('etaj_total', p.etaj_total);
  xml += tag('an_constructie', p.an_constructie);
  xml += tag('compartimentare', p.compartimentare);
  xml += tag('confort', p.confort);
  xml += tag('mobilat', p.mobilat);
  xml += tag('tip_incalzire', p.tip_incalzire);
  xml += tag('orientare', p.orientare);
  xml += tag('balcon', p.balcon ? 1 : 0);
  xml += tag('parcare', p.parcare ? 1 : 0);
  // Teren
  xml += tag('front_stradal', p.front_stradal);
  xml += tag('clasa_energetica', p.clasa_cladire);
  // Localizare
  xml += tag('judet', p.judet || (p.oras === 'București' ? 'București' : undefined));
  xml += tag('localitate', p.localitate || p.oras);
  xml += tag('zona', p.cartier);
  xml += tag('adresa', p.adresa);
  xml += tag('latitudine', p.lat);
  xml += tag('longitudine', p.lng);
  // Agent de contact
  if (agent) {
    xml += '    <agent>\n';
    xml += '  ' + tag('nume', agent.nume);
    xml += '  ' + tag('telefon', agent.telefon);
    xml += '  ' + tag('email', agent.email);
    xml += '    </agent>\n';
  }
  // Imagini
  if (imagini.length) {
    xml += '    <imagini>\n';
    for (const url of imagini) xml += `      <imagine>${esc(url)}</imagine>\n`;
    xml += '    </imagini>\n';
  }
  xml += '  </oferta>\n';
  return xml;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).end();
  }
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Protecție opțională prin token.
  const required = process.env.FEED_IMOBILIARE_TOKEN;
  if (required && req.query.token !== required) {
    return res.status(401).json({ error: 'Token invalid' });
  }

  const { data, error } = await supabase
    .from('properties')
    .select('*, agents(nume, telefon, email)')
    .eq('activ', true)
    .eq('export_imobiliare', true)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('feed-imobiliare error:', error);
    return res.status(500).json({ error: error.message });
  }

  let body = '<?xml version="1.0" encoding="UTF-8"?>\n<oferte>\n';
  for (const p of data || []) body += propertyToOffer(p, p.agents);
  body += '</oferte>\n';

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  // Cache scurt — puller-ul imobiliare.ro nu trage des, dar evităm hammering.
  res.setHeader('Cache-Control', 'public, max-age=900');
  return res.status(200).send(body);
};
