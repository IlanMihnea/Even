// EVEN — server-side PDF renderer for signed contracts.
// Uses pdfmake (0.2.x) with the EVEN brand fonts embedded as static TTFs.
const path = require('path');
const crypto = require('crypto');
const PdfPrinter = require('pdfmake/src/printer');

const F = path.join(__dirname, 'fonts');
const fonts = {
  Cormorant: {
    normal: path.join(F, 'Cormorant-Regular.ttf'),
    bold: path.join(F, 'Cormorant-Bold.ttf'),
    italics: path.join(F, 'Cormorant-Italic.ttf'),
    bolditalics: path.join(F, 'Cormorant-BoldItalic.ttf'),
  },
  DMSans: {
    normal: path.join(F, 'DMSans-Regular.ttf'),
    bold: path.join(F, 'DMSans-Bold.ttf'),
    italics: path.join(F, 'DMSans-Italic.ttf'),
    bolditalics: path.join(F, 'DMSans-BoldItalic.ttf'),
  },
};

const printer = new PdfPrinter(fonts);

/** Render a pdfmake docDefinition into a PDF Buffer. */
function renderPdf(docDefinition) {
  return new Promise((resolve, reject) => {
    const doc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

/**
 * Canonical document fingerprint — proves the signed content was not altered.
 * Hashes the contract data + the signature image + the signing timestamp,
 * independently of how the PDF bytes are laid out (reproducible).
 */
function fingerprint({ contract, signatureDataUrl, signedAt }) {
  const canonical = JSON.stringify({ contract, signatureDataUrl, signedAt });
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

module.exports = { renderPdf, fingerprint };
