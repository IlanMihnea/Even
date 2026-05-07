# EVEN — Setup backend (lead form pe email + admin)

Pas cu pas pentru ca formul de contact și cererile de vizionare să-ți ajungă pe email,
iar admin-ul să fie complet funcțional.

---

## 1. Variabilele de mediu — Vercel

Mergi la **Vercel Dashboard → proiectul Even → Settings → Environment Variables**.
Adaugă următoarele (Production + Preview + Development):

| Nume | Valoare | De unde |
|---|---|---|
| `SUPABASE_URL` | `https://fzlbdfwsejqsdcahwffx.supabase.co` | (e deja în `db.js`) |
| `SUPABASE_SERVICE_KEY` | `eyJ...` (service_role key) | Supabase Dashboard → Project Settings → API → `service_role` secret |
| `RESEND_API_KEY` | `re_xxx...` | https://resend.com → API Keys → Create |
| `OWNER_EMAIL` | `ilan@even-imobiliare.ro` | adresa pe care vrei să primești cererile |

> ⚠️ `SUPABASE_SERVICE_KEY` e cheia **service_role** (nu cea anon). E secret — nu o pune
> niciodată în cod sau pe GitHub. Doar în Vercel env vars.

După ce salvezi, **redeploy proiectul** (sau așteaptă deploy automat de la următorul push).

---

## 2. Resend — verificarea domeniului

Pentru ca emailurile să **NU ajungă în spam**, trebuie să-ți verifici domeniul în Resend.

1. Resend → Domains → Add Domain → `even-imobiliare.ro`
2. Adaugă cele 3 DNS records (SPF, DKIM, MX) la registrarul tău (sau în Vercel DNS dacă domeniul e acolo)
3. Așteaptă verificarea (5-30 min)
4. În `api/leads.js` și `api/contact.js`, schimbă `from: 'EVEN <noreply@even.ro>'` în
   `from: 'EVEN <noreply@even-imobiliare.ro>'`

**Variantă de test rapidă (fără verificare domeniu):**
Pune `from: 'EVEN <onboarding@resend.dev>'` în loc de `noreply@even.ro`. Funcționează
imediat dar emailurile vor fi marcate vizibil ca de testare. Bun pentru proba inițială.

---

## 3. Supabase — schemă & utilizatori

### 3.1 Rulează schema (dacă nu ai făcut-o deja)

Supabase Dashboard → SQL Editor → rulează tot conținutul din [seed/schema.sql](seed/schema.sql).
Asta creează tabelele `agents`, `properties`, `projects`, `project_units`, `leads` + bucket-ul `property-images`.

### 3.2 Creează utilizator admin pentru tine

Supabase Dashboard → Authentication → Users → Add user (Send invite OR Create new):
- Email: `ilan@even-imobiliare.ro` (sau ce vrei tu)
- Password: setează una puternică
- Auto Confirm User: **DA** (altfel nu te poți loga imediat)

Cu această parolă te loghezi pe `/admin.html`.

### 3.3 RLS pentru `leads` (recomandat)

În SQL Editor:

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Anon poate INSERTA (de la formul public)
DROP POLICY IF EXISTS leads_anon_insert ON leads;
CREATE POLICY leads_anon_insert ON leads
  FOR INSERT TO anon WITH CHECK (true);

-- Authenticated (adminul) poate face tot
DROP POLICY IF EXISTS leads_admin_all ON leads;
CREATE POLICY leads_admin_all ON leads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

> Notă: Endpointul `/api/leads` folosește deja `SUPABASE_SERVICE_KEY` care ocolește RLS.
> Politicile de mai sus sunt pentru ca clientul anon (din admin nelogat) să nu vadă lead-urile,
> și pentru ca, dacă vreodată vei migra inserarea direct din browser, să funcționeze.

---

## 4. Cum funcționează lead form-ul acum

```
[Vizitator] → [Formul de pe site] → POST /api/leads → [Vercel function]
                                                          ↓
                                                    INSERT în Supabase `leads` table
                                                          ↓
                                                    Email către OWNER_EMAIL via Resend
                                                          ↓
                                                    [Tu vezi email + lead apare în admin]
```

3 puncte de intrare a lead-urilor:
1. **Pagina contact** (`tip: 'contact'`)
2. **Pagina proprietate** — formul "Programează vizionare" (`tip: 'vizionare'`, cu `property_id`)
3. **Pagina detaliu proiect** — formul "Mă interesează" (`tip: 'oferta'`, cu `project_id`)

