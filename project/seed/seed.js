// ============================================
// SEED SCRIPT — run once: node seed/seed.js
// Requires: npm install @supabase/supabase-js
// Set SUPABASE_URL and SUPABASE_SERVICE_KEY below
// or in .env.local
// ============================================

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ---------- SOURCE DATA ----------

const agenti = [
  { id: 'ag-001', nume: 'Andreea Popescu', rol: 'Senior Agent Rezidențial', bio: 'Peste 8 ani de experiență în rezidențial premium București. Specializată pe zonele Herăstrău, Floreasca și Aviației.', email: 'andreea.popescu@even.ro', telefon: '+40 722 123 456', foto: 'images/team/agent1.jpg', proprietati_vandute: 132, ani: 8 },
  { id: 'ag-002', nume: 'Mihai Ionescu', rol: 'Director Comercial & Investment', bio: 'Expert în tranzacții B2B și proprietăți comerciale. Gestionează portofoliul de investitori pentru birouri clasa A.', email: 'mihai.ionescu@even.ro', telefon: '+40 733 456 789', foto: 'images/team/agent2.jpg', proprietati_vandute: 87, ani: 12 },
  { id: 'ag-003', nume: 'Elena Marin', rol: 'Specialist Terenuri & Dezvoltare', bio: 'Fost arhitect, înțelege în profunzime potențialul terenurilor. Expert PUG, PUZ, certificate de urbanism.', email: 'elena.marin@even.ro', telefon: '+40 744 789 012', foto: 'images/team/agent3.jpg', proprietati_vandute: 64, ani: 6 },
  { id: 'ag-004', nume: 'Alexandru Stan', rol: 'Agent Proiecte Noi', bio: 'Coordonează relația cu dezvoltatorii și ghidează cumpărătorii prin procesul de pre-vânzare și livrare.', email: 'alexandru.stan@even.ro', telefon: '+40 755 012 345', foto: 'images/team/agent4.jpg', proprietati_vandute: 98, ani: 5 }
];

