// ============================================
// CONTACT.JS
// ============================================

async function submitContact(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const feedback = document.getElementById('contactFeedback');
  const data = Object.fromEntries(new FormData(form).entries());

  btn.disabled = true;
  btn.innerHTML = '<span>Se trimite...</span>';
  feedback.classList.remove('is-error', 'is-success');
  feedback.style.display = 'none';

  const payload = {
    nume: data.nume,
    email: data.email,
    telefon: data.telefon || null,
    mesaj: `${data.subiect ? '[' + data.subiect + ']\n\n' : ''}${data.mesaj || ''}`,
    tip: 'contact',
    sursa: 'website'
  };

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || 'Eroare server');
    }
    feedback.classList.add('is-success');
    feedback.style.display = 'block';
    feedback.textContent = 'Mulțumesc! Te contactez în maxim 2 ore lucrătoare.';
    form.reset();
  } catch (err) {
    try {
      const queue = JSON.parse(localStorage.getItem('even_lead_queue') || '[]');
      queue.push({ ...payload, created_at: new Date().toISOString() });
      localStorage.setItem('even_lead_queue', JSON.stringify(queue));
    } catch (_) {}
    feedback.classList.add('is-error');
    feedback.style.display = 'block';
    feedback.innerHTML = 'Nu am putut trimite mesajul automat. Te rog scrie-mi direct: <a href="mailto:ilan@even-imobiliare.ro?subject=' + encodeURIComponent(data.subiect || 'Contact') + '&body=' + encodeURIComponent(data.mesaj || '') + '">ilan@even-imobiliare.ro</a> sau <a href="tel:0745609366">0745 609 366</a>.';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Trimite mesajul</span><i class="fa-solid fa-arrow-right"></i>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('ctMap');
  if (!el || typeof L === 'undefined') return;
  const lat = 44.4607, lng = 26.0966;
  el.innerHTML = '';
  const map = L.map(el, { scrollWheelZoom: false }).setView([lat, lng], 15);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap, &copy; CARTO'
  }).addTo(map);
  const icon = L.divIcon({
    className: '',
    html: '<div style="width:32px;height:32px;border-radius:50%;background:#1C2340;border:3px solid #F5F3EE;box-shadow:0 6px 16px rgba(28,35,64,0.4);display:flex;align-items:center;justify-content:center"><span style="width:8px;height:8px;border-radius:50%;background:#C8A96E"></span></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
  L.marker([lat, lng], { icon }).addTo(map)
    .bindPopup('<strong>EVEN</strong><br>Banul Antonache 71, Floreasca');
});
