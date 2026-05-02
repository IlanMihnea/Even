// ============================================
// DATE SIMULATE - AGENȚIE IMOBILIARĂ
// ============================================

const rezidential = [
  {
    id: "rez-001",
    titlu: "Apartament 3 camere Herăstrău",
    regim: "vanzare",
    tip: "apartament",
    pret: 185000,
    camere: 3,
    suprafata: 82,
    etaj: 4,
    etajTotal: 8,
    anConstructie: 2019,
    orientare: "Sud-Est",
    parcare: true,
    balcon: true,
    oras: "București",
    cartier: "Herăstrău",
    adresa: "Str. Aviatorilor nr. 45",
    descriere: "Apartament modern, complet mobilat și utilat, cu vedere spre parc. Finisaje premium, aer condiționat, centrală proprie. Ideal pentru o familie tânără.",
    imagini: [
      "images/rezidential/rez1-1.jpg",
      "images/rezidential/rez1-2.jpg",
      "images/rezidential/rez1-3.jpg"
    ],
    facilitati: ["Aer condiționat", "Centrală proprie", "Lift", "Interfon", "Pază"],
    agentId: "ag-001"
  },
  {
    id: "rez-002",
    titlu: "Vilă 5 camere Pipera",
    regim: "vanzare",
    tip: "vila",
    pret: 480000,
    camere: 5,
    suprafata: 220,
    etaj: null,
    etajTotal: null,
    anConstructie: 2021,
    orientare: "Sud",
    parcare: true,
    balcon: true,
    oras: "București",
    cartier: "Pipera",
    adresa: "Str. Erou Iancu Nicolae nr. 112",
    descriere: "Vilă individuală pe 500 mp teren, curte generoasă, grădină amenajată, garaj 2 locuri. Zonă rezidențială selectă.",
    imagini: [
      "images/rezidential/rez2-1.jpg",
      "images/rezidential/rez2-2.jpg",
      "images/rezidential/rez2-3.jpg"
    ],
    facilitati: ["Garaj dublu", "Grădină", "Piscină", "Sistem alarmă", "Smart home"],
    agentId: "ag-002"
  },
  {
    id: "rez-003",
    titlu: "Apartament 2 camere Floreasca",
    regim: "inchiriere",
    tip: "apartament",
    pret: 850,
    camere: 2,
    suprafata: 58,
    etaj: 3,
    etajTotal: 6,
    anConstructie: 2017,
    orientare: "Est",
    parcare: true,
    balcon: true,
    oras: "București",
    cartier: "Floreasca",
    adresa: "Calea Floreasca nr. 178",
    descriere: "Apartament lux, complet mobilat, disponibil imediat. Contract minim 12 luni. Garanție 2 luni.",
    imagini: [
      "images/rezidential/rez3-1.jpg",
      "images/rezidential/rez3-2.jpg"
    ],
    facilitati: ["Mobilat complet", "Electrocasnice noi", "Wi-Fi", "Aer condiționat"],
    agentId: "ag-001"
  },
  {
    id: "rez-004",
    titlu: "Casă 4 camere Cluj-Napoca Bună Ziua",
    regim: "vanzare",
    tip: "casa",
    pret: 295000,
    camere: 4,
    suprafata: 160,
    etaj: null,
    etajTotal: null,
    anConstructie: 2015,
    orientare: "Sud-Vest",
    parcare: true,
    balcon: false,
    oras: "Cluj-Napoca",
    cartier: "Bună Ziua",
    adresa: "Str. Ciocârliei nr. 23",
    descriere: "Casă individuală P+1, construcție solidă, izolație termică excelentă. Curte 350 mp.",
    imagini: [
      "images/rezidential/rez4-1.jpg",
      "images/rezidential/rez4-2.jpg"
    ],
    facilitati: ["Garaj", "Curte amenajată", "Foișor", "Panouri solare"],
    agentId: "ag-003"
  },
  {
    id: "rez-005",
    titlu: "Duplex 4 camere Băneasa",
    regim: "vanzare",
    tip: "duplex",
    pret: 320000,
    camere: 4,
    suprafata: 145,
    etaj: 5,
    etajTotal: 6,
    anConstructie: 2020,
    orientare: "Sud-Est",
    parcare: true,
    balcon: true,
    oras: "București",
    cartier: "Băneasa",
    adresa: "Șos. București-Ploiești nr. 89",
    descriere: "Duplex spectaculos cu terasă panoramică de 40 mp. Finisaje italiene, tavane înalte.",
    imagini: [
      "images/rezidential/rez5-1.jpg",
      "images/rezidential/rez5-2.jpg"
    ],
    facilitati: ["Terasă 40mp", "2 locuri parcare subterană", "Boxă", "Concierge"],
    agentId: "ag-002"
  },
  {
    id: "rez-006",
    titlu: "Apartament 3 camere Timișoara Central",
    regim: "inchiriere",
    tip: "apartament",
    pret: 650,
    camere: 3,
    suprafata: 75,
    etaj: 2,
    etajTotal: 4,
    anConstructie: 2010,
    orientare: "Vest",
    parcare: false,
    balcon: true,
    oras: "Timișoara",
    cartier: "Central",
    adresa: "Piața Victoriei nr. 7",
    descriere: "În inima orașului, aproape de toate facilitățile. Renovat recent, mobilat modern.",
    imagini: [
      "images/rezidential/rez6-1.jpg"
    ],
    facilitati: ["Mobilat", "Centrală proprie", "Balcon închis"],
    agentId: "ag-004"
  },
  {
    id: "rez-007",
    titlu: "Apartament 4 camere Aviației",
    regim: "vanzare",
    tip: "apartament",
    pret: 245000,
    camere: 4,
    suprafata: 105,
    etaj: 7,
    etajTotal: 10,
    anConstructie: 2018,
    orientare: "Sud",
    parcare: true,
    balcon: true,
    oras: "București",
    cartier: "Aviației",
    adresa: "Bd. Aerogării nr. 34",
    descriere: "Apartament spațios, 2 băi, dressing, bucătărie mobilată. Complex cu pază 24/7.",
    imagini: [
      "images/rezidential/rez7-1.jpg",
      "images/rezidential/rez7-2.jpg"
    ],
    facilitati: ["2 băi", "Dressing", "Centrală proprie", "Pază 24/7"],
    agentId: "ag-001"
  },
  {
    id: "rez-008",
    titlu: "Casă 3 camere Brașov Răcădău",
    regim: "vanzare",
    tip: "casa",
    pret: 178000,
    camere: 3,
    suprafata: 120,
    etaj: null,
    etajTotal: null,
    anConstructie: 2012,
    orientare: "Sud-Est",
    parcare: true,
    balcon: false,
    oras: "Brașov",
    cartier: "Răcădău",
    adresa: "Str. Zorilor nr. 15",
    descriere: "Casă cu vedere spre munți, izolație termică, teren 400 mp. Zonă liniștită.",
    imagini: [
      "images/rezidential/rez8-1.jpg"
    ],
    facilitati: ["Teren 400mp", "Garaj", "Foișor", "Grădină"],
    agentId: "ag-003"
  },
  {
    id: "rez-009",
    titlu: "Apartament 2 camere Tineretului",
    regim: "inchiriere",
    tip: "apartament",
    pret: 550,
    camere: 2,
    suprafata: 52,
    etaj: 5,
    etajTotal: 8,
    anConstructie: 1985,
    orientare: "Est",
    parcare: false,
    balcon: true,
    oras: "București",
    cartier: "Tineretului",
    adresa: "Str. Cuza Vodă nr. 67",
    descriere: "Apartament renovat recent, aproape de parc și metrou. Disponibil de la 1 mai.",
    imagini: [
      "images/rezidential/rez9-1.jpg"
    ],
    facilitati: ["Renovat 2024", "Mobilat", "Aproape de metrou"],
    agentId: "ag-004"
  },
  {
    id: "rez-010",
    titlu: "Vilă 6 camere Constanța Mamaia",
    regim: "vanzare",
    tip: "vila",
    pret: 595000,
    camere: 6,
    suprafata: 280,
    etaj: null,
    etajTotal: null,
    anConstructie: 2022,
    orientare: "Est",
    parcare: true,
    balcon: true,
    oras: "Constanța",
    cartier: "Mamaia Sat",
    adresa: "Str. Mării nr. 8",
    descriere: "Vilă premium la 300m de plajă. Piscină, terasă panoramică, garaj dublu.",
    imagini: [
      "images/rezidential/rez10-1.jpg",
      "images/rezidential/rez10-2.jpg"
    ],
    facilitati: ["Piscină", "Terasă", "Garaj dublu", "Aproape de plajă", "Smart home"],
    agentId: "ag-002"
  }
];

