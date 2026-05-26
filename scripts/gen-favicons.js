// One-shot: generate favicon.ico + sized PNGs from logomark-even.svg
const fs        = require('fs');
const path      = require('path');
const sharp     = require('sharp');
const pngToIco  = require('png-to-ico').default;

const SRC = path.join(__dirname, '..', 'project', 'design', 'logomark-even.svg');
const OUT = path.join(__dirname, '..', 'project');

const svgBuf = fs.readFileSync(SRC);

// Padding so the mark doesn't bleed to the edges at tiny sizes
async function renderPng(size) {
  const buf = await sharp(svgBuf, { density: 384 })
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toBuffer();
  return buf;
}

(async () => {
  const sizes = [16, 32, 48, 96, 180, 192, 512];
  const pngs = {};
  for (const s of sizes) pngs[s] = await renderPng(s);

  // Multi-size favicon.ico (16/32/48)
  const icoBuf = await pngToIco([pngs[16], pngs[32], pngs[48]]);
  fs.writeFileSync(path.join(OUT, 'favicon.ico'), icoBuf);

  fs.writeFileSync(path.join(OUT, 'favicon-32.png'),       pngs[32]);
  fs.writeFileSync(path.join(OUT, 'favicon-96.png'),       pngs[96]);
  fs.writeFileSync(path.join(OUT, 'apple-touch-icon.png'), pngs[180]);
  fs.writeFileSync(path.join(OUT, 'icon-192.png'),         pngs[192]);
  fs.writeFileSync(path.join(OUT, 'icon-512.png'),         pngs[512]);

  console.log('Generated:');
  for (const f of ['favicon.ico','favicon-32.png','favicon-96.png','apple-touch-icon.png','icon-192.png','icon-512.png']) {
    const p = path.join(OUT, f);
    console.log('  ' + f + '  ' + fs.statSync(p).size + ' bytes');
  }
})().catch(e => { console.error(e); process.exit(1); });
