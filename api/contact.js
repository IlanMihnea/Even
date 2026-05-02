module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { nume, email, telefon, subiect, mesaj } = req.body || {};
  if (!email || !mesaj) return res.status(400).json({ error: 'Câmpuri obligatorii lipsesc' });

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'EVEN <noreply@even.ro>',
      to: [process.env.OWNER_EMAIL],
      reply_to: email,
      subject: `[EVEN] ${subiect || 'Contact nou'}`,
      html: `
        <h2 style="color:#1C2340">Mesaj nou — EVEN Real Estate</h2>
        <table cellpadding="8" style="font-family:sans-serif;font-size:14px">
          <tr><td><strong>Nume:</strong></td><td>${escapeHtml(nume || '-')}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${escapeHtml(email)}</td></tr>
          <tr><td><strong>Telefon:</strong></td><td>${escapeHtml(telefon || '-')}</td></tr>
          <tr><td><strong>Subiect:</strong></td><td>${escapeHtml(subiect || '-')}</td></tr>
        </table>
        <hr style="margin:16px 0">
        <p style="font-family:sans-serif;font-size:14px;line-height:1.6">${escapeHtml(mesaj).replace(/\n/g, '<br>')}</p>
      `
    })
  });

  if (!r.ok) {
    console.error('Resend error:', await r.text());
    return res.status(500).json({ error: 'Email delivery failed' });
  }

  res.status(200).json({ ok: true });
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