const comercial = [
  {
    id: "com-001",
    titlu: "Spațiu birouri clasa A Pipera",
    regim: "inchiriere",
    tipSpatiu: "birouri",
    pret: 14, // EUR/mp/lună
    pretTotal: null,
    suprafataTotala: 450,
    suprafataUtila: 420,
    etaj: 5,
    locuriParcare: 12,
    inaltimeLibera: 3.2,
    clasaCladire: "A",
    oras: "București",
    cartier: "Pipera",
    adresa: "Bd. Pipera nr. 1-3",
    descriere: "Open space modern în clădire premium, HVAC, acces securizat, recepție 24/7.",
    imagini: [
      "images/comercial/com1-1.jpg",
      "images/comercial/com1-2.jpg"
    ],
    specificatii: {
      electric: "Trifazic 63A",
      rampa: false,
      incarcator: false,
      climatizare: "HVAC central",
      pardoseala: "Tehnică ridicată",
      iluminat: "LED dimmer"
    },
    agentId: "ag-002"
  },
  {
    id: "com-002",
    titlu: "Spațiu retail parter Calea Victoriei",
    regim: "inchiriere",
    tipSpatiu: "retail",
    pret: 35,
    pretTotal: null,
    suprafataTotala: 180,
    suprafataUtila: 165,
    etaj: 0,
    locuriParcare: 2,
    inaltimeLibera: 3.5,
    clasaCladire: "A",
    oras: "București",
    cartier: "Centrul Istoric",
    adresa: "Calea Victoriei nr. 45",
    descriere: "Spațiu comercial la stradă, vitrină generoasă, trafic pietonal intens.",
    imagini: [
      "images/comercial/com2-1.jpg"
    ],
    specificatii: {
      electric: "Trifazic 32A",
      rampa: false,
      incarcator: false,
      climatizare: "Multi-split",
      pardoseala: "Gresie tehnică",
      iluminat: "LED + Spot"
    },
    agentId: "ag-001"
  },
  {
    id: "com-003",
    titlu: "Depozit logistic Chitila",
    regim: "inchiriere",
    tipSpatiu: "depozit",
    pret: 4.5,
    pretTotal: null,
    suprafataTotala: 2400,
    suprafataUtila: 2300,
    etaj: 0,
    locuriParcare: 25,
    inaltimeLibera: 11,
    clasaCladire: "A",
    oras: "Ilfov",
    cartier: "Chitila",
    adresa: "DN1 km 12",
    descriere: "Depozit A-class, 4 rampe hidraulice, acces TIR, sistem sprinkler, incarcatoare electrice.",
    imagini: [
      "images/comercial/com3-1.jpg",
      "images/comercial/com3-2.jpg"
    ],
    specificatii: {
      electric: "Trifazic 400A",
      rampa: true,
      incarcator: true,
      climatizare: "Ventilație industrială",
      pardoseala: "Beton elicopterizat",
      iluminat: "LED industrial"
    },
    agentId: "ag-003"
  },
  {
    id: "com-004",
    titlu: "Showroom Otopeni DN1",
    regim: "vanzare",
    tipSpatiu: "showroom",
    pret: null,
    pretTotal: 1250000,
    suprafataTotala: 800,
    suprafataUtila: 750,
    etaj: 0,
    locuriParcare: 35,
    inaltimeLibera: 5.5,
    clasaCladire: "B",
    oras: "Ilfov",
    cartier: "Otopeni",
    adresa: "DN1 km 16.5",
    descriere: "Showroom cu vitrină panoramică, vizibilitate excelentă din DN1, parcare generoasă.",
    imagini: [
      "images/comercial/com4-1.jpg"
    ],
    specificatii: {
      electric: "Trifazic 125A",
      rampa: false,
      incarcator: false,
      climatizare: "VRV",
      pardoseala: "Gresie porțelanată",
      iluminat: "LED spot dimmable"
    },
    agentId: "ag-002"
  },
  {
    id: "com-005",
    titlu: "Hală industrială Cluj Est",
    regim: "vanzare",
    tipSpatiu: "industrial",
    pret: null,
    pretTotal: 890000,
    suprafataTotala: 1800,
    suprafataUtila: 1750,
    etaj: 0,
    locuriParcare: 15,
    inaltimeLibera: 9,
    clasaCladire: "B",
    oras: "Cluj-Napoca",
    cartier: "Zona Industrială Est",
    adresa: "Str. Traian Vuia nr. 200",
    descriere: "Hală producție cu birouri integrate, 2 rampe, acces auto. Teren 3000 mp.",
    imagini: [
      "images/comercial/com5-1.jpg"
    ],
    specificatii: {
      electric: "Trifazic 250A",
      rampa: true,
      incarcator: false,
      climatizare: "Ventilație",
      pardoseala: "Beton industrial",
      iluminat: "LED industrial"
    },
    agentId: "ag-004"
  },
  {
    id: "com-006",
    titlu: "Birouri clasa B Victoriei",
    regim: "inchiriere",
    tipSpatiu: "birouri",
    pret: 11,
    pretTotal: null,
    suprafataTotala: 220,
    suprafataUtila: 200,
    etaj: 3,
    locuriParcare: 4,
    inaltimeLibera: 2.8,
    clasaCladire: "B",
    oras: "București",
    cartier: "Piața Victoriei",
    adresa: "Bd. Lascăr Catargiu nr. 12",
    descriere: "Birouri compartimentate, acces imediat metrou, clădire de epocă renovată.",
    imagini: [
      "images/comercial/com6-1.jpg"
    ],
    specificatii: {
      electric: "Trifazic 40A",
      rampa: false,
      incarcator: false,
      climatizare: "Split pe birou",
      pardoseala: "Parchet",
      iluminat: "LED"
    },
    agentId: "ag-001"
  }
];