Toate ajung în aceeași tabelă `leads`. Le vezi pe toate în **admin → Cereri primite**.

### Fallback automat
Dacă endpointul nu răspunde (ex: Vercel jos, RESEND_API_KEY lipsește), formul salvează
local în `localStorage.even_lead_queue` și afișează un mesaj cu linkul `mailto:` și telefonul.
Lead-urile salvate local se pierd dacă vizitatorul curăță datele browserului — dar
e mai bine decât să pierzi lead-ul cu totul.

---

## 5. Adminul — ce poate face

Login la `https://even-imobiliare.ro/admin.html` (cu emailul/parola din pasul 3.2).

### Cereri primite (leads)
- Vezi toate cererile (cu filtre după status și tip)
- Schimbă status (nou → contactat → vizionare programată → ofertă trimisă → câștigat/pierdut)
- Click "Vezi detalii" → modal cu mesaj complet, opțiuni mailto:/tel:, adăugare notă internă
- Șterge lead-uri vechi
- Counter de "cereri noi" în partea de sus

### Proprietăți (rezidential / comercial / terenuri)
- **Filtre**: search text (titlu/oraș/cartier/ID), regim (vânzare/închiriere), status (active/arhivate/toate), sortare (date, preț, alfabetic)
- Adaugă proprietate nouă cu upload imagini multiple
- Editează — formul se prepopulează, poți adăuga/șterge imagini, asigna agent
- Arhivează (soft delete cu `activ=false`) — proprietatea dispare din site, dar rămâne în admin
- Restaurează din arhivă

### Proiecte rezidențiale
- Adaugă/editează proiecte noi (nume, dezvoltator, status, progres, interval preț, tipuri unități, facilități, imagini)
- Filtre după status și search text
- Arhivează/restaurează

### Agenți
- Adaugă/editează agenți (nume, rol, email, telefon, foto, bio, statistici)
- Asignare agent la proprietăți (din modal-ul de adăugare proprietate)
- Ștergere

---

## 6. Test end-to-end

1. **Test formul de contact:** mergi pe `/contact.html`, completează formul, trimite.
   - În admin → Cereri primite ar trebui să apară lead-ul (max 5 secunde)
   - În inbox-ul tău (`OWNER_EMAIL`) ar trebui să primești emailul de notificare

2. **Test formul de vizionare:** mergi pe orice listing → click pe propietate → completează "Programează vizionare".
   - Lead-ul apare în admin cu `tip: vizionare` + linkat la proprietate

3. **Test admin filtre:** în admin tab Rezidențial, scrie în search "floreasca". Lista trebuie să se filtreze instant.

Dacă **nu primești emailul** dar lead-ul apare în admin: e problema cu `RESEND_API_KEY` sau domeniul ne-verificat. Verifică **Vercel → Logs** pe `/api/leads` pentru erori.

Dacă **nu apare nici lead-ul în admin**: e problemă cu `SUPABASE_SERVICE_KEY` sau `SUPABASE_URL`. Aceeași zonă de logs.

---

## 7. Backup periodic (recomandat)

Supabase free tier face backup automat 7 zile. Dacă vrei mai mult, poți rula manual:

```bash
# Export tabela leads ca CSV
psql "postgresql://postgres:PWD@db.xxx.supabase.co:5432/postgres" \
  -c "\COPY (SELECT * FROM leads ORDER BY created_at DESC) TO 'leads-backup.csv' CSV HEADER"
```

Sau export din Supabase Dashboard → Table Editor → leads → Export.

---

## Întrebări frecvente

**Q: De ce nu primesc emailul deși apare lead-ul în admin?**
A: Resend nu e configurat. Verifică `RESEND_API_KEY` în Vercel env vars. După `vercel env add` trebuie redeploy.

**Q: Ce e Resend? Trebuie să plătesc?**
A: Resend = serviciu de trimis emailuri tranzacționale. Free tier: 3.000 emailuri/lună, 100/zi. Suficient pentru tine pe termen lung.

**Q: Pot folosi Gmail în loc de Resend?**
A: Tehnic da (SMTP), dar nu recomand. Resend e standard, nu cere parola Gmail-ului tău, nu pică în spam, are dashboard cu istoric.

**Q: Dacă pierd cheile API, ce fac?**
A: Resend → Regenerate. Supabase → Reset service_role. Apoi update în Vercel env vars + redeploy.
