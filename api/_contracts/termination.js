// EVEN — "notificare de denunțare unilaterală" document for pdfmake.
// buildTerminationDoc(data) -> pdfmake docDefinition, same brand as the contract.
// Used to formally end a SIGNED contract (art. IV.4.4 — 30-day written notice).
//
// data shape:
// {
//   meta:        { contractTitle, contractNr, contractDate },
//   recipients:  [ { name, domiciliu, cnp } ],     // the party/parties notified
//   reason:      'optional free text',
//   noticeDays:  30,
//   dateLocal:        '11 iunie 2026',             // date of the notice
//   effectiveLocal:   '11 iulie 2026',             // when termination takes effect
// }

const { AGENCY } = require('./template');

// ---- EVEN brand palette ----
const MIDNIGHT = '#1C2340';
const SAGE = '#7A9B92';
const PEBBLE = '#E8E5DC';
const STONE = '#6B6E66';
const INK = '#1C2340';

const SERIF = 'Cormorant';
const SANS = 'DMSans';
const CONTENT_W = 467;

const t = (text) => ({ text, color: INK });
const b = (text) => ({ text, bold: true, color: MIDNIGHT });

function hairline(color, width) {
  return {
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: CONTENT_W, y2: 0, lineWidth: width || 0.6, lineColor: color }],
    margin: [0, 3, 0, 0],
  };
}
function eyebrow(text) {
  return { text: String(text).toUpperCase(), font: SANS, fontSize: 7.5, bold: true, color: SAGE, characterSpacing: 1.5, margin: [0, 0, 0, 4] };
}
function para(parts, extra) {
  return Object.assign({ text: parts, font: SANS, fontSize: 10.5, color: INK, alignment: 'justify', lineHeight: 1.34, margin: [0, 0, 0, 8] }, extra || {});
}

function recipientLine(r) {
  const parts = [b((r.name || '____________________').toUpperCase())];
  if (r.domiciliu) parts.push(t(', cu domiciliul în '), t(r.domiciliu));
  if (r.cnp) parts.push(t(', CNP '), t(r.cnp));
  return parts;
}

function buildTerminationDoc(data = {}) {
  const meta = data.meta || {};
  const recipients = (data.recipients && data.recipients.length) ? data.recipients : [{ name: '____________________' }];
  const noticeDays = data.noticeDays || 30;

  const content = [];

  // === MASTHEAD ===
  content.push(
    { text: 'E V E N', font: SERIF, fontSize: 28, bold: true, color: MIDNIGHT, characterSpacing: 3, margin: [0, 0, 0, 2] },
    { text: 'IMOBILIARE CU PLAN', font: SANS, fontSize: 7, bold: true, color: SAGE, characterSpacing: 2, margin: [0, 0, 0, 2] },
    hairline(MIDNIGHT, 1.2),
  );

  // === TITLE ===
  content.push(
    { text: '', margin: [0, 12, 0, 0] },
    eyebrow('Notificare'),
    { text: 'Denunțare unilaterală a contractului', font: SERIF, fontSize: 22, bold: true, color: MIDNIGHT, margin: [0, 0, 0, 12] },
  );

  // Nr / Data of the notice
  content.push({
    columns: [
      { width: '*', text: [t('Notificare nr. '), b(meta.noticeNr || '—')], font: SANS, fontSize: 10.5 },
      { width: 'auto', text: [t('Data '), b(data.dateLocal || '—')], font: SANS, fontSize: 10.5 },
    ],
    margin: [0, 0, 0, 14],
  });

  // === FROM (agency) ===
  content.push(eyebrow('De la'));
  content.push(para([
    b(AGENCY.legalName),
    t(', cu sediul social în România, Piatra Neamț, jud. Neamț, Str. Ion Creangă nr. 9, înregistrată la Registrul Comerțului sub nr. J2026003443008, CUI 53340194, reprezentată legal '),
    t(AGENCY.rep),
    t(', în calitate de '), b('Agenție'), t('.'),
  ]));

  // === TO (recipients) ===
  content.push(eyebrow('Către'));
  recipients.forEach((r, i) => {
    content.push(para(recipientLine(r).concat(i === recipients.length - 1 ? [t('.')] : [t(';')])));
  });

  // === BODY ===
  content.push({ text: '', margin: [0, 4, 0, 0] });
  const ref = [t('Contractul de intermediere imobiliară')];
  if (meta.contractTitle) { ref.length = 0; ref.push(t('„'), b(meta.contractTitle), t('”')); }
  content.push(para(
    [t('Prin prezenta, în temeiul art. IV.4.4 din ')]
      .concat(ref)
      .concat(meta.contractNr ? [t(' nr. '), b(meta.contractNr)] : [])
      .concat(meta.contractDate ? [t(' din data de '), b(meta.contractDate)] : [])
      .concat([t(', vă comunicăm '), b('denunțarea unilaterală'), t(' a acestui contract.')])
  ));

  content.push(para([
    t('Denunțarea produce efecte la împlinirea termenului de preaviz de '),
    b(noticeDays + ' (treizeci) de zile'),
    t(' de la data comunicării prezentei notificări, respectiv începând cu data de '),
    b(data.effectiveLocal || '—'),
    t(', dată la care contractul încetează de drept.'),
  ]));

  if (data.reason && String(data.reason).trim()) {
    content.push(eyebrow('Motivul denunțării'));
    content.push(para([t(String(data.reason).trim())]));
  }

  content.push(para([
    t('Până la data încetării, obligațiile scadente ale părților rămân datorate. '),
    t('Vă rugăm să confirmați primirea prezentei notificări. Prezenta a fost transmisă pe cale electronică, la adresa de e-mail comunicată la încheierea contractului.'),
  ]));

  // === SIGNATURE (agency) ===
  content.push({ text: '', margin: [0, 22, 0, 0] });
  content.push({
    columns: [
      { width: '*', text: '' },
      {
        width: 'auto',
        stack: [
          { text: 'AGENȚIA', font: SANS, fontSize: 7, bold: true, color: SAGE, characterSpacing: 1.2, margin: [0, 0, 0, 18] },
          hairline(STONE, 0.6),
          { text: AGENCY.legalName, font: SANS, fontSize: 10.5, bold: true, color: MIDNIGHT, margin: [0, 4, 0, 1] },
          { text: 'prin Ilan-Mihnea Eibenschutz, administrator', font: SANS, fontSize: 9, color: STONE },
        ],
      },
    ],
  });

  return {
    pageSize: 'A4',
    pageMargins: [64, 64, 64, 86],
    info: { title: 'Notificare de denunțare', author: 'EVEN — AMIT ESTATE S.R.L.' },
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

module.exports = { buildTerminationDoc };
