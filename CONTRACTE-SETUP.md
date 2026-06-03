# EVEN — Tool de semnare contracte · Setup

Fluxul: creezi un contract cu N semnatari → fiecare primește **linkul lui** pe email →
semnează independent (în paralel) → când au semnat toți, se generează **un singur PDF**
cu toate semnăturile + audit per persoană și ajunge la fiecare pe email.

---

## 1. Rulează schema în Supabase

Supabase Dashboard → **SQL Editor** → lipește conținutul din
[`supabase/contracts-schema.sql`](supabase/contracts-schema.sql) → **Run**.

Creează: tabelele `contracts` + `contract_signers`, RLS, și bucketul privat `signed-contracts`.
> Asigură-te că proiectul Supabase e în regiune **EU** (GDPR).

## 2. Variabile de mediu (Vercel → Settings → Environment Variables)

Cele de bază le ai deja de la formularul de lead-uri. În plus, util:

| Nume | Rol | Obligatoriu |
|---|---|---|
| `SUPABASE_URL` | deja setat | da |
| `SUPABASE_SERVICE_KEY` | deja setat (service_role) | da |
| `RESEND_API_KEY` | trimite emailurile | pentru email |
| `RESEND_FROM` | ex. `EVEN <contracte@even-imobiliare.ro>` | recomandat |
| `OWNER_EMAIL` | primești și tu copia semnată | recomandat |
| `PUBLIC_BASE_URL` | ex. `https://even-imobiliare.ro` — baza linkurilor din email | opțional* |

\* Dacă nu îl setezi, linkul se construiește din domeniul cererii (merge oricum pe Vercel).

## 3. Endpoint-urile (deja în `/api`)

| Endpoint | Cine | Ce face |
|---|---|---|
| `POST /api/contracts-create` | admin (Bearer token Supabase) | creează contractul + semnatarii, trimite linkurile |
| `GET /api/contracts-get?token=` | public | alimentează pagina de semnare |
| `POST /api/contracts-sign` | public | salvează semnătura; la ultimul → generează PDF + email |

Pagina de semnare: `/sign.html?token=...`

## 4. Test rapid fără UI de admin (până construim secțiunea din dashboard)

În **SQL Editor** creează un contract de probă și ia tokenii:

```sql
with c as (
  insert into contracts (status, title, data)
  values ('sent', 'Contract de intermediere imobiliară',
    '{"meta":{"nr":"2026-014","data":"03.06.2026","subtitle":"— mandat de vânzare —"},
      "terms":{"pret":"350.000 EUR","durata":"6 luni"}}'::jsonb)
  returning id
)
insert into contract_signers (contract_id, position, role, name, email)
select c.id, v.position, v.role, v.name, v.email
from c, (values
  (1, 'Proprietar', 'Brotnei Alexa', 'alexa@example.com'),
  (2, 'Soție', 'Brotnei Maria-Florentina', 'maria@example.com')
) as v(position, role, name, email)
returning token, role, name;
```

Deschide `https://<domeniul-tău>/sign.html?token=<TOKEN_1>` și semnează; apoi la fel cu
`<TOKEN_2>`. După al doilea, PDF-ul semnat se generează și se trimite pe email.

> Notă: `data.sections` (textul clauzelor) e completat automat de `/api/contracts-create`.
> La inserarea manuală de mai sus, pagina/PDF-ul folosesc clauzele implicite din
> [`api/_contracts/content.js`](api/_contracts/content.js).

## Următorul pas
Secțiunea **„Contracte"** în `admin.html`: formular de creare (semnatari + termeni) care
apelează `/api/contracts-create`, plus listă cu statusul fiecărui contract și download PDF.
