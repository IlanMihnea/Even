// Single serverless function for ALL contract operations, dispatched by ?action=
// (Vercel Hobby allows max 12 functions — these are bundled here instead of one
// file per endpoint. The handler implementations live in api/_contracts/h_*.js,
// which are not counted as functions because of the leading-underscore folder.)
//
//   GET  /api/contracts?action=get&token=…        → signing page payload
//   POST /api/contracts?action=sign               → record a signature
//   POST /api/contracts?action=create   (admin)   → create + email links
//   POST /api/contracts?action=void     (admin)   → cancel a contract
//   POST /api/contracts?action=terminate(admin)   → denunțare + notice PDF
//   POST /api/contracts?action=file     (admin)   → signed URL to a stored PDF

const ACTIONS = {
  get: require('./_contracts/h_get'),
  sign: require('./_contracts/h_sign'),
  create: require('./_contracts/h_create'),
  void: require('./_contracts/h_void'),
  terminate: require('./_contracts/h_terminate'),
  file: require('./_contracts/h_file'),
  delete: require('./_contracts/h_delete'),
};

module.exports = function handler(req, res) {
  const action = (req.query && req.query.action) || '';
  const fn = ACTIONS[action];
  if (!fn) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    return res.status(404).json({ error: 'Acțiune necunoscută' });
  }
  return fn(req, res);
};
