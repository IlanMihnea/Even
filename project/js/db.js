// ============================================
// DB.JS — Supabase data access layer
// Replace the two constants below with your
// Supabase Project URL and anon public key.
// ============================================

const SUPABASE_URL = 'https://ucovahbjvnjmhistjnqf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjb3ZhaGJqdm5qbWhpc3RqbnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwODA5OTYsImV4cCI6MjA5NzY1Njk5Nn0.DV7BVm31TedKdsYQubmqDrgDnSO8MZV-PbPw97yEF3k';

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window._supabase = _supabase; // exposed for admin auth

// ---------- NORMALIZERS ----------

function normalizeAgent(a) {
  if (!a) return null;
  return {
    id: a.id, nume: a.nume, rol: a.rol, bio: a.bio,
    email: a.email, telefon: a.telefon, foto: a.foto,
    proprietatiVandute: a.proprietati_vandute, ani: a.ani
  };
}

function toRezidential(row) {
  return {
    id: row.id, titlu: row.titlu, regim: row.regim, tip: row.tip,
    pret: row.pret, camere: row.camere, suprafata: row.suprafata,
    etaj: row.etaj, etajTotal: row.etaj_total, anConstructie: row.an_constructie,
    orientare: row.orientare, parcare: row.parcare, balcon: row.balcon,
    oras: row.oras, cartier: row.cartier, adresa: row.adresa,
    descriere: row.descriere, imagini: row.imagini || [], facilitati: row.facilitati || [],
    agentId: row.agent_id, agent: normalizeAgent(row.agents), categorie: 'rezidential',
    lat: row.lat, lng: row.lng,
    banner: row.banner === true, homeHero: row.home_hero === true,
    viewCount: row.view_count || 0, activ: row.activ
  };
}

function toComercial(row) {
  return {
    id: row.id, titlu: row.titlu, regim: row.regim, tipSpatiu: row.tip_spatiu,
    pret: row.pret, pretTotal: row.pret_total,
    suprafataTotala: row.suprafata_totala, suprafataUtila: row.suprafata_utila,
    etaj: row.etaj, locuriParcare: row.locuri_parcare, inaltimeLibera: row.inaltime_libera,
    clasaCladire: row.clasa_cladire, oras: row.oras, cartier: row.cartier, adresa: row.adresa,
    descriere: row.descriere, imagini: row.imagini || [], specificatii: row.specificatii || {},
    agentId: row.agent_id, agent: normalizeAgent(row.agents), categorie: 'comercial',
    lat: row.lat, lng: row.lng,
    banner: row.banner === true, homeHero: row.home_hero === true,
    viewCount: row.view_count || 0, activ: row.activ
  };
}

function toTeren(row) {
  return {
    id: row.id, titlu: row.titlu, tip: row.tip,
    suprafata: row.suprafata, unitate: row.unitate,
    pretTotal: row.pret_total, pretMp: row.pret_mp,
    frontStradal: row.front_stradal, utilitati: row.utilitati || [],
    accesDrum: row.acces_drum, zonarePUG: row.zonare_pug,
    CUT: row.cut, POT: row.pot,
    judet: row.judet, localitate: row.localitate, adresa: row.adresa,
    descriere: row.descriere, vecinatati: row.vecinatati,
    imagini: row.imagini || [],
    agentId: row.agent_id, agent: normalizeAgent(row.agents), categorie: 'terenuri',
    lat: row.lat, lng: row.lng,
    banner: row.banner === true, homeHero: row.home_hero === true,
    viewCount: row.view_count || 0, activ: row.activ
  };
}

// ── BUYER PROFILES (saved searches) ───────────────────────────
function normalizeBuyerProfile(b) {
  if (!b) return null;
  return {
    id: b.id, nume: b.nume, email: b.email, telefon: b.telefon,
    categorie: b.categorie, regim: b.regim,
    tip: b.tip || [], orase: b.orase || [], cartiere: b.cartiere || [],
    camereMin: b.camere_min, camereMax: b.camere_max,
    pretMin: b.pret_min, pretMax: b.pret_max,
    suprafataMin: b.suprafata_min, suprafataMax: b.suprafata_max,
    note: b.note, prioritate: b.prioritate || 'normal',
    activ: b.activ !== false, agentId: b.agent_id,
    createdAt: b.created_at
  };
}