const rezidential = [
  { id: 'rez-001', categorie: 'rezidential', titlu: 'Apartament 3 camere Herăstrău', regim: 'vanzare', tip: 'apartament', pret: 185000, camere: 3, suprafata: 82, etaj: 4, etaj_total: 8, an_constructie: 2019, orientare: 'Sud-Est', parcare: true, balcon: true, oras: 'București', cartier: 'Herăstrău', adresa: 'Str. Aviatorilor nr. 45', descriere: 'Apartament modern, complet mobilat și utilat, cu vedere spre parc. Finisaje premium, aer condiționat, centrală proprie.', imagini: ['images/rezidential/rez1-1.jpg','images/rezidential/rez1-2.jpg','images/rezidential/rez1-3.jpg'], facilitati: ['Aer condiționat','Centrală proprie','Lift','Interfon','Pază'], agent_id: 'ag-001', activ: true },
  { id: 'rez-002', categorie: 'rezidential', titlu: 'Vilă 5 camere Pipera', regim: 'vanzare', tip: 'vila', pret: 480000, camere: 5, suprafata: 220, etaj: null, etaj_total: null, an_constructie: 2021, orientare: 'Sud', parcare: true, balcon: true, oras: 'București', cartier: 'Pipera', adresa: 'Str. Erou Iancu Nicolae nr. 112', descriere: 'Vilă individuală pe 500 mp teren, curte generoasă, grădină amenajată, garaj 2 locuri. Zonă rezidențială selectă.', imagini: ['images/rezidential/rez2-1.jpg','images/rezidential/rez2-2.jpg','images/rezidential/rez2-3.jpg'], facilitati: ['Garaj dublu','Grădină','Piscină','Sistem alarmă','Smart home'], agent_id: 'ag-002', activ: true },
  { id: 'rez-003', categorie: 'rezidential', titlu: 'Apartament 2 camere Floreasca', regim: 'inchiriere', tip: 'apartament', pret: 850, camere: 2, suprafata: 58, etaj: 3, etaj_total: 6, an_constructie: 2017, orientare: 'Est', parcare: true, balcon: true, oras: 'București', cartier: 'Floreasca', adresa: 'Calea Floreasca nr. 178', descriere: 'Apartament lux, complet mobilat, disponibil imediat. Contract minim 12 luni. Garanție 2 luni.', imagini: ['images/rezidential/rez3-1.jpg','images/rezidential/rez3-2.jpg'], facilitati: ['Mobilat complet','Electrocasnice noi','Wi-Fi','Aer condiționat'], agent_id: 'ag-001', activ: true },
  { id: 'rez-004', categorie: 'rezidential', titlu: 'Casă 4 camere Cluj-Napoca Bună Ziua', regim: 'vanzare', tip: 'casa', pret: 295000, camere: 4, suprafata: 160, etaj: null, etaj_total: null, an_constructie: 2015, orientare: 'Sud-Vest', parcare: true, balcon: false, oras: 'Cluj-Napoca', cartier: 'Bună Ziua', adresa: 'Str. Ciocârliei nr. 23', descriere: 'Casă individuală P+1, construcție solidă, izolație termică excelentă. Curte 350 mp.', imagini: ['images/rezidential/rez4-1.jpg','images/rezidential/rez4-2.jpg'], facilitati: ['Garaj','Curte amenajată','Foișor','Panouri solare'], agent_id: 'ag-003', activ: true },
  { id: 'rez-005', categorie: 'rezidential', titlu: 'Duplex 4 camere Băneasa', regim: 'vanzare', tip: 'duplex', pret: 320000, camere: 4, suprafata: 145, etaj: 5, etaj_total: 6, an_constructie: 2020, orientare: 'Sud-Est', parcare: true, balcon: true, oras: 'București', cartier: 'Băneasa', adresa: 'Șos. București-Ploiești nr. 89', descriere: 'Duplex spectaculos cu terasă panoramică de 40 mp. Finisaje italiene, tavane înalte.', imagini: ['images/rezidential/rez5-1.jpg','images/rezidential/rez5-2.jpg'], facilitati: ['Terasă 40mp','2 locuri parcare subterană','Boxă','Concierge'], agent_id: 'ag-002', activ: true },
  { id: 'rez-006', categorie: 'rezidential', titlu: 'Apartament 3 camere Timișoara Central', regim: 'inchiriere', tip: 'apartament', pret: 650, camere: 3, suprafata: 75, etaj: 2, etaj_total: 4, an_constructie: 2010, orientare: 'Vest', parcare: false, balcon: true, oras: 'Timișoara', cartier: 'Central', adresa: 'Piața Victoriei nr. 7', descriere: 'În inima orașului, aproape de toate facilitățile. Renovat recent, mobilat modern.', imagini: ['images/rezidential/rez6-1.jpg'], facilitati: ['Mobilat','Centrală proprie','Balcon închis'], agent_id: 'ag-004', activ: true },
  { id: 'rez-007', categorie: 'rezidential', titlu: 'Apartament 4 camere Aviației', regim: 'vanzare', tip: 'apartament', pret: 245000, camere: 4, suprafata: 105, etaj: 7, etaj_total: 10, an_constructie: 2018, orientare: 'Sud', parcare: true, balcon: true, oras: 'București', cartier: 'Aviației', adresa: 'Bd. Aerogării nr. 34', descriere: 'Apartament spațios, 2 băi, dressing, bucătărie mobilată. Complex cu pază 24/7.', imagini: ['images/rezidential/rez7-1.jpg','images/rezidential/rez7-2.jpg'], facilitati: ['2 băi','Dressing','Centrală proprie','Pază 24/7'], agent_id: 'ag-001', activ: true },
  { id: 'rez-008', categorie: 'rezidential', titlu: 'Casă 3 camere Brașov Răcădău', regim: 'vanzare', tip: 'casa', pret: 178000, camere: 3, suprafata: 120, etaj: null, etaj_total: null, an_constructie: 2012, orientare: 'Sud-Est', parcare: true, balcon: false, oras: 'Brașov', cartier: 'Răcădău', adresa: 'Str. Zorilor nr. 15', descriere: 'Casă cu vedere spre munți, izolație termică, teren 400 mp. Zonă liniștită.', imagini: ['images/rezidential/rez8-1.jpg'], facilitati: ['Teren 400mp','Garaj','Foișor','Grădină'], agent_id: 'ag-003', activ: true },
  { id: 'rez-009', categorie: 'rezidential', titlu: 'Apartament 2 camere Tineretului', regim: 'inchiriere', tip: 'apartament', pret: 550, camere: 2, suprafata: 52, etaj: 5, etaj_total: 8, an_constructie: 1985, orientare: 'Est', parcare: false, balcon: true, oras: 'București', cartier: 'Tineretului', adresa: 'Str. Cuza Vodă nr. 67', descriere: 'Apartament renovat recent, aproape de parc și metrou. Disponibil de la 1 mai.', imagini: ['images/rezidential/rez9-1.jpg'], facilitati: ['Renovat 2024','Mobilat','Aproape de metrou'], agent_id: 'ag-004', activ: true },
  { id: 'rez-010', categorie: 'rezidential', titlu: 'Vilă 6 camere Constanța Mamaia', regim: 'vanzare', tip: 'vila', pret: 595000, camere: 6, suprafata: 280, etaj: null, etaj_total: null, an_constructie: 2022, orientare: 'Est', parcare: true, balcon: true, oras: 'Constanța', cartier: 'Mamaia Sat', adresa: 'Str. Mării nr. 8', descriere: 'Vilă premium la 300m de plajă. Piscină, terasă panoramică, garaj dublu.', imagini: ['images/rezidential/rez10-1.jpg','images/rezidential/rez10-2.jpg'], facilitati: ['Piscină','Terasă','Garaj dublu','Aproape de plajă','Smart home'], agent_id: 'ag-002', activ: true }
];

