// EVEN — contract template for pdfmake.
// buildContractDoc(data) -> pdfmake docDefinition, reproducing the EVEN brand
// (palette + Cormorant Garamond / DM Sans) from _contract_build/build.js.
//
// data shape (all optional — sensible defaults render a full sample):
// {
//   meta:    { nr, data, eyebrow, title, subtitle },
//   client:  { label, persons: [ { name, role, domiciliu, cnp, ciSeria, ciNr, telefon, email } ] },
//   terms:   { propertyText, pret, comision, comisionPrag, durata },
//   signature: { imageDataUrl, signedAt },            // client's drawn signature (PNG data URL)
//   audit:   { signerName, email, ip, userAgent, signedAtLocal, hash, method }
// }

// ---- EVEN brand palette ----
const MIDNIGHT = '#1C2340';
const SAGE = '#7A9B92';
const GOLD = '#C8A96E';
const PEBBLE = '#E8E5DC';
const STONE = '#6B6E66';
const INK = '#1C2340';
const PAPER = '#F1F0EC';

const SERIF = 'Cormorant';
const SANS = 'DMSans';
const CONTENT_W = 467; // A4 width (595.28) minus 64pt L/R margins

const { buildBody, parseRuns, AGENCY_CLAUSE, clientClauseText } = require('./content');

// ---- fixed agency identity ----
const AGENCY = {
  legalName: 'AMIT ESTATE S.R.L.',
  detail:
    ', cu sediul social în România, Piatra Neamț, jud. Neamț, Str. Ion Creangă nr. 9, ' +
    'cod poștal 610102, înregistrată la Registrul Comerțului sub nr. J2026003443008, ' +
    'CUI 53340194, cont IBAN RO81BACX0000004110573000 deschis la UniCredit Bank, ' +
    'reprezentată legal prin Ilan-Mihnea Eibenschutz, administrator, ' +
    'telefon +40745609366, e-mail ilan@even-imobiliare.ro, denumită în continuare ',
  rep: 'prin Ilan-Mihnea Eibenschutz, administrator',
};

// ---------- inline helpers ----------
const b = (text) => ({ text, bold: true, color: MIDNIGHT });
const t = (text) => ({ text, color: INK });
const field = (value, placeholder) =>
  value
    ? { text: String(value), color: MIDNIGHT, bold: true }
    : { text: placeholder || '________________', color: STONE, italics: true };

// Parse "**bold** plain" clause text into pdfmake runs (bold → midnight).
const runs = (text) => parseRuns(text).map((p) => (p.bold ? { text: p.text, bold: true, color: MIDNIGHT } : { text: p.text }));

// ---------- block helpers ----------
function eyebrow(text) {
  return {
    text: String(text).toUpperCase(),
    font: SANS, fontSize: 7.5, bold: true, color: SAGE,
    characterSpacing: 1.5, margin: [0, 0, 0, 4],
  };
}

function hairline(color, width) {
  return {
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: CONTENT_W, y2: 0, lineWidth: width || 0.6, lineColor: color }],
    margin: [0, 3, 0, 0],
  };
}

function section(text) {
  return {
    stack: [
      { text, font: SERIF, fontSize: 15, bold: true, color: MIDNIGHT },
      hairline(SAGE, 0.8),
    ],
    margin: [0, 16, 0, 7],
    unbreakable: true,
  };
}

function clause(num, body) {
  const parts = [];
  if (num) parts.push({ text: num + '  ', bold: true, color: MIDNIGHT });
  if (typeof body === 'string') parts.push(t(body));
  else for (const p of body) parts.push(typeof p === 'string' ? t(p) : p);
  return {
    text: parts, font: SANS, fontSize: 10.5, color: INK,
    alignment: 'justify', lineHeight: 1.32, margin: [0, 0, 0, 6],
  };
}

function centeredAnd() {
  return { text: 'și', font: SERIF, fontSize: 13, italics: true, color: SAGE, alignment: 'center', margin: [0, 2, 0, 6] };
}

// ---------- parties ----------
function personRun(p) {
  const name = b((p.name || '____________________').toUpperCase());
  // sign-only (no personal data collected): just the name.
  const hasData = p.cnp || p.domiciliu || p.ciSeria || p.ciNr;
  if (!hasData) return [name];

  const out = [name];
  if (p.domiciliu) out.push(t(', domiciliat'), p.feminine ? t('ă') : t(''), t(' în '), field(p.domiciliu));
  if (p.cnp) out.push(t(', CNP '), field(p.cnp));
  if (p.ciSeria || p.ciNr) out.push(t(', CI seria '), field(p.ciSeria), t(' nr. '), field(p.ciNr));
  if (p.telefon) out.push(t(', telefon '), field(p.telefon));
  if (p.email) out.push(t(', e-mail '), field(p.email));
  return out;
}

