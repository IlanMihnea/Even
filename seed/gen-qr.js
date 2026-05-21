// Generates the QR code for the banner landing page.
// Run:  node seed/gen-qr.js
// Output: project/design/qr-banner.svg  +  qr-banner.png
const QRCode = require('qrcode');
const path = require('path');

const URL = process.env.BANNER_URL || 'https://even-imobiliare.ro/banner';
const OUT_DIR = path.join(__dirname, '..', 'project', 'design');

const opts = {
  errorCorrectionLevel: 'Q',          // tolerates print wear / partial damage
  margin: 2,
  color: { dark: '#1C2340', light: '#FFFFFF' } // EVEN Midnight on white
};

(async () => {
  await QRCode.toFile(path.join(OUT_DIR, 'qr-banner.svg'), URL, { ...opts, type: 'svg' });
  await QRCode.toFile(path.join(OUT_DIR, 'qr-banner.png'), URL, { ...opts, width: 1400 });
  console.log('QR generat pentru:', URL);
  console.log(' -> project/design/qr-banner.svg  (vector, pentru tipar)');
  console.log(' -> project/design/qr-banner.png  (1400px)');
})().catch(e => { console.error(e); process.exit(1); });
