// Local smoke-test: renders a sample SIGNED contract PDF so you can eyeball the
// EVEN brand + signature + audit trail. Run: node scripts/test-contract-pdf.js
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');
const { buildContractDoc } = require('../api/_contracts/template');
const { renderPdf, fingerprint } = require('../api/_contracts/pdf');

// --- fake a hand-drawn signature as a transparent PNG data URL ---
function fakeSignature(text) {
  const c = createCanvas(360, 140);
  const ctx = c.getContext('2d');
  ctx.strokeStyle = '#1C2340';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  let x = 12, y = 90;
  ctx.moveTo(x, y);
  for (let i = 0; i < 320; i += 4) {
    x = 12 + i;
    y = 90 + Math.sin(i / 14) * 22 - (i / 320) * 18 + Math.sin(i / 3) * 4;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.font = 'italic 26px sans-serif';
  ctx.fillStyle = '#1C2340';
  ctx.fillText(text, 30, 120);
  return 'data:image/png;base64,' + c.toBuffer('image/png').toString('base64');
}

async function main() {
  const client = {
    label: 'PROPRIETARUL',
    persons: [
      { name: 'Brotnei Alexa', domiciliu: 'Piatra Neamț, jud. Neamț', cnp: '1850101270011', ciSeria: 'NT', ciNr: '456789', telefon: '+40722111222', email: 'alexa@example.com' },
      { name: 'Brotnei Maria-Florentina', feminine: true, domiciliu: 'Piatra Neamț, jud. Neamț', cnp: '2870202270022', ciSeria: 'NT', ciNr: '456790' },
    ],
  };

  const signedAtISO = new Date().toISOString();
  const signedAtLocal = new Date().toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest', dateStyle: 'long', timeStyle: 'short' });

  const contractData = {
    meta: { nr: '2026-014', data: '03.06.2026', title: 'Contract de intermediere imobiliară', subtitle: '— mandat de vânzare —' },
    client,
    terms: {
      propertyText: 'Proprietarul încredințează Agenției intermedierea în vederea vânzării imobilului situat în Jud. Neamț, UAT Bicaz, înscris în Cartea Funciară nr. 50530 Bicaz — teren intravilan 1.000 mp împreună cu toate construcțiile edificate pe acesta. Vânzarea se face „la pachet", teren și construcții împreună.',
      pret: '350.000 EUR',
      durata: '6 luni',
    },
  };

  // Two signers who signed the SAME document, in order.
  const signers = [
    {
      position: 1, role: 'Proprietar', name: 'Brotnei Alexa', email: 'alexa@example.com',
      clientData: { domiciliu: 'Piatra Neamț, jud. Neamț', cnp: '1850101270011', ciSeria: 'NT', ciNr: '456789', telefon: '+40722111222', email: 'alexa@example.com' },
      signatureDataUrl: fakeSignature('Alexa Brotnei'), signedAtLocal,
      audit: { email: 'alexa@example.com', signedAtLocal, ip: '86.124.33.10', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5) Safari/605.1' },
    },
    {
      position: 2, role: 'Soție', name: 'Brotnei Maria-Florentina', email: 'maria@example.com',
      clientData: { domiciliu: 'Piatra Neamț, jud. Neamț', cnp: '2870202270022', ciSeria: 'NT', ciNr: '456790', feminine: true },
      signatureDataUrl: fakeSignature('Maria Brotnei'), signedAtLocal,
      audit: { email: 'maria@example.com', signedAtLocal, ip: '92.43.18.220', userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/124' },
    },
  ];

  const documentHash = fingerprint({ contract: contractData, signatureDataUrl: signers.map((s) => s.signatureDataUrl).join('|'), signedAt: signedAtISO });

  const doc = buildContractDoc({ ...contractData, signers, documentHash });

  const buf = await renderPdf(doc);
  const out = path.join(__dirname, '..', 'exemplu', 'Contract_EVEN_semnat_DEMO.pdf');
  fs.writeFileSync(out, buf);
  console.log('WROTE', out, buf.length, 'bytes');
  console.log('FINGERPRINT', documentHash);
}

main().catch((e) => { console.error(e); process.exit(1); });