const terenuri = [
  {
    id: "ter-001",
    titlu: "Teren intravilan Corbeanca",
    tip: "intravilan-rezidential",
    suprafata: 650,
    unitate: "mp",
    pretTotal: 95000,
    pretMp: 146,
    frontStradal: 18,
    utilitati: ["apa", "curent", "gaz", "canalizare"],
    accesDrum: "asfaltat",
    zonarePUG: "L1a - Locuințe individuale",
    CUT: 0.9,
    POT: 35,
    judet: "Ilfov",
    localitate: "Corbeanca",
    adresa: "Str. Lacului FN",
    descriere: "Teren drept, cu toate utilitățile la poartă. CF disponibil, PUZ aprobat.",
    imagini: [
      "images/terenuri/ter1-1.jpg"
    ],
    vecinatati: "Zonă rezidențială cu case noi, liniștită, la 25 min de București",
    agentId: "ag-003"
  },
  {
    id: "ter-002",
    titlu: "Teren agricol Giurgiu",
    tip: "extravilan-agricol",
    suprafata: 12,
    unitate: "ha",
    pretTotal: 84000,
    pretMp: 0.7,
    frontStradal: 85,
    utilitati: [],
    accesDrum: "pietruit",
    zonarePUG: "Extravilan agricol",
    CUT: null,
    POT: null,
    judet: "Giurgiu",
    localitate: "Malu Spart",
    adresa: "Tarla 54, Parcela 12",
    descriere: "Teren arabil categoria I, pretabil culturi mari. Sol cernoziom.",
    imagini: [
      "images/terenuri/ter2-1.jpg"
    ],
    vecinatati: "Loturi agricole, acces drum de câmp pietruit",
    agentId: "ag-004"
  },
  {
    id: "ter-003",
    titlu: "Teren intravilan comercial DN1",
    tip: "intravilan-comercial",
    suprafata: 2200,
    unitate: "mp",
    pretTotal: 440000,
    pretMp: 200,
    frontStradal: 42,
    utilitati: ["apa", "curent", "gaz"],
    accesDrum: "asfaltat",
    zonarePUG: "M3 - Mixt",
    CUT: 2.2,
    POT: 60,
    judet: "Ilfov",
    localitate: "Otopeni",
    adresa: "DN1 km 14",
    descriere: "Poziție excelentă la DN1, vizibilitate maximă. Ideal showroom / benzinărie / hotel.",
    imagini: [
      "images/terenuri/ter3-1.jpg"
    ],
    vecinatati: "Showroom-uri auto, hoteluri, zonă comercială dezvoltată",
    agentId: "ag-002"
  },
  {
    id: "ter-004",
    titlu: "Teren industrial Ploiești Vest",
    tip: "industrial",
    suprafata: 8500,
    unitate: "mp",
    pretTotal: 510000,
    pretMp: 60,
    frontStradal: 70,
    utilitati: ["apa", "curent", "gaz", "canalizare"],
    accesDrum: "asfaltat",
    zonarePUG: "I - Industrial",
    CUT: 1.5,
    POT: 55,
    judet: "Prahova",
    localitate: "Ploiești",
    adresa: "Zona Industrială Vest, Str. Industriei FN",
    descriere: "Teren plat, utilități trifazice puternice, acces TIR. Certificat urbanism pentru hală.",
    imagini: [
      "images/terenuri/ter4-1.jpg"
    ],
    vecinatati: "Parcuri industriale, depozite logistice",
    agentId: "ag-003"
  },
  {
    id: "ter-005",
    titlu: "Teren intravilan Brașov Stupini",
    tip: "intravilan-rezidential",
    suprafata: 800,
    unitate: "mp",
    pretTotal: 72000,
    pretMp: 90,
    frontStradal: 20,
    utilitati: ["curent", "apa"],
    accesDrum: "asfaltat",
    zonarePUG: "L1b - Locuințe",
    CUT: 0.8,
    POT: 30,
    judet: "Brașov",
    localitate: "Stupini",
    adresa: "Str. Pinului FN",
    descriere: "Lot pentru casă individuală, vedere munți, zonă nouă în dezvoltare.",
    imagini: [
      "images/terenuri/ter5-1.jpg"
    ],
    vecinatati: "Case noi, zonă rezidențială curată",
    agentId: "ag-004"
  }
];

