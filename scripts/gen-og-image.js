const sharp = require('sharp');
const path = require('path');

const src = path.join(__dirname, '../project/design/hero-mobile.jpg');
const dest = path.join(__dirname, '../project/design/og-default.jpg');

sharp(src)
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(dest)
  .then(info => {
    const kb = Math.round(info.size / 1024);
    console.log(`og-default.jpg written — ${info.width}×${info.height}, ${kb} KB`);
  })
  .catch(err => { console.error(err); process.exit(1); });