function buildClientClause(persons, label) {
  persons = persons || [];
  label = label || 'CLIENTUL';
  const parts = [];
  persons.forEach((p, i) => {
    if (i > 0) parts.push(t(', împreună cu '));
    parts.push(...personRun(p));
  });
  parts.push(t(', denumi'), t(persons.length > 1 ? 'ți' : 't'), t(' în continuare '));
  parts.push(b(label));
  parts.push(t(' (Clientul),'));
  return clause('2.', parts);
}

// ---------- signatures ----------
// One signer block: role label, drawn signature (or blank line), name, caption.
function signerEntry({ role, name, sub, sigImage, caption }) {
  const stack = [
    { text: (role || '').toUpperCase(), font: SANS, fontSize: 7, bold: true, color: SAGE, characterSpacing: 1.2, margin: [0, 0, 0, 4] },
  ];
  if (sigImage) stack.push({ image: sigImage, fit: [180, 56], margin: [0, 2, 0, 2] });
  else stack.push({ text: '\n\n', fontSize: 10 });
  stack.push(hairline(STONE, 0.6));
  stack.push({ text: name || '____________________', font: SANS, fontSize: 10.5, bold: true, color: MIDNIGHT, margin: [0, 4, 0, sub ? 1 : 0] });
  if (sub) stack.push({ text: sub, font: SANS, fontSize: 9, color: STONE });
  if (caption) stack.push({ text: caption, font: SANS, fontSize: 7.5, color: STONE, italics: true, margin: [0, 1, 0, 0] });
  return stack;
}

// ---------- audit trail (one block per signer + final fingerprint) ----------
function auditSection(signers, finalHash) {
  const signed = (signers || []).filter((s) => s.audit);
  if (!signed.length) return null;

  const row = (k, v) => [
    { text: k, font: SANS, fontSize: 8, color: STONE, margin: [0, 1.5, 0, 1.5] },
    { text: v || '—', font: SANS, fontSize: 8.5, color: INK, margin: [0, 1.5, 0, 1.5] },
  ];

  const inner = [
    { text: 'CONFIRMARE SEMNĂTURI ELECTRONICE', font: SANS, fontSize: 8, bold: true, color: SAGE, characterSpacing: 1.4, margin: [0, 0, 0, 10] },
  ];

  signed.forEach((s, i) => {
    const a = s.audit || {};
    inner.push({
      text: `${i + 1}. ${(s.name || '').toUpperCase()}${s.role ? '  ·  ' + s.role : ''}`,
      font: SANS, fontSize: 9, bold: true, color: MIDNIGHT, margin: [0, i ? 9 : 0, 0, 4],
    });
    inner.push({
      table: {
        widths: [104, '*'],
        body: [
          row('E-mail', a.email || s.email),
          row('Data și ora', a.signedAtLocal),
          row('Adresă IP', a.ip),
          row('Dispozitiv', a.userAgent),
        ],
      },
      layout: 'noBorders',
    });
  });

  inner.push(hairline(PEBBLE, 0.6));
  inner.push({
    table: {
      widths: [104, '*'],
      body: [
        row('Amprentă document (SHA-256)', finalHash),
        row('Metodă', 'Semnătură electronică simplă (Reg. UE 910/2014 — eIDAS)'),
      ],
    },
    layout: 'noBorders',
    margin: [0, 6, 0, 0],
  });

  return {
    margin: [0, 16, 0, 0],
    unbreakable: true,
    table: { widths: ['*'], body: [[{ fillColor: PAPER, margin: [14, 12, 14, 12], stack: inner }]] },
    layout: {
      hLineWidth: () => 0.8, vLineWidth: () => 0.8,
      hLineColor: () => PEBBLE, vLineColor: () => PEBBLE,
    },
  };
}