const proiecte = [
  {
    id: "proj-001",
    nume: "One Herăstrău Towers",
    dezvoltator: "Stellar Development",
    dezvoltatorLogo: "images/proiecte/dev1-logo.png",
    dezvoltatorProiecte: ["One Floreasca Lake", "One Charles de Gaulle Plaza"],
    oras: "București",
    cartier: "Herăstrău",
    adresa: "Șos. Nordului nr. 24",
    status: "construire", // pre-vanzare | construire | finalizat
    dataLivrare: "2026-09-30",
    progres: 65,
    intervalPret: { min: 145000, max: 520000 },
    tipuriUnitati: ["1 cameră", "2 camere", "3 camere", "Penthouse"],
    unitatiDisponibile: 18,
    unitatiTotal: 42,
    descriere: "Ansamblu premium în zona Herăstrău — 2 turnuri, 12 etaje fiecare, concierge 24/7, spa, piscină, parcare subterană.",
    facilitati: ["Piscină", "SPA", "Fitness", "Concierge 24/7", "Parcare subterană", "Rooftop lounge"],
    planPlata: {
      avans: 15,
      rate: [
        { etapa: "La contract", procent: 15 },
        { etapa: "La finalizare structură", procent: 35 },
        { etapa: "La finalizare exterior", procent: 25 },
        { etapa: "La predare cheie", procent: 25 }
      ]
    },
    timeline: [
      { etapa: "Autorizație", stare: "finalizat", data: "2023-06" },
      { etapa: "Fundație", stare: "finalizat", data: "2024-01" },
      { etapa: "Structură", stare: "finalizat", data: "2025-03" },
      { etapa: "Închideri și finisaje", stare: "in-curs", data: "2025-11" },
      { etapa: "Amenajări exterioare", stare: "planificat", data: "2026-06" },
      { etapa: "Predare cheie", stare: "planificat", data: "2026-09" }
    ],
    imagini: [
      "images/proiecte/proj1-1.jpg",
      "images/proiecte/proj1-2.jpg",
      "images/proiecte/proj1-3.jpg"
    ],
    unitati: [
      { numar: "A-301", tip: "1 cameră", etaj: 3, suprafata: 48, pret: 145000, status: "disponibil" },
      { numar: "A-302", tip: "2 camere", etaj: 3, suprafata: 68, pret: 215000, status: "rezervat" },
      { numar: "A-401", tip: "2 camere", etaj: 4, suprafata: 72, pret: 228000, status: "disponibil" },
      { numar: "A-502", tip: "3 camere", etaj: 5, suprafata: 92, pret: 298000, status: "disponibil" },
      { numar: "A-601", tip: "3 camere", etaj: 6, suprafata: 95, pret: 312000, status: "disponibil" },
      { numar: "A-701", tip: "2 camere", etaj: 7, suprafata: 72, pret: 245000, status: "vandut" },
      { numar: "A-801", tip: "3 camere", etaj: 8, suprafata: 95, pret: 328000, status: "disponibil" },
      { numar: "A-901", tip: "Penthouse", etaj: 9, suprafata: 155, pret: 520000, status: "disponibil" },
      { numar: "B-302", tip: "1 cameră", etaj: 3, suprafata: 50, pret: 152000, status: "disponibil" },
      { numar: "B-402", tip: "2 camere", etaj: 4, suprafata: 70, pret: 232000, status: "disponibil" }
    ]
  },
  {
    id: "proj-002",
    nume: "Liviada Cluj Residence",
    dezvoltator: "Nord Invest Group",
    dezvoltatorLogo: "images/proiecte/dev2-logo.png",
    dezvoltatorProiecte: ["Parc Residence", "Green Hills Cluj"],
    oras: "Cluj-Napoca",
    cartier: "Mărăști",
    adresa: "Str. Dorobanților nr. 110",
    status: "pre-vanzare",
    dataLivrare: "2027-06-30",
    progres: 10,
    intervalPret: { min: 98000, max: 285000 },
    tipuriUnitati: ["1 cameră", "2 camere", "3 camere"],
    unitatiDisponibile: 56,
    unitatiTotal: 80,
    descriere: "Proiect rezidențial verde cu 4 blocuri boutique, playground, grădini comune. Preț de lansare.",
    facilitati: ["Playground", "Grădini comune", "Parcare subterană", "Pistă biciclete"],
    planPlata: {
      avans: 10,
      rate: [
        { etapa: "La contract", procent: 10 },
        { etapa: "La autorizație construire", procent: 20 },
        { etapa: "La structură", procent: 30 },
        { etapa: "La finisaje", procent: 25 },
        { etapa: "La predare", procent: 15 }
      ]
    },
    timeline: [
      { etapa: "Achiziție teren", stare: "finalizat", data: "2024-08" },
      { etapa: "Proiectare", stare: "finalizat", data: "2025-02" },
      { etapa: "Autorizație", stare: "in-curs", data: "2026-05" },
      { etapa: "Fundație", stare: "planificat", data: "2026-09" },
      { etapa: "Structură", stare: "planificat", data: "2027-02" },
      { etapa: "Predare cheie", stare: "planificat", data: "2027-06" }
    ],
    imagini: [
      "images/proiecte/proj2-1.jpg",
      "images/proiecte/proj2-2.jpg"
    ],
    unitati: [
      { numar: "C1-201", tip: "1 cameră", etaj: 2, suprafata: 42, pret: 98000, status: "disponibil" },
      { numar: "C1-202", tip: "2 camere", etaj: 2, suprafata: 62, pret: 148000, status: "disponibil" },
      { numar: "C1-301", tip: "2 camere", etaj: 3, suprafata: 65, pret: 158000, status: "disponibil" },
      { numar: "C1-401", tip: "3 camere", etaj: 4, suprafata: 85, pret: 215000, status: "disponibil" },
      { numar: "C2-201", tip: "3 camere", etaj: 2, suprafata: 88, pret: 218000, status: "rezervat" },
      { numar: "C2-301", tip: "3 camere", etaj: 3, suprafata: 88, pret: 228000, status: "disponibil" },
      { numar: "C2-401", tip: "3 camere", etaj: 4, suprafata: 95, pret: 285000, status: "disponibil" }
    ]
  },
  {
    id: "proj-003",
    nume: "Marea Neagră Boutique",
    dezvoltator: "Litoral Estate",
    dezvoltatorLogo: "images/proiecte/dev3-logo.png",
    dezvoltatorProiecte: ["Constanța Bay Residence"],
    oras: "Constanța",
    cartier: "Mamaia",
    adresa: "Bd. Mamaia nr. 320",
    status: "finalizat",
    dataLivrare: "2025-04-01",
    progres: 100,
    intervalPret: { min: 135000, max: 410000 },
    tipuriUnitati: ["Studio", "2 camere", "3 camere"],
    unitatiDisponibile: 7,
    unitatiTotal: 28,
    descriere: "Proiect boutique finalizat, 150m de plajă. Gata de mutat. Ideal investiție sau casă de vacanță.",
    facilitati: ["Piscină rooftop", "Acces plajă privat", "Parcare", "Administrare proprietate"],
    planPlata: {
      avans: 30,
      rate: [
        { etapa: "La semnare", procent: 30 },
        { etapa: "La transcriere cadastrală", procent: 70 }
      ]
    },
    timeline: [
      { etapa: "Autorizație", stare: "finalizat", data: "2022-03" },
      { etapa: "Fundație", stare: "finalizat", data: "2022-09" },
      { etapa: "Structură", stare: "finalizat", data: "2023-08" },
      { etapa: "Finisaje", stare: "finalizat", data: "2024-10" },
      { etapa: "Predare cheie", stare: "finalizat", data: "2025-04" }
    ],
    imagini: [
      "images/proiecte/proj3-1.jpg",
      "images/proiecte/proj3-2.jpg"
    ],
    unitati: [
      { numar: "201", tip: "Studio", etaj: 2, suprafata: 32, pret: 135000, status: "disponibil" },
      { numar: "305", tip: "2 camere", etaj: 3, suprafata: 58, pret: 198000, status: "disponibil" },
      { numar: "402", tip: "2 camere", etaj: 4, suprafata: 62, pret: 215000, status: "disponibil" },
      { numar: "501", tip: "3 camere", etaj: 5, suprafata: 88, pret: 325000, status: "disponibil" },
      { numar: "502", tip: "3 camere", etaj: 5, suprafata: 90, pret: 338000, status: "vandut" },
      { numar: "601", tip: "3 camere", etaj: 6, suprafata: 92, pret: 355000, status: "disponibil" },
      { numar: "602", tip: "3 camere vedere mare", etaj: 6, suprafata: 98, pret: 410000, status: "disponibil" }
    ]
  }
];

