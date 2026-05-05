============================================================
  CASANOVA - AGENȚIE IMOBILIARĂ PREMIUM
  Website frontend complet (HTML5, CSS3, Vanilla JavaScript)
============================================================

DESCRIERE
---------
Website pentru o agenție imobiliară modernă din România,
construit cu 4 fluxuri complet separate de navigare:

  1. REZIDENȚIAL (Vânzare & Închiriere)
     Apartamente, case, vile, duplex-uri.
     Calculator rate ipotecare, hartă școli/transport.

  2. COMERCIAL (Vânzare & Închiriere)
     Birouri, retail, depozite, hale, showroom-uri.
     Fișă tehnică detaliată, specificații B2B.

  3. TERENURI
     Intravilan, extravilan, agricol, industrial.
     Regim juridic (CUT/POT, PUG), utilități, plan cadastral.

  4. PROIECTE REZIDENȚIALE NOI
     Ansambluri în pre-vânzare / construire / finalizate.
     Tabel unități cu filtrare internă, plan plată,
     timeline construcție, formular interes.

Fiecare flux are:
  - propriul limbaj vizual (accent de culoare distinct)
  - filtre specifice
  - template de card adaptat
  - pagină detaliu cu informații relevante doar pentru
    acel tip de utilizator

============================================================

STRUCTURA PROIECTULUI
----------------------

  /project
  ├── /css
  │   ├── main.css          # stiluri globale, navbar, footer
  │   ├── homepage.css      # hero, search, sections home
  │   ├── listings.css      # toate paginile de listing
  │   ├── property.css      # toate paginile de detaliu
  │   ├── projects.css      # proiecte noi (listă + detaliu)
  │   ├── about.css         # pagina despre
  │   └── admin.css         # dashboard admin
  │
  ├── /js
  │   ├── main.js           # navbar, footer, utilitare
  │   ├── data.js           # toate datele simulate
  │   ├── homepage.js       # logica tab-uri + filtre home
  │   ├── listings.js       # filtrare/sortare/paginare
  │   ├── property.js       # galerie, calculator, hartă
  │   ├── projects.js       # filtrare proiecte + unități
  │   └── admin.js          # dashboard, formulare dinamice
  │
  ├── /images
  │   ├── /rezidential      # poze proprietăți rezidențiale
  │   ├── /comercial        # poze spații comerciale
  │   ├── /terenuri         # poze terenuri
  │   ├── /proiecte         # randări proiecte + logo dezv.
  │   ├── /team             # poze echipă
  │   └── /logo             # logo agenție
  │
  ├── index.html                  # Homepage
  ├── listings-rezidential.html   # Listă rezidențial
  ├── listings-comercial.html     # Listă comercial
  ├── listings-terenuri.html      # Listă terenuri
  ├── property-rezidential.html   # Detaliu proprietate rez.
  ├── property-comercial.html     # Detaliu spațiu comercial
  ├── property-teren.html         # Detaliu teren
  ├── projects.html               # Listă proiecte noi
  ├── project-detail.html         # Detaliu proiect (unități)
  ├── about.html                  # Despre noi (echipă, valori)
  ├── contact.html                # Contact (formular, hartă)
  ├── admin.html                  # Dashboard admin
  └── readme.txt

============================================================

INSTRUCȚIUNI DE RULARE
-----------------------

OPȚIUNEA 1 - Direct în browser (cea mai simplă):
  1. Dezarhivează fișierul .zip
  2. Deschide folderul /project
  3. Dublu-click pe index.html
  4. Site-ul se va deschide în browser-ul implicit

OPȚIUNEA 2 - Server local (recomandată pentru dezvoltare):

  Cu Python:
    cd project
    python -m http.server 8000
    → http://localhost:8000

  Cu Node.js (npx serve):
    cd project
    npx serve
    → http://localhost:3000

  Cu VS Code:
    Instalează extensia "Live Server"
    Click dreapta pe index.html → "Open with Live Server"

============================================================

ACCES ADMIN
-----------
URL: admin.html
User:  admin
Parolă: admin

(Acces simulat prin localStorage — fără backend real)

============================================================

FUNCȚIONALITĂȚI IMPLEMENTATE
-----------------------------

✓ Filtrare dinamică fără reload în toate listing-urile
✓ Câmpuri de filtre adaptate per categorie (homepage tabs)
✓ Sortare (preț, suprafață, an construcție)
✓ Paginare cu max 6 carduri per pagină
✓ Căutare din homepage cu query string params
  (ex: listings-rezidential.html?regim=vanzare&camere=3)
✓ Slideshow galerie pe paginile de detaliu
✓ Calculator rate ipotecare cu formula reală
  (rezidențial - vânzare)
✓ Filtrare unități în interiorul unui proiect
✓ Counters animate la scroll (pagina About)
✓ Admin login simulat prin localStorage
✓ Formular admin cu câmpuri dinamice pe categorie
✓ Validare formulare pe client
✓ Responsive complet (mobile + tablet + desktop)
✓ Navbar mobil cu meniu hamburger

============================================================

DESIGN
-------
- Paletă: alb / gri deschis + navy închis (#0f1b2d)
  + gold ca accent (#c9a04a)
- Fiecare flux are accent de culoare distinct:
    Rezidențial → terracota cald (#c66b3d)
    Comercial   → steel blue (#3e6b8c)
    Terenuri    → verde pădure (#45693d)
    Proiecte    → gold (#c9a04a)
- Font: Inter (body) + Montserrat (headings) - Google Fonts
- Iconițe: Font Awesome 6 via CDN
- Carduri cu shadow, hover smooth, transitions 0.2s
- Light mode

============================================================

DATE SIMULATE
--------------
data.js conține:
  - 10 proprietăți rezidențiale (mix vânzare/închiriere,
    apartamente + case + vile + duplex)
  - 6 proprietăți comerciale (birouri, retail, depozit,
    showroom, industrial)
  - 5 terenuri (mix intravilan/extravilan/industrial)
  - 3 proiecte rezidențiale noi (cu unități individuale,
    timeline, plan plată)
  - 4 agenți cu date complete

Locații realiste din România: București (Herăstrău,
Floreasca, Pipera, Băneasa, Aviației...), Cluj-Napoca,
Brașov, Timișoara, Constanța, Ploiești, Otopeni, Corbeanca.

Prețuri în EUR, conform pieței reale 2024-2026.

============================================================

NOTE TEHNICE
-------------
- Toate paginile folosesc același navbar/footer randat din
  main.js — modificările într-un singur loc se propagă peste
  tot.
- Datele se încarcă o singură dată (data.js) și sunt
  partajate între toate paginile.
- Admin-ul folosește localStorage pentru a persista starea
  de login (fără backend).
- Imaginile sunt placeholder-uri vizuale stilate (nu necesită
  fișiere reale pentru a funcționa). Înlocuiește-le cu poze
  reale în folderul /images/[categorie]/.

============================================================

CONTACT
--------
Pentru întrebări sau personalizări:
  contact@casanova.ro
  +40 21 555 0000

© CasaNova Imobiliare - 2026
============================================================