const comercial = [
  { id: 'com-001', categorie: 'comercial', titlu: 'Spațiu birouri clasa A Pipera', regim: 'inchiriere', tip_spatiu: 'birouri', pret: 14, pret_total: null, suprafata_totala: 450, suprafata_utila: 420, etaj: 5, locuri_parcare: 12, inaltime_libera: 3.2, clasa_cladire: 'A', oras: 'București', cartier: 'Pipera', adresa: 'Bd. Pipera nr. 1-3', descriere: 'Open space modern în clădire premium, HVAC, acces securizat, recepție 24/7.', imagini: ['images/comercial/com1-1.jpg','images/comercial/com1-2.jpg'], specificatii: { electric: 'Trifazic 63A', rampa: false, incarcator: false, climatizare: 'HVAC central', pardoseala: 'Tehnică ridicată', iluminat: 'LED dimmer' }, agent_id: 'ag-002', activ: true },
  { id: 'com-002', categorie: 'comercial', titlu: 'Spațiu retail parter Calea Victoriei', regim: 'inchiriere', tip_spatiu: 'retail', pret: 35, pret_total: null, suprafata_totala: 180, suprafata_utila: 165, etaj: 0, locuri_parcare: 2, inaltime_libera: 3.5, clasa_cladire: 'A', oras: 'București', cartier: 'Centrul Istoric', adresa: 'Calea Victoriei nr. 45', descriere: 'Spațiu comercial la stradă, vitrină generoasă, trafic pietonal intens.', imagini: ['images/comercial/com2-1.jpg'], specificatii: { electric: 'Trifazic 32A', rampa: false, incarcator: false, climatizare: 'Multi-split', pardoseala: 'Gresie tehnică', iluminat: 'LED + Spot' }, agent_id: 'ag-001', activ: true },
  { id: 'com-003', categorie: 'comercial', titlu: 'Depozit logistic Chitila', regim: 'inchiriere', tip_spatiu: 'depozit', pret: 4.5, pret_total: null, suprafata_totala: 2400, suprafata_utila: 2300, etaj: 0, locuri_parcare: 25, inaltime_libera: 11, clasa_cladire: 'A', oras: 'Ilfov', cartier: 'Chitila', adresa: 'DN1 km 12', descriere: 'Depozit A-class, 4 rampe hidraulice, acces TIR, sistem sprinkler, incarcatoare electrice.', imagini: ['images/comercial/com3-1.jpg','images/comercial/com3-2.jpg'], specificatii: { electric: 'Trifazic 400A', rampa: true, incarcator: true, climatizare: 'Ventilație industrială', pardoseala: 'Beton elicopterizat', iluminat: 'LED industrial' }, agent_id: 'ag-003', activ: true },
  { id: 'com-004', categorie: 'comercial', titlu: 'Showroom Otopeni DN1', regim: 'vanzare', tip_spatiu: 'showroom', pret: null, pret_total: 1250000, suprafata_totala: 800, suprafata_utila: 750, etaj: 0, locuri_parcare: 35, inaltime_libera: 5.5, clasa_cladire: 'B', oras: 'Ilfov', cartier: 'Otopeni', adresa: 'DN1 km 16.5', descriere: 'Showroom cu vitrină panoramică, vizibilitate excelentă din DN1, parcare generoasă.', imagini: ['images/comercial/com4-1.jpg'], specificatii: { electric: 'Trifazic 125A', rampa: false, incarcator: false, climatizare: 'VRV', pardoseala: 'Gresie porțelanată', iluminat: 'LED spot dimmable' }, agent_id: 'ag-002', activ: true },
  { id: 'com-005', categorie: 'comercial', titlu: 'Hală industrială Cluj Est', regim: 'vanzare', tip_spatiu: 'industrial', pret: null, pret_total: 890000, suprafata_totala: 1800, suprafata_utila: 1750, etaj: 0, locuri_parcare: 15, inaltime_libera: 9, clasa_cladire: 'B', oras: 'Cluj-Napoca', cartier: 'Zona Industrială Est', adresa: 'Str. Traian Vuia nr. 200', descriere: 'Hală producție cu birouri integrate, 2 rampe, acces auto. Teren 3000 mp.', imagini: ['images/comercial/com5-1.jpg'], specificatii: { electric: 'Trifazic 250A', rampa: true, incarcator: false, climatizare: 'Ventilație', pardoseala: 'Beton industrial', iluminat: 'LED industrial' }, agent_id: 'ag-004', activ: true },
  { id: 'com-006', categorie: 'comercial', titlu: 'Birouri clasa B Victoriei', regim: 'inchiriere', tip_spatiu: 'birouri', pret: 11, pret_total: null, suprafata_totala: 220, suprafata_utila: 200, etaj: 3, locuri_parcare: 4, inaltime_libera: 2.8, clasa_cladire: 'B', oras: 'București', cartier: 'Piața Victoriei', adresa: 'Bd. Lascăr Catargiu nr. 12', descriere: 'Birouri compartimentate, acces imediat metrou, clădire de epocă renovată.', imagini: ['images/comercial/com6-1.jpg'], specificatii: { electric: 'Trifazic 40A', rampa: false, incarcator: false, climatizare: 'Split pe birou', pardoseala: 'Parchet', iluminat: 'LED' }, agent_id: 'ag-001', activ: true }
];