// ---------- main builder ----------
function buildContractDoc(data = {}) {
  const meta = data.meta || {};
  const terms = data.terms || {};
  const client = data.client || {};
  const clientLabel = client.label || 'PROPRIETARUL';

  // Signers of this document (parallel). Fall back to client.persons for a draft preview.
  const signers = (data.signers && data.signers.length)
    ? data.signers
    : ((client.persons) || [{ name: '____________________' }]).map((p, i) => ({
        name: p.name, role: client.label || 'Semnatar', position: i + 1, clientData: p,
      }));
  const persons = signers.map((s) => ({ name: s.name, role: s.role, ...(s.clientData || {}) }));
  const sections = data.sections || buildBody(terms);

  const content = [];

  // === MASTHEAD ===
  content.push(
    { text: 'E V E N', font: SERIF, fontSize: 28, bold: true, color: MIDNIGHT, characterSpacing: 3, margin: [0, 0, 0, 2] },
    { text: 'IMOBILIARE CU PLAN', font: SANS, fontSize: 7, bold: true, color: SAGE, characterSpacing: 2, margin: [0, 0, 0, 2] },
    hairline(MIDNIGHT, 1.2),
  );

  // === TITLE BLOCK ===
  content.push(
    { text: '', margin: [0, 10, 0, 0] },
    eyebrow(meta.eyebrow || 'Contract'),
    { text: meta.title || 'Contract de intermediere imobiliară', font: SERIF, fontSize: 22, bold: true, color: MIDNIGHT, margin: [0, 0, 0, 2] },
    { text: meta.subtitle || '— mandat de vânzare —', font: SERIF, fontSize: 13, italics: true, color: SAGE, margin: [0, 0, 0, 12] },
  );

  // Nr / Data
  content.push({
    columns: [
      { width: '*', text: [t('Nr. '), field(meta.nr, '________________')], font: SANS, fontSize: 10.5 },
      { width: 'auto', text: [t('Data '), field(meta.data, '________________')], font: SANS, fontSize: 10.5 },
    ],
    margin: [0, 0, 0, 6],
  });

  // === I. PĂRȚILE — agency fixed, signers dynamic (from collected data) ===
  content.push(section('I.  Părțile'));
  content.push(clause('1.', runs(AGENCY_CLAUSE)));
  content.push(centeredAnd());
  content.push(clause('2.', runs(clientClauseText(signers, clientLabel))));
  content.push(clause(null, 'au convenit încheierea prezentului contract.'));

  // === II.+ — the authored contract body (admin-composed, or default) ===
  sections.forEach((s) => {
    if (s.h) content.push(section(s.h));
    (s.c || []).forEach((cl) => content.push(clause(cl.n, runs(cl.t))));
  });

  // === SIGNATURES === (uses `signers` derived above; same document, all signatures)
  content.push({ text: '', margin: [0, 18, 0, 0] });

  // Left column: the agency. Right column: every signer, stacked, each with own signature.
  const clientStack = [];
  signers.forEach((s, i) => {
    if (i > 0) clientStack.push({ text: '', margin: [0, 12, 0, 0] });
    signerEntry({
      role: s.role || 'Semnatar',
      name: (s.name || '____________________').toUpperCase(),
      sigImage: s.signatureDataUrl,
      caption: s.signedAtLocal ? 'Semnat electronic · ' + s.signedAtLocal : null,
    }).forEach((blk) => clientStack.push(blk));
  });

  content.push({
    unbreakable: true,
    columns: [
      { width: '50%', stack: signerEntry({ role: 'Agenția', name: AGENCY.legalName, sub: AGENCY.rep, sigImage: data.agencySignatureDataUrl }) },
      { width: '50%', stack: clientStack },
    ],
    columnGap: 24,
  });

  // === AUDIT TRAIL ===
  const ab = auditSection(signers, data.documentHash);
  if (ab) content.push(ab);

  return {
    pageSize: 'A4',
    pageMargins: [64, 64, 64, 86],
    info: {
      title: meta.title || 'Contract de intermediere imobiliară',
      author: 'EVEN — AMIT ESTATE S.R.L.',
    },
    defaultStyle: { font: SANS, fontSize: 10.5, color: INK },
    content,
    footer: (currentPage, pageCount) => ({
      margin: [64, 10, 64, 0],
      stack: [
        hairline(PEBBLE, 0.6),
        {
          columns: [
            { width: '*', text: 'EVEN · Imobiliare cu plan', font: SERIF, fontSize: 9, italics: true, color: SAGE },
            { width: 'auto', text: 'AMIT ESTATE S.R.L. · CUI 53340194', font: SANS, fontSize: 7.5, color: STONE },
          ],
          margin: [0, 4, 0, 0],
        },
        { text: `Pag. ${currentPage} / ${pageCount}`, font: SANS, fontSize: 7.5, color: STONE, alignment: 'center', margin: [0, 2, 0, 0] },
      ],
    }),
  };
}

module.exports = { buildContractDoc, AGENCY };