async function getBuyerProfiles() {
  const { data, error } = await _supabase
    .from('buyer_profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeBuyerProfile);
}

async function upsertBuyerProfile(b) {
  const dbRow = {
    nume: b.nume,
    email: b.email || null,
    telefon: b.telefon || null,
    categorie: b.categorie || null,
    regim: b.regim || null,
    tip: b.tip && b.tip.length ? b.tip : null,
    orase: b.orase && b.orase.length ? b.orase : null,
    cartiere: b.cartiere && b.cartiere.length ? b.cartiere : null,
    camere_min: b.camereMin || null,
    camere_max: b.camereMax || null,
    pret_min: b.pretMin || null,
    pret_max: b.pretMax || null,
    suprafata_min: b.suprafataMin || null,
    suprafata_max: b.suprafataMax || null,
    note: b.note || null,
    prioritate: b.prioritate || 'normal',
    activ: b.activ !== false,
    agent_id: b.agentId || null,
  };
  if (b.id) dbRow.id = b.id;
  const { data, error } = await _supabase
    .from('buyer_profiles').upsert(dbRow).select().single();
  if (error) throw error;
  return normalizeBuyerProfile(data);
}

async function deleteBuyerProfile(id) {
  const { error } = await _supabase.from('buyer_profiles').delete().eq('id', id);
  if (error) throw error;
}

// ── TRANZACȚII VÂNDUTE (ancora CMA) ──────────────────────────
function normalizeTranzactie(t) {
  if (!t) return null;
  return {
    id: t.id,
    dataVanzare: t.data_vanzare,
    oras: t.oras,
    cartier: t.cartier,
    adresa: t.adresa,
    tip: t.tip,
    camere: t.camere,
    suprafataUtila: t.suprafata_utila,
    suprafataTotala: t.suprafata_totala,
    etaj: t.etaj,
    etajTotal: t.etaj_total,
    anConstructie: t.an_constructie,
    compartimentare: t.compartimentare,
    stare: t.stare,
    mobilat: t.mobilat,
    parcare: t.parcare,
    locuriParcare: t.locuri_parcare,
    balcon: t.balcon,
    vedere: t.vedere,
    orientare: t.orientare,
    dotari: t.dotari || {},
    pretCerut: t.pret_cerut,
    pretVandut: t.pret_vandut,
    tvaInclus: t.tva_inclus,
    cotaTva: t.cota_tva,
    moneda: t.moneda || 'EUR',
    zilePePiata: t.zile_pe_piata,
    nrVizionari: t.nr_vizionari,
    finantare: t.finantare,
    propertyId: t.property_id,
    observatii: t.observatii,
    createdAt: t.created_at
  };
}

async function tranzactiiTableExists() {
  try {
    const { error } = await _supabase.from('tranzactii').select('id').limit(1);
    return !error || error.code !== '42P01';
  } catch { return false; }
}

async function getTranzactii(filter = {}) {
  let q = _supabase.from('tranzactii').select('*').order('data_vanzare', { ascending: false });
  if (filter.cartier) q = q.ilike('cartier', `%${filter.cartier}%`);
  if (filter.camere) q = q.eq('camere', filter.camere);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(normalizeTranzactie);
}

async function upsertTranzactie(t) {
  const row = {
    data_vanzare: t.dataVanzare,
    oras: t.oras || 'București',
    cartier: t.cartier || null,
    adresa: t.adresa || null,
    tip: t.tip || 'apartament',
    camere: t.camere || null,
    suprafata_utila: t.suprafataUtila,
    suprafata_totala: t.suprafataTotala || null,
    etaj: t.etaj != null ? t.etaj : null,
    etaj_total: t.etajTotal || null,
    an_constructie: t.anConstructie || null,
    compartimentare: t.compartimentare || null,
    stare: t.stare || null,
    mobilat: t.mobilat || null,
    parcare: t.parcare || false,
    locuri_parcare: t.locuriParcare || 0,
    balcon: t.balcon || false,
    vedere: t.vedere || null,
    orientare: t.orientare || null,
    dotari: t.dotari && Object.keys(t.dotari).length ? t.dotari : null,
    pret_cerut: t.pretCerut || null,
    pret_vandut: t.pretVandut,
    tva_inclus: t.tvaInclus != null ? t.tvaInclus : null,
    cota_tva: t.cotaTva || 0.21,
    moneda: t.moneda || 'EUR',
    zile_pe_piata: t.zilePePiata || null,
    nr_vizionari: t.nrVizionari || null,
    finantare: t.finantare || null,
    property_id: t.propertyId || null,
    observatii: t.observatii || null,
  };
  if (t.id) row.id = t.id;
  const { data, error } = await _supabase.from('tranzactii').upsert(row).select().single();
  if (error) throw error;
  return normalizeTranzactie(data);
}

async function deleteTranzactie(id) {
  const { error } = await _supabase.from('tranzactii').delete().eq('id', id);
  if (error) throw error;
}

// Fire-and-forget view increment. Called from public property pages.
async function recordPropertyView(id) {
  if (!id) return;
  try { await _supabase.rpc('increment_property_view', { p_id: id }); }
  catch (e) { /* silent — don't break the page if RPC missing */ }
}

function toProject(row) {
  return {
    id: row.id, nume: row.nume, dezvoltator: row.dezvoltator,
    dezvoltatorProiecte: row.dezvoltator_proiecte || [],
    oras: row.oras, cartier: row.cartier, adresa: row.adresa,
    status: row.status, dataLivrare: row.data_livrare, progres: row.progres,
    intervalPret: { min: row.interval_pret_min, max: row.interval_pret_max },
    tipuriUnitati: row.tipuri_unitati || [],
    unitatiDisponibile: row.unitati_disponibile, unitatiTotal: row.unitati_total,
    descriere: row.descriere, facilitati: row.facilitati || [], imagini: row.imagini || [],
    planPlata: row.plan_plata || { avans: 0, rate: [] },
    timeline: row.timeline || [],
    unitati: (row.project_units || []).map(u => ({
      id: u.id, numar: u.numar, tip: u.tip, etaj: u.etaj,
      suprafata: u.suprafata, pret: u.pret, status: u.status
    }))
  };
}

// ---------- PUBLIC READS ----------

async function getProperties(categorie) {
  const converters = { rezidential: toRezidential, comercial: toComercial, terenuri: toTeren };
  const { data, error } = await _supabase
    .from('properties')
    .select('*, agents(*)')
    .eq('categorie', categorie)
    .eq('activ', true);
  if (error) throw error;
  return (data || []).map(converters[categorie]);
}

async function getPropertyById(id, categorie) {
  const converters = { rezidential: toRezidential, comercial: toComercial, terenuri: toTeren };
  const { data, error } = await _supabase
    .from('properties')
    .select('*, agents(*)')
    .eq('id', id)
    .single();
  if (error) return null;
  return converters[categorie](data);
}

// Property currently featured in the homepage hero card (over the video).
async function getHomeHeroProperty() {
  const { data, error } = await _supabase
    .from('properties')
    .select('*, agents(*)')
    .eq('home_hero', true)
    .eq('activ', true)
    .limit(1)
    .maybeSingle();
  if (error) return null;
  if (!data) return null;
  const converters = { rezidential: toRezidential, comercial: toComercial, terenuri: toTeren };
  const fn = converters[data.categorie];
  return fn ? fn(data) : data;
}

// Sets which property the homepage hero points to. Only one can be active.
async function setHomeHeroProperty(id) {
  const { error: clearErr } = await _supabase
    .from('properties').update({ home_hero: false }).eq('home_hero', true);
  if (clearErr) throw clearErr;
  if (id) {
    const { error } = await _supabase
      .from('properties').update({ home_hero: true }).eq('id', id);
    if (error) throw error;
  }
}

// Property currently featured on the physical QR banner.
// Raw row (snake_case) + joined agent — used by banner.html.
async function getBannerProperty() {
  const { data, error } = await _supabase
    .from('properties')
    .select('*, agents(*)')
    .eq('banner', true)
    .eq('activ', true)
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data;
}

async function getProjects() {
  const { data, error } = await _supabase
    .from('projects')
    .select('*, project_units(*)')
    .eq('activ', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(toProject);
}

async function getProjectById(id) {
  const { data, error } = await _supabase
    .from('projects')
    .select('*, project_units(*)')
    .eq('id', id)
    .single();
  if (error) return null;
  return toProject(data);
}

async function getAgents() {
  const { data, error } = await _supabase.from('agents').select('*');
  if (error) throw error;
  return (data || []).map(normalizeAgent);
}

async function getAgentById(id) {
  const { data, error } = await _supabase
    .from('agents').select('*').eq('id', id).single();
  if (error) return null;
  return normalizeAgent(data);
}

// ---------- ADMIN READS (all, including inactive) ----------

async function getAllPropertiesAdmin() {
  const { data, error } = await _supabase
    .from('properties')
    .select('*, agents(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const converters = { rezidential: toRezidential, comercial: toComercial, terenuri: toTeren };
  return (data || []).map(row => {
    const fn = converters[row.categorie];
    return fn ? fn(row) : row;
  });
}

// ---------- ADMIN WRITES ----------

// Cached probe: do the lat/lng map columns exist yet? Lets the app keep
// working (saving properties without coordinates) until the geo migration
// (seed/migration-geo-2026-06.sql) is run in Supabase.
let _geoColumnsKnown = null;
async function geoColumnsExist() {
  if (_geoColumnsKnown !== null) return _geoColumnsKnown;
  const { error } = await _supabase.from('properties').select('lat').limit(1);
  _geoColumnsKnown = !(error && error.code === '42703');
  return _geoColumnsKnown;
}

async function upsertProperty(categorie, camelData) {
  const row = { ...toSnakeProperty(categorie, camelData), categorie, activ: true };
  if (!(await geoColumnsExist())) { delete row.lat; delete row.lng; }
  const { data, error } = await _supabase
    .from('properties')
    .upsert(row)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteProperty(id) {
  const { error } = await _supabase
    .from('properties').update({ activ: false }).eq('id', id);
  if (error) throw error;
}

async function hardDeleteProperty(id) {
  const { error } = await _supabase
    .from('properties').delete().eq('id', id);
  if (error) throw error;
}

// Sets which property the QR banner points to. Only one can be active:
// clear the current flag first, then mark the chosen property.
// Pass id = null / '' to simply clear the banner (page shows empty state).
async function setBannerProperty(id) {
  const { error: clearErr } = await _supabase
    .from('properties').update({ banner: false }).eq('banner', true);
  if (clearErr) throw clearErr;
  if (id) {
    const { error } = await _supabase
      .from('properties').update({ banner: true }).eq('id', id);
    if (error) throw error;
  }
}

async function upsertProject(data) {
  const { error } = await _supabase.from('projects').upsert(data);
  if (error) throw error;
}

async function deleteProject(id) {
  const { error } = await _supabase
    .from('projects').update({ activ: false }).eq('id', id);
  if (error) throw error;
}

async function upsertAgent(data) {
  const { error } = await _supabase.from('agents').upsert(data);
  if (error) throw error;
}

async function deleteAgent(id) {
  const { error } = await _supabase.from('agents').delete().eq('id', id);
  if (error) throw error;
}

// ---------- ADMIN: LEADS ----------

async function getAllLeads(filter = {}) {
  let q = _supabase.from('leads')
    .select('*, properties(titlu, categorie), projects(nume), agents(nume, email)')
    .order('created_at', { ascending: false });
  if (filter.status) q = q.eq('status', filter.status);
  if (filter.tip) q = q.eq('tip', filter.tip);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function updateLeadStatus(id, status, note = null) {
  const patch = { status };
  if (note != null) patch.note = note;
  const { error } = await _supabase.from('leads').update(patch).eq('id', id);
  if (error) throw error;
}

async function deleteLead(id) {
  const { error } = await _supabase.from('leads').delete().eq('id', id);
  if (error) throw error;
}

async function getProjectByIdAdmin(id) {
  const { data, error } = await _supabase
    .from('projects').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

async function getAllProjectsAdmin() {
  const { data, error } = await _supabase
    .from('projects').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ---------- STORAGE: property images ----------

const PROPERTY_IMAGES_BUCKET = 'property-images';

function resizeImage(file, maxW, quality) {
  return new Promise((resolve, reject) => {
    createImageBitmap(file).then(bmp => {
      const scale = Math.min(1, maxW / bmp.width);
      const w = Math.round(bmp.width * scale);
      const h = Math.round(bmp.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
      bmp.close();
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/jpeg', quality);
    }).catch(reject);
  });
}

async function uploadPropertyImages(propertyId, files) {
  const urls = [];
  for (const file of files) {
    const baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const fullPath = `${propertyId}/${baseName}`;
    const cardPath = `${propertyId}/card-${baseName}`;

    const [fullBlob, cardBlob] = await Promise.all([
      resizeImage(file, 1920, 0.82),
      resizeImage(file, 800, 0.82),
    ]);

    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      _supabase.storage.from(PROPERTY_IMAGES_BUCKET).upload(fullPath, fullBlob, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' }),
      _supabase.storage.from(PROPERTY_IMAGES_BUCKET).upload(cardPath, cardBlob, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' }),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;

    const { data } = _supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(fullPath);
    urls.push(data.publicUrl);
  }
  return urls;
}

async function deletePropertyImage(url) {
  const marker = `/${PROPERTY_IMAGES_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  const { error } = await _supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove([path]);
  if (error) throw error;
}

// ── RAPOARTE CMA ──────────────────────────────────────────────

function normalizeCmaRaport(r) {
  if (!r) return null;
  return {
    id: r.id,
    token: r.token,
    titlu: r.titlu,
    branded: r.branded !== false,
    subiect: r.subiect || {},
    comps: r.comps || [],
    banda: r.banda || {},
    voce: r.voce || '',
    activ: r.activ !== false,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  };
}

function generateCmaToken() {
  const arr = new Uint8Array(10);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getCmaRapoarte() {
  const { data, error } = await _supabase
    .from('rapoarte_cma')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeCmaRaport);
}

async function getRaportByToken(token) {
  const { data, error } = await _supabase
    .from('rapoarte_cma')
    .select('*')
    .eq('token', token)
    .single();
  if (error) return null;
  return normalizeCmaRaport(data);
}

async function upsertCmaRaport(r) {
  const row = {
    token: r.token || generateCmaToken(),
    titlu: r.titlu,
    branded: r.branded !== false,
    subiect: r.subiect || {},
    comps: r.comps || [],
    banda: r.banda || {},
    voce: r.voce || null,
    activ: r.activ !== false,
    expires_at: r.expiresAt || null,
  };
  if (r.id) row.id = r.id;
  const { data, error } = await _supabase
    .from('rapoarte_cma')
    .upsert(row)
    .select()
    .single();
  if (error) throw error;
  return normalizeCmaRaport(data);
}

async function deactivateCmaRaport(id) {
  const { error } = await _supabase
    .from('rapoarte_cma')
    .update({ activ: false })
    .eq('id', id);
  if (error) throw error;
}

// camelCase → snake_case for property upsert
function toSnakeProperty(categorie, d) {
  const base = {
    id: d.id, titlu: d.titlu, regim: d.regim, oras: d.oras,
    cartier: d.cartier, adresa: d.adresa, descriere: d.descriere,
    imagini: d.imagini, facilitati: d.facilitati,
    lat: d.lat, lng: d.lng,
    agent_id: d.agentId, activ: d.activ !== false
  };
  if (categorie === 'rezidential') return {
    ...base, tip: d.tip, pret: d.pret, camere: d.camere, suprafata: d.suprafata,
    etaj: d.etaj, etaj_total: d.etajTotal, an_constructie: d.anConstructie,
    orientare: d.orientare, parcare: d.parcare, balcon: d.balcon
  };
  if (categorie === 'comercial') return {
    ...base, tip_spatiu: d.tipSpatiu, pret: d.pret, pret_total: d.pretTotal,
    suprafata_totala: d.suprafataTotala, suprafata_utila: d.suprafataUtila,
    etaj: d.etaj, locuri_parcare: d.locuriParcare,
    inaltime_libera: d.inaltimeLibera, clasa_cladire: d.clasaCladire,
    specificatii: d.specificatii
  };
  if (categorie === 'terenuri') return {
    ...base, tip: d.tip, suprafata: d.suprafata, unitate: d.unitate,
    pret_total: d.pretTotal, pret_mp: d.pretMp, front_stradal: d.frontStradal,
    utilitati: d.utilitati, acces_drum: d.accesDrum, zonare_pug: d.zonarePUG,
    cut: d.CUT, pot: d.POT, judet: d.judet, localitate: d.localitate,
    vecinatati: d.vecinatati
  };
  return base;
}