const terenuri = [
  { id: 'ter-001', categorie: 'terenuri', titlu: 'Teren intravilan Corbeanca', tip: 'intravilan-rezidential', suprafata: 650, unitate: 'mp', pret_total: 95000, pret_mp: 146, front_stradal: 18, utilitati: ['apa','curent','gaz','canalizare'], acces_drum: 'asfaltat', zonare_pug: 'L1a - Locuințe individuale', cut: 0.9, pot: 35, judet: 'Ilfov', localitate: 'Corbeanca', adresa: 'Str. Lacului FN', descriere: 'Teren drept, cu toate utilitățile la poartă. CF disponibil, PUZ aprobat.', imagini: ['images/terenuri/ter1-1.jpg'], vecinatati: 'Zonă rezidențială cu case noi, liniștită, la 25 min de București', agent_id: 'ag-003', activ: true },
  { id: 'ter-002', categorie: 'terenuri', titlu: 'Teren agricol Giurgiu', tip: 'extravilan-agricol', suprafata: 12, unitate: 'ha', pret_total: 84000, pret_mp: 0.7, front_stradal: 85, utilitati: [], acces_drum: 'pietruit', zonare_pug: 'Extravilan agricol', cut: null, pot: null, judet: 'Giurgiu', localitate: 'Malu Spart', adresa: 'Tarla 54, Parcela 12', descriere: 'Teren arabil categoria I, pretabil culturi mari. Sol cernoziom.', imagini: ['images/terenuri/ter2-1.jpg'], vecinatati: 'Loturi agricole, acces drum de câmp pietruit', agent_id: 'ag-004', activ: true },
  { id: 'ter-003', categorie: 'terenuri', titlu: 'Teren intravilan comercial DN1', tip: 'intravilan-comercial', suprafata: 2200, unitate: 'mp', pret_total: 440000, pret_mp: 200, front_stradal: 42, utilitati: ['apa','curent','gaz'], acces_drum: 'asfaltat', zonare_pug: 'M3 - Mixt', cut: 2.2, pot: 60, judet: 'Ilfov', localitate: 'Otopeni', adresa: 'DN1 km 14', descriere: 'Poziție excelentă la DN1, vizibilitate maximă. Ideal showroom / benzinărie / hotel.', imagini: ['images/terenuri/ter3-1.jpg'], vecinatati: 'Showroom-uri auto, hoteluri, zonă comercială dezvoltată', agent_id: 'ag-002', activ: true },
  { id: 'ter-004', categorie: 'terenuri', titlu: 'Teren industrial Ploiești Vest', tip: 'industrial', suprafata: 8500, unitate: 'mp', pret_total: 510000, pret_mp: 60, front_stradal: 70, utilitati: ['apa','curent','gaz','canalizare'], acces_drum: 'asfaltat', zonare_pug: 'I - Industrial', cut: 1.5, pot: 55, judet: 'Prahova', localitate: 'Ploiești', adresa: 'Zona Industrială Vest, Str. Industriei FN', descriere: 'Teren plat, utilități trifazice puternice, acces TIR. Certificat urbanism pentru hală.', imagini: ['images/terenuri/ter4-1.jpg'], vecinatati: 'Parcuri industriale, depozite logistice', agent_id: 'ag-003', activ: true },
  { id: 'ter-005', categorie: 'terenuri', titlu: 'Teren intravilan Brașov Stupini', tip: 'intravilan-rezidential', suprafata: 800, unitate: 'mp', pret_total: 72000, pret_mp: 90, front_stradal: 20, utilitati: ['curent','apa'], acces_drum: 'asfaltat', zonare_pug: 'L1b - Locuințe', cut: 0.8, pot: 30, judet: 'Brașov', localitate: 'Stupini', adresa: 'Str. Pinului FN', descriere: 'Lot pentru casă individuală, vedere munți, zonă nouă în dezvoltare.', imagini: ['images/terenuri/ter5-1.jpg'], vecinatati: 'Case noi, zonă rezidențială curată', agent_id: 'ag-004', activ: true }
];