const agenti = [
  {
    id: "ag-001",
    nume: "Andreea Popescu",
    rol: "Senior Agent Rezidențial",
    bio: "Peste 8 ani de experiență în rezidențial premium București. Specializată pe zonele Herăstrău, Floreasca și Aviației.",
    email: "andreea.popescu@agentia-imobiliara.ro",
    telefon: "+40 722 123 456",
    foto: "images/team/agent1.jpg",
    proprietatiVandute: 132,
    ani: 8
  },
  {
    id: "ag-002",
    nume: "Mihai Ionescu",
    rol: "Director Comercial & Investment",
    bio: "Expert în tranzacții B2B și proprietăți comerciale. Gestionează portofoliul de investitori pentru birouri clasa A.",
    email: "mihai.ionescu@agentia-imobiliara.ro",
    telefon: "+40 733 456 789",
    foto: "images/team/agent2.jpg",
    proprietatiVandute: 87,
    ani: 12
  },
  {
    id: "ag-003",
    nume: "Elena Marin",
    rol: "Specialist Terenuri & Dezvoltare",
    bio: "Fost arhitect, înțelege în profunzime potențialul terenurilor. Expert PUG, PUZ, certificate de urbanism.",
    email: "elena.marin@agentia-imobiliara.ro",
    telefon: "+40 744 789 012",
    foto: "images/team/agent3.jpg",
    proprietatiVandute: 64,
    ani: 6
  },
  {
    id: "ag-004",
    nume: "Alexandru Stan",
    rol: "Agent Proiecte Noi",
    bio: "Coordonează relația cu dezvoltatorii și ghidează cumpărătorii prin procesul de pre-vânzare și livrare.",
    email: "alexandru.stan@agentia-imobiliara.ro",
    telefon: "+40 755 012 345",
    foto: "images/team/agent4.jpg",
    proprietatiVandute: 98,
    ani: 5
  }
];

// Helpers
function getAgentById(id) {
  return agenti.find(a => a.id === id);
}

function getAllProperties() {
  return [
    ...rezidential.map(p => ({ ...p, categorie: 'rezidential' })),
    ...comercial.map(p => ({ ...p, categorie: 'comercial' })),
    ...terenuri.map(p => ({ ...p, categorie: 'terenuri' }))
  ];
}
