// One-off seed: "Signature by IMA Residence" project + 32 units + renders.
// Source data: ../proiect IMA/ (analysis docx + Excel apartment list + randari/).
// Run: node scripts/seed-signature-ima.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const ROOT = path.join(__dirname, '..');
const IMA = path.join(ROOT, 'proiect IMA');

// --- credentials (service key bypasses RLS for the insert) ---
const env = fs.readFileSync(path.join(ROOT, 'project', '.env.local'), 'utf8');
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1].trim();
const supabase = createClient(get('SUPABASE_URL'), get('SUPABASE_SERVICE_KEY'));

const PROJECT_ID = 'signature-by-ima';
const BUCKET = 'property-images';

async function uploadRenders() {
  const dir = path.join(IMA, 'randari');
  const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png)$/i.test(f)).sort();
  const urls = [];
  for (const f of files) {
    const ext = f.split('.').pop().toLowerCase();
    const dest = `${PROJECT_ID}/${f.replace(/\.[^.]+$/, '')}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(dest, fs.readFileSync(path.join(dir, f)), {
      contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
      cacheControl: '3600',
      upsert: true,
    });
    if (error) throw error;
    urls.push(supabase.storage.from(BUCKET).getPublicUrl(dest).data.publicUrl);
    console.log('  uploaded', dest);
  }
  return urls;
}

async function main() {
  console.log('Uploading renders…');
  const imagini = await uploadRenders();

  const units = JSON.parse(fs.readFileSync(path.join(IMA, '_units.json'), 'utf8'));

  const descriere =
    'Signature by IMA Residence este un ansamblu boutique de lux în nordul Bucureștiului, pe Strada Floarea Soarelui nr. 16, retras din agitația Bulevardului Erou Iancu Nicolae, în imediata vecinătate a celor mai prestigioase școli internaționale din România (British School of Bucharest, AISB, Mark Twain). Proiectat de biroul Pintilie + Partners într-un regim redus P+3, ansamblul numără în total 51 de apartamente, dintre care EVEN comercializează 32 de unități selectate, cu 2–5 camere. ' +
    'Construit integral la standardul nZEB (consum de energie aproape zero), proiectul integrează pompe de căldură, panouri fotovoltaice, ventilație cu recuperare de căldură și fațadă ventilată din fibrociment — pentru costuri de operare predictibile și un confort termic superior. Apartamentele de la parter au grădini private de 50–100 mp („vilă-apartament”), iar cele superioare terase ample. Finisaje premium din Italia și Spania, cu asistență de design interior personalizat. Investiție totală de aprox. 15 mil. €, dezvoltată de App Town / IMA Residence (Claudiu Diaconu).';

  const project = {
    id: PROJECT_ID,
    nume: 'Signature by IMA Residence',
    dezvoltator: 'App Town · IMA Residence',
    dezvoltator_proiecte: [
      'IMA Residence — Erou Iancu Nicolae 31',
      'App Town North — Pipera',
      'App Town Brâncoveanu',
    ],
    oras: 'Voluntari',
    cartier: 'Pipera / Iancu Nicolae',
    adresa: 'Strada Floarea Soarelui 16',
    status: 'construire',
    data_livrare: '2028-01-31',
    progres: 20,
    interval_pret_min: null, // preț la solicitare
    interval_pret_max: null,
    tipuri_unitati: ['2 camere', '3 camere', '4 camere', '5 camere'],
    unitati_disponibile: 32,
    unitati_total: 51,
    descriere,
    facilitati: [
      'Standard nZEB — consum de energie aproape zero',
      'Pompe de căldură de înaltă eficiență',
      'Panouri fotovoltaice pe acoperiș',
      'Ventilație mecanică cu recuperare de căldură',
      'Fațadă ventilată din fibrociment',
      'Piscină exterioară',
      'Parcare subterană + boxe de depozitare',
      'Grădini private la parter (50–100 mp)',
      'Terase ample la etajele superioare',
      'Asistență de design interior personalizat',
      'Finisaje premium din Italia și Spania',
      'Supraveghere video 24/7',
      'Spații comerciale la parter',
      'Zone verzi amenajate peisagistic',
    ],
    imagini,
    plan_plata: null, // indisponibil momentan
    timeline: [
      { etapa: 'Lansare proiect', data: 'Ian 2026', stare: 'finalizat' },
      { etapa: 'Autorizare & fundație', data: 'Apr 2026', stare: 'finalizat' },
      { etapa: 'Structură', data: '2026–2027', stare: 'in-curs' },
      { etapa: 'Finisaje', data: '2027', stare: 'urmează' },
      { etapa: 'Recepție & livrare', data: 'Înc. 2028', stare: 'urmează' },
    ],
    activ: true,
  };

  console.log('Upserting project…');
  let { error } = await supabase.from('projects').upsert(project);
  if (error) throw error;

  console.log('Replacing units…');
  await supabase.from('project_units').delete().eq('project_id', PROJECT_ID);
  const rows = units.map(u => ({
    project_id: PROJECT_ID,
    numar: u.numar,
    tip: u.tip,
    etaj: u.etaj,
    suprafata: u.suprafata,
    pret: null, // preț la solicitare
    status: u.status,
  }));
  ({ error } = await supabase.from('project_units').insert(rows));
  if (error) throw error;

  console.log(`\nDone. Project "${project.nume}" with ${rows.length} units and ${imagini.length} renders.`);
  console.log('URL: /project-detail.html?id=' + PROJECT_ID);
}

main().catch(e => { console.error(e); process.exit(1); });