const proiecte = [
  {
    id: 'proj-001', nume: 'One Herăstrău Towers', dezvoltator: 'Stellar Development', dezvoltator_proiecte: ['One Floreasca Lake','One Charles de Gaulle Plaza'], oras: 'București', cartier: 'Herăstrău', adresa: 'Șos. Nordului nr. 24', status: 'construire', data_livrare: '2026-09-30', progres: 65, interval_pret_min: 145000, interval_pret_max: 520000, tipuri_unitati: ['1 cameră','2 camere','3 camere','Penthouse'], unitati_disponibile: 18, unitati_total: 42, descriere: 'Ansamblu premium în zona Herăstrău — 2 turnuri, 12 etaje fiecare, concierge 24/7, spa, piscină, parcare subterană.', facilitati: ['Piscină','SPA','Fitness','Concierge 24/7','Parcare subterană','Rooftop lounge'], imagini: ['images/proiecte/proj1-1.jpg','images/proiecte/proj1-2.jpg','images/proiecte/proj1-3.jpg'],
    plan_plata: { avans: 15, rate: [{ etapa: 'La contract', procent: 15 },{ etapa: 'La finalizare structură', procent: 35 },{ etapa: 'La finalizare exterior', procent: 25 },{ etapa: 'La predare cheie', procent: 25 }] },
    timeline: [{ etapa: 'Autorizație', stare: 'finalizat', data: '2023-06' },{ etapa: 'Fundație', stare: 'finalizat', data: '2024-01' },{ etapa: 'Structură', stare: 'finalizat', data: '2025-03' },{ etapa: 'Închideri și finisaje', stare: 'in-curs', data: '2025-11' },{ etapa: 'Amenajări exterioare', stare: 'planificat', data: '2026-06' },{ etapa: 'Predare cheie', stare: 'planificat', data: '2026-09' }],
    unitati: [
      { numar: 'A-301', tip: '1 cameră', etaj: 3, suprafata: 48, pret: 145000, status: 'disponibil' },
      { numar: 'A-302', tip: '2 camere', etaj: 3, suprafata: 68, pret: 215000, status: 'rezervat' },
      { numar: 'A-401', tip: '2 camere', etaj: 4, suprafata: 72, pret: 228000, status: 'disponibil' },
      { numar: 'A-502', tip: '3 camere', etaj: 5, suprafata: 92, pret: 298000, status: 'disponibil' },
      { numar: 'A-601', tip: '3 camere', etaj: 6, suprafata: 95, pret: 312000, status: 'disponibil' },
      { numar: 'A-701', tip: '2 camere', etaj: 7, suprafata: 72, pret: 245000, status: 'vandut' },
      { numar: 'A-801', tip: '3 camere', etaj: 8, suprafata: 95, pret: 328000, status: 'disponibil' },
      { numar: 'A-901', tip: 'Penthouse', etaj: 9, suprafata: 155, pret: 520000, status: 'disponibil' },
      { numar: 'B-302', tip: '1 cameră', etaj: 3, suprafata: 50, pret: 152000, status: 'disponibil' },
      { numar: 'B-402', tip: '2 camere', etaj: 4, suprafata: 70, pret: 232000, status: 'disponibil' }
    ],
    activ: true
  },
  {
    id: 'proj-002', nume: 'Liviada Cluj Residence', dezvoltator: 'Nord Invest Group', dezvoltator_proiecte: ['Parc Residence','Green Hills Cluj'], oras: 'Cluj-Napoca', cartier: 'Mărăști', adresa: 'Str. Dorobanților nr. 110', status: 'pre-vanzare', data_livrare: '2027-06-30', progres: 10, interval_pret_min: 98000, interval_pret_max: 285000, tipuri_unitati: ['1 cameră','2 camere','3 camere'], unitati_disponibile: 56, unitati_total: 80, descriere: 'Proiect rezidențial verde cu 4 blocuri boutique, playground, grădini comune. Preț de lansare.', facilitati: ['Playground','Grădini comune','Parcare subterană','Pistă biciclete'], imagini: ['images/proiecte/proj2-1.jpg','images/proiecte/proj2-2.jpg'],
    plan_plata: { avans: 10, rate: [{ etapa: 'La contract', procent: 10 },{ etapa: 'La autorizație construire', procent: 20 },{ etapa: 'La structură', procent: 30 },{ etapa: 'La finisaje', procent: 25 },{ etapa: 'La predare', procent: 15 }] },
    timeline: [{ etapa: 'Achiziție teren', stare: 'finalizat', data: '2024-08' },{ etapa: 'Proiectare', stare: 'finalizat', data: '2025-02' },{ etapa: 'Autorizație', stare: 'in-curs', data: '2026-05' },{ etapa: 'Fundație', stare: 'planificat', data: '2026-09' },{ etapa: 'Structură', stare: 'planificat', data: '2027-02' },{ etapa: 'Predare cheie', stare: 'planificat', data: '2027-06' }],
    unitati: [
      { numar: 'C1-201', tip: '1 cameră', etaj: 2, suprafata: 42, pret: 98000, status: 'disponibil' },
      { numar: 'C1-202', tip: '2 camere', etaj: 2, suprafata: 62, pret: 148000, status: 'disponibil' },
      { numar: 'C1-301', tip: '2 camere', etaj: 3, suprafata: 65, pret: 158000, status: 'disponibil' },
      { numar: 'C1-401', tip: '3 camere', etaj: 4, suprafata: 85, pret: 215000, status: 'disponibil' },
      { numar: 'C2-201', tip: '3 camere', etaj: 2, suprafata: 88, pret: 218000, status: 'rezervat' },
      { numar: 'C2-301', tip: '3 camere', etaj: 3, suprafata: 88, pret: 228000, status: 'disponibil' },
      { numar: 'C2-401', tip: '3 camere', etaj: 4, suprafata: 95, pret: 285000, status: 'disponibil' }
    ],
    activ: true
  },
  {
    id: 'proj-003', nume: 'Marea Neagră Boutique', dezvoltator: 'Litoral Estate', dezvoltator_proiecte: ['Constanța Bay Residence'], oras: 'Constanța', cartier: 'Mamaia', adresa: 'Bd. Mamaia nr. 320', status: 'finalizat', data_livrare: '2025-04-01', progres: 100, interval_pret_min: 135000, interval_pret_max: 410000, tipuri_unitati: ['Studio','2 camere','3 camere'], unitati_disponibile: 7, unitati_total: 28, descriere: 'Proiect boutique finalizat, 150m de plajă. Gata de mutat. Ideal investiție sau casă de vacanță.', facilitati: ['Piscină rooftop','Acces plajă privat','Parcare','Administrare proprietate'], imagini: ['images/proiecte/proj3-1.jpg','images/proiecte/proj3-2.jpg'],
    plan_plata: { avans: 30, rate: [{ etapa: 'La semnare', procent: 30 },{ etapa: 'La transcriere cadastrală', procent: 70 }] },
    timeline: [{ etapa: 'Autorizație', stare: 'finalizat', data: '2022-03' },{ etapa: 'Fundație', stare: 'finalizat', data: '2022-09' },{ etapa: 'Structură', stare: 'finalizat', data: '2023-08' },{ etapa: 'Finisaje', stare: 'finalizat', data: '2024-10' },{ etapa: 'Predare cheie', stare: 'finalizat', data: '2025-04' }],
    unitati: [
      { numar: '201', tip: 'Studio', etaj: 2, suprafata: 32, pret: 135000, status: 'disponibil' },
      { numar: '305', tip: '2 camere', etaj: 3, suprafata: 58, pret: 198000, status: 'disponibil' },
      { numar: '402', tip: '2 camere', etaj: 4, suprafata: 62, pret: 215000, status: 'disponibil' },
      { numar: '501', tip: '3 camere', etaj: 5, suprafata: 88, pret: 325000, status: 'disponibil' },
      { numar: '502', tip: '3 camere', etaj: 5, suprafata: 90, pret: 338000, status: 'vandut' },
      { numar: '601', tip: '3 camere', etaj: 6, suprafata: 92, pret: 355000, status: 'disponibil' },
      { numar: '602', tip: '3 camere vedere mare', etaj: 6, suprafata: 98, pret: 410000, status: 'disponibil' }
    ],
    activ: true
  }
];

