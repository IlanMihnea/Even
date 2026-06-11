// Local smoke-test: renders a sample "Notificare de denunțare" PDF.
// Run: node scripts/test-termination-pdf.js
const fs = require('fs');
const path = require('path');
const { buildTerminationDoc } = require('../api/_contracts/termination');
const { renderPdf } = require('../api/_contracts/pdf');

function roLong(d) { return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }); }

async function main() {
  const now = new Date();
  const effective = new Date(now.getTime() + 30 * 864e5);
  const doc = buildTerminationDoc({
    meta: { contractTitle: 'Contract de intermediere imobiliară', contractNr: '2026-014', contractDate: '03.06.2026', noticeNr: '2026-D0a1b2c' },
    recipients: [
      { name: 'Brotnei Alexa', domiciliu: 'Piatra Neamț, jud. Neamț', cnp: '1850101270011' },
      { name: 'Brotnei Maria-Florentina', domiciliu: 'Piatra Neamț, jud. Neamț', cnp: '2870202270022' },
    ],
    reason: 'Denunțare la inițiativa Agenției, conform înțelegerii dintre părți.',
    noticeDays: 30,
    dateLocal: roLong(now),
    effectiveLocal: roLong(effective),
  });
  const buf = await renderPdf(doc);
  const out = path.join(__dirname, '..', 'exemplu', 'Notificare_denuntare_DEMO.pdf');
  fs.writeFileSync(out, buf);
  console.log('WROTE', out, buf.length, 'bytes');
}

main().catch((e) => { console.error(e); process.exit(1); });
