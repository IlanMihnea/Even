// EVEN — contract clause content + the text⇄structure converters used by the
// admin composer, the signing page (/api/contracts-get) and the final PDF
// (template.js). Bold is marked inline with **double asterisks**.
//
// Section I ("Părțile") is ALWAYS generated automatically (agency + the signers).
// The admin authors the BODY (art. II onward); buildBody() is the default text.

const AGENCY_CLAUSE =
  '**AMIT ESTATE S.R.L.**, cu sediul social în România, Piatra Neamț, jud. Neamț, ' +
  'Str. Ion Creangă nr. 9, cod poștal 610102, înregistrată la Registrul Comerțului sub ' +
  'nr. J2026003443008, CUI 53340194, cont IBAN RO81BACX0000004110573000 deschis la ' +
  'UniCredit Bank, reprezentată legal prin Ilan-Mihnea Eibenschutz, administrator, ' +
  'telefon +40745609366, e-mail ilan@even-imobiliare.ro, denumită în continuare ' +
  '**AGENȚIA** (Intermediarul),';

// Generic "Părțile" section for the signing page (the PDF builds it from real data).
function pageParties() {
  return { h: 'I. Părțile', c: [
    { n: '1.', t: AGENCY_CLAUSE },
    { n: '2.', t: '**PROPRIETARUL** (Clientul), reprezentat de semnatarii identificați mai jos, care semnează prezentul contract.' },
  ]};
}

// Default contract BODY (art. II onward) as structured sections.
function buildBody(terms = {}) {
  const pret = terms.pret || '350.000 EUR';
  const comision = terms.comision || '3% din prețul de vânzare';
  const comisionPrag = terms.comisionPrag || '4% din prețul de vânzare';
  const durata = terms.durata || '6 luni';
  const propertyText = terms.propertyText ||
    'Proprietarul încredințează Agenției intermedierea în vederea vânzării imobilului ce ' +
    'face obiectul prezentului contract, conform descrierii și actelor puse la dispoziție de Proprietar.';

  return [
    { h: 'II. Obiectul contractului', c: [
      { n: '2.1.', t: propertyText },
      { n: '2.3.', t: 'Prețul de vânzare solicitat este de **' + pret + '**. Poate fi modificat numai prin acordul scris al părților.' },
    ]},
    { h: 'III. Comisionul', c: [
      { n: '3.1.', t: 'Comisionul de intermediere este de **' + comision + '**. Dacă prețul final de vânzare atinge sau depășește 400.000 EUR, comisionul este de **' + comisionPrag + '**. Agenția nu este plătitoare de TVA; comisionul nu include TVA.' },
      { n: '3.2.', t: 'Comisionul este datorat de Proprietar (Vânzător).' },
      { n: '3.3.', t: 'Comisionul devine scadent la momentul semnării contractului autentic de vânzare-cumpărare și se achită prin transfer bancar în contul Agenției indicat la art. I.' },
    ]},
    { h: 'IV. Durata și exclusivitatea', c: [
      { n: '4.1.', t: 'Contractul se încheie pe durata de **' + durata + '** de la data semnării.' },
      { n: '4.2.', t: 'Pe durata contractului, Proprietarul acordă Agenției exclusivitate: nu va încredința imobilul altei agenții și nu va face publicitate proprie pentru vânzare.' },
      { n: '4.4.', t: 'Oricare parte poate denunța unilateral contractul printr-o notificare scrisă cu un preaviz de 30 de zile.' },
    ]},
    { h: 'V. Obligațiile părților', c: [
      { n: '5.1.', t: '**Agenția** se obligă: să promoveze imobilul pe cheltuiala sa (anunțuri, fotografii, panou), să prezinte potențiali cumpărători, să țină evidența datată a clienților prezentați, să asiste părțile până la finalizarea tranzacției și să trateze datele Proprietarului conform legii.' },
      { n: '5.2.', t: '**Proprietarul** se obligă: să pună la dispoziție actele imobilului, să permită vizionările, să comunice Agenției orice ofertă primită direct și să nu ocolească Agenția în relația cu clienții prezentați de aceasta.' },
    ]},
    { h: 'VI. Protecția datelor (GDPR)', c: [
      { n: '6.1.', t: 'Clientul își exprimă acordul ca Agenția să prelucreze datele sale cu caracter personal în scopul executării prezentului contract, conform Regulamentului (UE) 2016/679. Datele sunt stocate în Uniunea Europeană, nu sunt transmise terților în afara scopului contractual și pot fi accesate, rectificate sau șterse la cererea Clientului.' },
    ]},
    { h: 'VII. Dispoziții finale', c: [
      { n: '7.1.', t: 'Litigiile se soluționează amiabil, iar în lipsa unei soluții, de instanțele competente. Contractul a fost citit, înțeles și acceptat de părți și semnat electronic, semnătura electronică având valoarea juridică prevăzută de Regulamentul (UE) 910/2014 (eIDAS).' },
    ]},
  ];
}

// sections -> editable text (for the admin composer textarea).
//   "# Heading" starts a section; clause lines keep their number prefix.
function sectionsToText(sections) {
  return (sections || []).map((s) =>
    '# ' + s.h + '\n' + (s.c || []).map((cl) => (cl.n ? cl.n + ' ' : '') + cl.t).join('\n')
  ).join('\n\n');
}

// editable text -> sections. Lines starting with "#" are headings; a leading
// "1." / "2.1." / "3.3." becomes the clause number; everything else is body text.
function parseBody(text) {
  const sections = [];
  let cur = null;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) { cur = { h: line.replace(/^#+\s*/, ''), c: [] }; sections.push(cur); continue; }
    if (!cur) { cur = { h: '', c: [] }; sections.push(cur); }
    const m = line.match(/^(\d+(?:\.\d+)*\.)\s+(.*)$/);
    if (m) cur.c.push({ n: m[1], t: m[2] });
    else cur.c.push({ n: null, t: line });
  }
  return sections;
}

// "a **b** c" -> [{text:'a '},{text:'b',bold:true},{text:' c'}]
function parseRuns(text) {
  const parts = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ text: m[1], bold: true });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

module.exports = { AGENCY_CLAUSE, pageParties, buildBody, sectionsToText, parseBody, parseRuns };