// ---------- SEED ----------

async function seed() {
  console.log('Seeding agents...');
  const { error: e1 } = await supabase.from('agents').upsert(agenti);
  if (e1) { console.error('agents error:', e1); process.exit(1); }

  console.log('Seeding properties (rezidential)...');
  const { error: e2 } = await supabase.from('properties').upsert(rezidential);
  if (e2) { console.error('rezidential error:', e2); process.exit(1); }

  console.log('Seeding properties (comercial)...');
  const { error: e3 } = await supabase.from('properties').upsert(comercial);
  if (e3) { console.error('comercial error:', e3); process.exit(1); }

  console.log('Seeding properties (terenuri)...');
  const { error: e4 } = await supabase.from('properties').upsert(terenuri);
  if (e4) { console.error('terenuri error:', e4); process.exit(1); }

  for (const p of proiecte) {
    const { unitati, ...projData } = p;
    console.log(`Seeding project ${p.id}...`);
    const { error: e5 } = await supabase.from('projects').upsert(projData);
    if (e5) { console.error(`project ${p.id} error:`, e5); process.exit(1); }

    const units = unitati.map(u => ({ ...u, project_id: p.id }));
    const { error: e6 } = await supabase.from('project_units').upsert(units, { onConflict: 'project_id,numar' });
    if (e6) { console.error(`units for ${p.id} error:`, e6); process.exit(1); }
  }

  console.log('✓ Seed complete!');
}

seed().catch(err => { console.error(err); process.exit(1); });
