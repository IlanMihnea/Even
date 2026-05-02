// ============================================
// DB.JS — Supabase data access layer
// Replace the two constants below with your
// Supabase Project URL and anon public key.
// ============================================

const SUPABASE_URL = 'sb_publishable_h5ZFl8-pHpJHnQzOOKklSA_GJM6x9AC';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6bGJkZndzZWpxc2RjYWh3ZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NTA5MzQsImV4cCI6MjA5MzMyNjkzNH0.I0miwZ8B2tPgZrv0mAvgfHyFU9yVUhOWA27QMilKs4A';

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
    agentId: row.agent_id, agent: normalizeAgent(row.agents), categorie: 'rezidential'
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
    agentId: row.agent_id, agent: normalizeAgent(row.agents), categorie: 'comercial'
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
    agentId: row.agent_id, agent: normalizeAgent(row.agents), categorie: 'terenuri'
  };
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

async function upsertProperty(categorie, camelData) {
  const { data, error } = await _supabase
    .from('properties')
    .upsert({ ...toSnakeProperty(categorie, camelData), categorie, activ: true })
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

// camelCase → snake_case for property upsert
function toSnakeProperty(categorie, d) {
  const base = {
    id: d.id, titlu: d.titlu, regim: d.regim, oras: d.oras,
    cartier: d.cartier, adresa: d.adresa, descriere: d.descriere,
    imagini: d.imagini, facilitati: d.facilitati,
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
