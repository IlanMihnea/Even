# Plan de îmbunătățire frontend — EVEN

> Document de implementare. Fiecare subpunct conține tehnica exactă, fișierele afectate
> și criteriul de verificare. Fazele sunt independente — pot fi implementate în orice
> ordine, dar ordinea de mai jos e cea recomandată. **Implementează o fază pe commit.**

---

## Context proiect (citește înainte de a explora)

- **Stack:** site static multi-pagină în `project/` (HTML + CSS + JS vanilla, fără framework,
  fără build step). Deploy pe **Vercel** (`vercel.json` → `outputDirectory: "project"`).
  Date din **Supabase** (client public în `project/js/db.js`, anon key — e OK că e publică).
- **API serverless:** `api/*.js` (CommonJS, `module.exports = handler`). Client Supabase cu
  service key în `api/_supabase.js` — refolosește-l, nu crea altul.
- **Pagini publice:** `index.html`, `listings-{rezidential,comercial,terenuri}.html`,
  `property-{rezidential,comercial,teren}.html`, `projects.html`, `project-detail.html`,
  `about.html`, `contact.html`, `favorite.html`, `terms.html`, `privacy.html`, `404.html`.
- **JS:** `js/main.js` (navbar/footer injectate la runtime, favorite, utilitare),
  `js/homepage.js`, `js/listings.js`, `js/property.js`, `js/projects.js`, `js/db.js`.
- **CSS:** `css/main.css` (global + variabile brand), `css/animations.css`, plus câte un
  fișier per pagină (`homepage.css`, `listings.css`, `property.css`, …).
- **Brand (respectă strict):** midnight `#1C2340`, sage `#7A9B92`, gold `#C8A96E` (folosit
  RAR), fundal linen `#F1F0EC`. Fonturi: Cormorant Garamond (headings), DM Sans (body),
  Mrs Saint Delafield (signature). **Italic doar pe un cuvânt-cheie, niciodată pe titluri
  întregi. Nu adăuga galben/gold suplimentar.**
- **Gotcha deploy:** apex-ul `even-imobiliare.ro` face 308 → `www`; redirectul strică
  preflight CORS la POST — orice fetch din frontend către API se face pe același origin
  (path relativ `/api/...`), nu pe URL absolut.
- **Migrații DB:** schema se schimbă rulând manual fișiere din `seed/` în Supabase SQL
  editor. Dacă o fază cere coloane noi, scrie fișierul SQL în `seed/` și fă codul
  rezilient la absența coloanei (vezi pattern `geoColumnsExist()` din `db.js`).
- **Nu atinge:** `admin*.html/js/css`, `sign.*`, `banner.*`, `brochure.html`,
  `prezentare.html`, `api/contracts-*` — sunt în afara scope-ului acestui plan.

---

## FAZA 1 — Quick wins (SEO de bază + igienă)

### 1.1 `robots.txt`
Creează `project/robots.txt`:
```
User-agent: *
Allow: /
Disallow: /admin.html
Disallow: /banner.html
Disallow: /prezentare.html
Disallow: /sign.html
Disallow: /brochure.html
Sitemap: https://even-imobiliare.ro/sitemap.xml
```

### 1.2 `sitemap.xml` dinamic
Creează `api/sitemap.js` (handler GET) care:
1. Citește din Supabase (`require('./_supabase')`): `properties` cu `activ = true`
   (select `id, categorie`) și `projects` cu `activ = true` (select `id`).
2. Generează XML cu: paginile statice (index, cele 3 listings, projects, about, contact,
   terms, privacy) + câte un URL per proprietate
   (`property-rezidential.html?id=…`, `property-comercial.html?id=…`,
   `property-teren.html?id=…` — atenție: categoria `terenuri` → pagina `property-teren.html`)
   + `project-detail.html?id=…` per proiect.
3. `res.setHeader('Content-Type', 'application/xml')` și
   `res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')`.

În `vercel.json` adaugă rewrite: `{ "source": "/sitemap.xml", "destination": "/api/sitemap" }`.

### 1.3 `og:image` global
1. Generează un still 1200×630 din materialul hero: ia un frame din
   `project/design/landscape.mp4` sau folosește `project/design/hero-mobile.jpg`
   re-crop-uit la 1200×630 cu `sharp` (e în dependencies — scrie un one-off
   `scripts/gen-og-image.js`, rulează-l, apoi commit-uie doar PNG/JPG-ul rezultat în
   `project/design/og-default.jpg`, țintește < 200 KB).
2. În TOATE paginile publice (lista din Context), adaugă în `<head>`:
```html
<meta property="og:image" content="https://even-imobiliare.ro/design/og-default.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
```
   Pe paginile care nu au deja `og:title`/`og:description`, adaugă-le (copiază din
   `meta name="description"` existent).

### 1.4 Fix numerotare capitole homepage
În `project/index.html` secțiunile sar de la „Nº III" la „Nº V" (nu există Nº IV).
Renumerotează: `hp-process` → Nº IV, `hp-figures` → Nº V, `hp-voices` → Nº VI.
Caută stringurile `— Nº V —`, `— Nº VI —`, `— Nº VII —` și decalează-le cu unu înapoi.

### 1.5 Linkuri moarte în footer
În `js/main.js`, `renderFooter()`:
- Social: `href="#"` la Facebook/Instagram/LinkedIn/YouTube. **Întreabă owner-ul de
  URL-uri reale înainte**; dacă nu există, șterge ancorele fără URL (nu le lăsa pe `#`).
- „Carieră" (`href="#"`): șterge elementul `<li>`.

### 1.6 Un singur loc de încărcare fonturi
1. În `project/css/main.css` linia ~5: **șterge `@import url('https://fonts.googleapis.com/...')`**
   (blochează randarea și încarcă un set diferit de familii, inclusiv Syne).
2. Verifică cu grep dacă `Syne` e folosit undeva în CSS (`font-family.*Syne`). Dacă da,
   adaugă `Syne` în `<link>`-ul de fonturi DOAR pe paginile care îl folosesc; dacă nu,
   nu-l încărca deloc.
3. Asigură-te că TOATE paginile publice au, înaintea link-ului de fonturi:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```
   (index.html le are deja; listings/property/etc. nu).

### 1.7 Card hero fără proprietate fictivă
În `project/index.html`, cardul static din `#hpHeroFeature` (Nº 042, „Apartament
Herăstrău", 185.000 €) e o ofertă inventată, vizibilă când nu există `home_hero` în DB.
Înlocuiește conținutul static al cardului cu o stare neutră, același markup/stil
(`hp-feature-card`), fără preț și fără link: eyebrow „Selecția EVEN", titlu
„Săptămâna aceasta alegem o proprietate de pus în ramă.", footer „În curând".
`renderHeroFeature()` din `homepage.js` îl suprascrie oricum când există date — nu
modifica JS-ul.

### 1.8 Headers de securitate + cache în `vercel.json`
Adaugă cheia `headers`:
```json
"headers": [
  {
    "source": "/(.*)",
    "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
    ]
  },
  {
    "source": "/(css|js|design|images)/(.*)",
    "headers": [
      { "key": "Cache-Control", "value": "public, max-age=86400, stale-while-revalidate=604800" }
    ]
  }
]
```
NU adăuga CSP încă (există handler-e inline `onclick` — vine în Faza 5).
Atenție: `sign.html` se încarcă posibil în context extern — dacă pagina de semnare
contract e deschisă din email direct, `SAMEORIGIN` e OK (nu e iframe). Nu bloca nimic
pe `/p/:token` (prezentare) — verifică după deploy că share link-urile merg.

### 1.9 Șterge fișierele `.backup` din `project/`
`project/` se publică integral pe Vercel — `index.html.backup`, `*.css.backup`,
`*.js.backup` (10 fișiere) sunt accesibile public. Șterge-le din repo (sunt în git
history dacă mai trebuie vreodată).

**Verificare Faza 1:** `vercel dev` sau deploy preview → `/robots.txt` și `/sitemap.xml`
răspund; share-debugger (opengraph.xyz) pe homepage arată imaginea; nu mai există
request dublu la fonts.googleapis.com în Network tab.

---

## FAZA 2 — Performanță media

### 2.1 Video hero: de la 17.7 MB la ≤ 5 MB
`project/design/landscape.mp4` are 17.71 MB și `preload="auto"`. Pașii:
1. Re-encodare cu ffmpeg (dacă nu e instalat: `winget install ffmpeg`):
```
ffmpeg -i project/design/landscape.mp4 -vf "scale=1600:-2" -c:v libx264 -crf 28 -preset slow -g 12 -an -movflags +faststart project/design/landscape-web.mp4
```
   - `-g 12` = keyframe la fiecare 12 frame-uri — esențial pentru scrub fluid pe
     `currentTime` (homepage.js `initHeroScrub()`).
   - `-an` elimină audio (e muted oricum).
   - Țintă: ≤ 5 MB. Dacă iese peste, crește CRF la 30 sau scade la `scale=1280:-2`.
2. În `index.html` schimbă `<source src="design/landscape.mp4">` →
   `design/landscape-web.mp4` și `preload="auto"` → `preload="metadata"`.
3. În `homepage.js`, `initHeroScrub()`, pe ramura desktop: înainte de `ensureLoaded`,
   declanșează buffering complet abia la primul scroll sau după `window.load`:
   `video.preload = 'auto'; video.load();` o singură dată (flag). Scrub-ul cere video
   buffer-uit; până atunci ține primul frame ca poster (adaugă atribut
   `poster="design/hero-poster.jpg"` — extrage frame 0 cu
   `ffmpeg -i landscape-web.mp4 -frames:v 1 hero-poster.jpg`, comprimă < 150 KB).
4. Păstrează `landscape.mp4` original în `project/design/` doar dacă e referit din alte
   pagini (grep întâi); altfel șterge-l (există backup `landscape-original-backup.mp4`).

### 2.2 Pipeline thumbnails imagini proprietăți
Imaginile urcate din admin se servesc raw (3–5 MB) în carduri de 400px.
**Soluția cu schimbări minime** — transformare la upload, în `project/js/db.js`,
funcția `uploadPropertyImages()`:
1. Înainte de `.upload(...)`, redimensionează client-side cu canvas:
   - max 1920px latura mare, JPEG quality 0.82 → varianta „full" (path existent).
   - max 800px → varianta „card", path `${propertyId}/card-<același-nume>`.
   Scrie un helper `resizeImage(file, maxW, quality) → Promise<Blob>` (createImageBitmap
   + canvas.toBlob). Fără librării noi.
2. Returnează array de obiecte sau păstrează contractul actual (array de URL-uri full)
   și derivă URL-ul de card prin convenție de nume: în renderers, funcție
   `cardImageUrl(url)` care inserează `card-` în path; dacă imaginea e veche (fără
   variantă card), `onerror` pe `<img>` face fallback la URL-ul full:
   `onerror="this.onerror=null;this.src='<full>'"`.
3. **Nu modifica schema DB.** Imaginile vechi rămân funcționale prin fallback.

### 2.3 `width`/`height` pe imaginile din carduri (CLS)
În toate funcțiile care generează `<img>` pentru carduri — `homepage.js`
(`homePropPhoto`, `renderHomePropCard`, `projectCardHTML`), `listings.js` (`cardPhoto`),
`projects.js` — adaugă `width="800" height="600"` (sau raportul real al containerului;
verifică aspect-ratio-ul din `listings.css` `.prop-card-img` întâi) + CSS existent
`object-fit: cover` rămâne. Scop: browserul rezervă spațiul, dispare layout shift.

### 2.4 Font Awesome → subset SVG self-hosted
1. Inventariază iconurile: `grep -ohrE 'fa-[a-z-]+' project/*.html project/js/*.js | sort -u`
   (exclude admin/sign/banner dacă vrei scope mic — dar ele folosesc același CDN; ideal
   înlocuiește tot ce e public și lasă CDN-ul doar pe admin).
2. Creează `project/css/icons.css` cu clase `.fa-solid.fa-<nume>` implementate ca
   mask-image SVG inline (data URI) sau un sprite SVG `project/design/icons.svg` cu
   `<symbol>`-uri + helper. **Alternativă mai simplă și acceptabilă:** păstrează Font
   Awesome dar încarcă doar fișierul `solid.min.css` + `brands.min.css` și subsetul de
   webfont nu se poate tăia ușor de pe CDN — deci dacă subsetarea ia mai mult de ~1h,
   fă varianta sprite SVG (descarcă SVG-urile oficiale FA Free pentru iconurile din
   inventar, sunt MIT pentru solid/brands free).
3. Înlocuirea `<i class="fa-solid fa-...">` se face cu sed/replace global pe pattern,
   păstrând markup identic dacă folosești varianta mask-image (clasele rămân aceleași,
   doar CSS-ul se schimbă) — **preferă varianta asta: zero modificări HTML/JS.**
4. Șterge `<link ... font-awesome ... >` din paginile publice.

### 2.5 Build step minimal (minificare + concatenare)
1. `npm i -D esbuild`.
2. Script `scripts/build-assets.js`: minifică fiecare CSS din `project/css/` și JS din
   `project/js/` **in-place într-un director de output** — NU în-place peste surse.
   Strategie fără să rupi nimic: output în `project/` ca `*.min.css`/`*.min.js` ar cere
   modificarea tuturor referințelor. **Mai simplu și suficient:** lasă Vercel să facă
   compresia (brotli e automat) și fă DOAR concatenarea CSS pe homepage:
   - homepage încarcă 5 CSS-uri (`main`, `animations`, `listings`, `homepage`, `projects`).
   - Verifică cu grep câte din regulile `listings.css`/`projects.css` sunt chiar folosite
     pe index (cardurile inline). Dacă da, lasă-le — 5 request-uri HTTP/2 nu sunt
     problema reală; minificarea e nice-to-have.
   **Decizie:** implementează minificarea doar dacă punctele 2.1–2.4 sunt gata și mai
   rămâne timp. Prioritatea fazei e media, nu CSS-ul de 115 KB.

### 2.6 Elimină fetch-ul dublu pe homepage
În `project/js/homepage.js`, `renderFeaturedProperties()` cheamă direct
`getProperties('rezidential')`, iar tab-ul inline folosește cache-ul
`loadHomeProperties('rezidential')`. Schimbă `renderFeaturedProperties()` să folosească
`const props = await loadHomeProperties('rezidential')`. Un singur request, același
rezultat.

**Verificare Faza 2:** Lighthouse pe homepage (mobil + desktop) înainte/după —
LCP și Total Byte Weight trebuie să scadă vizibil; scrub-ul video rămâne fluid la
scroll lent; cardurile nu mai produc layout shift (CLS ~0).

---

## FAZA 3 — SEO structural (cel mai mare impact de business)

### 3.1 Meta tags server-side pentru paginile de proprietăți
**Problema:** `property-*.html?id=X` servește titlu generic; share pe WhatsApp/Facebook
arată „Detaliu proprietate · EVEN" fără poză. Crawlerele sociale NU execută JS.

**Soluția — funcție Vercel care injectează meta în HTML-ul existent:**
1. Creează `api/og-property.js`:
   - primește `req.query.page` (rezidential|comercial|teren) și `req.query.id`;
   - citește proprietatea din Supabase (refolosește `api/_supabase.js`; mapare
     categorie→câmpuri ca în `api/property.js`);
   - citește fișierul HTML static corespunzător de pe disc
     (`fs.readFileSync(path.join(process.cwd(), 'project', 'property-' + page + '.html'))`
     — adaugă `"includeFiles": "project/property-*.html"` la funcție în `vercel.json`);
   - înlocuiește în string: `<title>...</title>` → `{titlu} · {pret formatat} · EVEN`,
     `meta description` → primele ~150 caractere din `descriere`, adaugă înainte de
     `</head>`: `og:title`, `og:description`, `og:image` (= `imagini[0]` sau
     og-default), `og:url`, `link rel=canonical` cu URL-ul complet;
   - **escape HTML pe toate valorile interpolate** (`&<>"'`);
   - `Cache-Control: s-maxage=600, stale-while-revalidate=86400`;
   - dacă proprietatea nu există / `activ=false` → servește HTML-ul nemodificat cu
     status 200 (JS-ul afișează deja starea „negăsit").
2. În `vercel.json`, rewrites (ÎNAINTEA celor existente nu contează, sunt pe path-uri diferite):
```json
{ "source": "/property-rezidential.html", "destination": "/api/og-property?page=rezidential" },
{ "source": "/property-comercial.html",  "destination": "/api/og-property?page=comercial" },
{ "source": "/property-teren.html",      "destination": "/api/og-property?page=teren" }
```
   Query string-ul original (`?id=…`) se propagă automat la rewrites pe Vercel; `id`
   ajunge în `req.query.id`. **Testează asta explicit pe un preview deploy.**
3. Frontend-ul nu se schimbă deloc — JS-ul continuă să randeze conținutul.

### 3.2 JSON-LD structured data
1. **Homepage (`index.html`)** — static în `<head>`, `RealEstateAgent`:
```html
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"RealEstateAgent",
 "name":"EVEN Imobiliare","url":"https://even-imobiliare.ro/",
 "logo":"https://even-imobiliare.ro/design/logomark-even.svg",
 "telephone":"+40745609366","email":"ilan@even-imobiliare.ro",
 "address":{"@type":"PostalAddress","streetAddress":"Banul Antonache 71",
  "addressLocality":"București","addressCountry":"RO"},
 "openingHours":"Mo-Fr 09:00-19:00"}
</script>
```
2. **Paginile de proprietăți** — în `api/og-property.js` (punctul 3.1), injectează și un
   bloc JSON-LD `Product` + `Offer` (price, priceCurrency EUR, availability) sau
   `RealEstateListing`. Folosește `JSON.stringify` pe obiect construit, nu concatenare
   manuală — previne breakage la ghilimele din titluri.
3. **Listings** — `BreadcrumbList` static per pagină (2 elemente: Acasă → Categorie).

### 3.3 URL-uri cu slug (opțional, după 3.1–3.2)
1. Rewrite în `vercel.json`: `{ "source": "/proprietate/:slug", "destination": "/api/og-property?slug=:slug" }`.
2. Convenție slug: `<kebab(titlu)>--<id>` (id-ul după separator dublu; parsezi cu
   `slug.split('--').pop()`). Nu trebuie coloană nouă în DB.
3. `api/og-property.js` acceptă și `slug`, extrage id-ul, servește același HTML; adaugă
   `<link rel="canonical">` către forma cu slug.
4. În renderers (carduri + sitemap), generează link-urile noi; păstrează vechile
   `property-*.html?id=` funcționale (sunt deja indexate/share-uite).
5. Fă-o DOAR dacă 3.1 e live și verificat.

### 3.4 Navbar/footer statice în HTML
Navbar-ul și footer-ul sunt injectate din `js/main.js` la `DOMContentLoaded` — linkurile
interne nu există în HTML-ul brut.
**Tehnică fără build step:** scrie `scripts/inline-chrome.js` (Node, rulat manual la
schimbarea meniului) care:
1. Conține template-ul navbar/footer (mutat din `main.js`);
2. Pentru fiecare HTML public, înlocuiește conținutul dintre markeri
   `<header id="navbar" class="navbar">...</header>` și
   `<footer id="footer" class="footer">...</footer>` cu HTML-ul complet, setând clasa
   `active` după `data-page` al fiecărui fișier;
3. În `main.js`: `renderNavbar()`/`renderFooter()` devin no-op dacă elementul are deja
   copii (`if (navbar.children.length) { initNavToggleOnly(); return; }`) — păstrează
   doar atașarea event listeners (toggle mobil, secret knock).
4. Anul din copyright: înlocuiește `${new Date().getFullYear()}` cu anul curent hardcodat
   în template (scriptul îl regenerează) sau lasă un mic JS care îl actualizează.

**Verificare Faza 3:** share un link de proprietate pe WhatsApp (sau opengraph.xyz) —
apare poza + titlul + prețul; Rich Results Test (Google) validează JSON-LD; `view-source`
pe orice pagină arată meniul complet în HTML.

---

## FAZA 4 — Accesibilitate

### 4.1 Tabs catalog (homepage) — ARIA complet + tastatură
În `index.html` (`.hp-catalog-tabs`) și `homepage.js` (`setFluxTab`):
1. HTML: pe fiecare buton adaugă `aria-selected="false"` (true pe cel activ),
   `id="tab-<flux>"`, `aria-controls="fluxFilters"`; pe `#fluxFilters` adaugă
   `role="tabpanel"` și `aria-labelledby` dinamic.
2. `setFluxTab()`: setează `aria-selected` și `tabindex` (`0` activ, `-1` restul).
3. Keyboard: listener `keydown` pe `.hp-catalog-tabs` — ArrowLeft/ArrowRight mută
   focusul și activează tab-ul (pattern „roving tabindex", vezi WAI-ARIA Tabs).

### 4.2 Buton favorite în interiorul linkului (HTML invalid)
Cardurile sunt `<a class="prop-card">` cu `<button class="prop-card-fav">` în interior
(generat în `homepage.js` `buildHomePropCard`/`renderHomePropCard` și `listings.js`
`favBtn`). Restructurare minimă:
1. Wrapper: `<article class="prop-card">` care conține `<a class="prop-card-link">`
   (tot conținutul actual minus butonul) + butonul fav ca sibling poziționat absolut.
2. CSS (`listings.css`): mută stilurile hover/focus de pe `.prop-card` pe wrapper,
   `.prop-card-link { display:block; color:inherit; text-decoration:none; }`,
   `.prop-card-fav` rămâne `position:absolute` față de `.prop-card` (care primește
   `position:relative`).
3. Elimină din butoane `onclick="event.preventDefault();event.stopPropagation();..."` —
   nu mai e nevoie de preventDefault dacă butonul nu mai e în link; lasă
   `onclick="toggleFav(this)"` (sau delegation, vezi 5.3).
4. Aplica în TOATE locurile care generează carduri: `homepage.js`, `listings.js`
   (3 renderers), `favorite.html` (verifică dacă are renderer propriu) și `property.js`
   (secțiunea „similare", grep `prop-card-fav`).

### 4.3 Contrast
În `css/main.css`:
1. Adaugă variabilă `--gold-ink: #8A6D3B;` (gold „de cerneală", AA pe linen pentru text
   mare). Schimbă regula `h1 em, h2 em, .highlight { color: var(--gold) }` →
   `var(--gold-ink)` **doar în context light**; pe secțiunile dark (`.hp-figures`,
   footer) gold-ul existent rămâne (acolo contrastul e OK).
   Atenție la memoria de brand: „mai puțin galben" — un gold mai închis e în direcția
   dorită, dar NU schimba `--gold` global (e folosit pe dark și pe butoane).
2. Texte mici `--gray-400 (#9a9590)` pe linen → folosește `--gray-500` unde fontul
   e sub 18px (breadcrumbs, note). Grep `var(--gray-400)` și evaluează caz cu caz.
3. Verifică cu un contrast checker perechile: midnight/linen (OK), sage/linen
   (doar decorativ, nu text), stone pe midnight (OK).

### 4.4 Skip-link, focus, reduced-motion, scroll-lock
1. **Skip-link:** primul element în `<body>` pe fiecare pagină publică:
   `<a class="skip-link" href="#main">Sari la conținut</a>` + `id="main"` pe containerul
   principal. CSS în `main.css`: vizibil doar la focus (pattern standard
   `position:absolute; top:-40px; … :focus { top:8px }`).
2. **Cookie banner:** în `main.js` `initCookieBanner()`, după `appendChild` dă focus pe
   butonul „Am înțeles" DOAR dacă utilizatorul nu interacționează deja (compromis:
   nu fura focusul la load; suficient să adaugi `aria-live="polite"` pe banner în loc
   de focus forțat).
3. **Reduced motion global:** la finalul `css/animations.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  html { scroll-behavior: auto; }
}
```
4. **Scroll-lock meniu mobil:** în `main.js`, la toggle: `document.body.style.overflow =
   isOpen ? 'hidden' : ''`. Și închide meniul la click pe un link (deja navighează, dar
   pe ancore din aceeași pagină rămâne deschis).

**Verificare Faza 4:** navigare completă cu Tab pe homepage (tabs operabile cu săgeți,
fav-urile focusabile separat de card); Lighthouse Accessibility ≥ 95; axe DevTools fără
erori critice.

---

## FAZA 5 — Igienă de cod & securitate

### 5.1 `escapeHtml()` global
1. În `js/main.js` adaugă (copiat din `brochure.html`, care îl are deja):
```js
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
```
2. Aplică-l pe TOATE valorile din DB interpolate în template literals care ajung în
   `innerHTML`: în `homepage.js` (titlu, cartier, oras, dezvoltator, nume…),
   `listings.js`, `property.js`, `projects.js`. Regulă practică: orice `${p.…}` sau
   `${a.…}` care e text (nu număr formatat de noi, nu enum mapat prin obiect local)
   se împachetează în `escapeHtml()`. Atributele (`alt="${...}"`, `aria-label`) la fel.
   URL-urile de imagini: nu escapa, dar pune-le între ghilimele simple cu
   `encodeURI`-sanity (există deja pattern `replace(/'/g,'%27')` în homepage.js).
3. NU atinge `brochure.html` (deja corect) și nici admin-ul (alt scope).

### 5.2 Modul comun de carduri
1. Creează `project/js/cards.js` cu: `escapeHtml` (sau importă-l din main — sunt
   scripturi clasice, deci doar ordine de încărcare), `shortPropNum`, `cardPhoto`,
   `favBtn`, `renderRezCard`, `renderComCard`, `renderTerCard`, `projectCardHTML`,
   `formatStatus`, `formatLivrare`, `pricePerSqm`.
2. `homepage.js` și `listings.js` le șterg pe ale lor și folosesc varianta comună.
   Diferențele dintre `renderHomePropCard` și `renderRezCard` sunt mici — unifică pe
   varianta din listings (verifică ambele întâi cu diff vizual pe clase CSS).
3. Adaugă `<script src="js/cards.js">` în `index.html`, `listings-*.html`,
   `favorite.html` ÎNAINTE de scriptul de pagină. Verifică și `property.js`
   (secțiunea similare) dacă poate refolosi.
4. Criteriu: zero schimbare vizuală — compară screenshot before/after.

### 5.3 Eliminare handler-e inline → event delegation
1. Grep `onclick=` în `project/js/{main,homepage,listings,property,projects}.js` și
   `project/*.html` (exclus admin/sign/banner).
2. Pattern de înlocuire: un singur listener delegat în `main.js`:
```js
document.addEventListener('click', e => {
  const fav = e.target.closest('.prop-card-fav');
  if (fav) { toggleFav(fav); return; }
  // alte acțiuni delegate: [data-action="..."] → handler
});
```
   Pentru butoane cu funcții specifice (`searchFlux()`, `acceptCookies()`), înlocuiește
   `onclick` cu `data-action="search-flux"` etc. și rutează prin delegation.
3. După ce nu mai există inline handlers pe paginile publice, adaugă CSP în
   `vercel.json` DOAR pe paginile publice (header pe `/(.*)`  ar strica admin-ul care
   încă are inline handlers — fie excluzi admin-ul prin source pattern, fie folosești
   CSP `Report-Only` o săptămână înainte):
```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org; connect-src 'self' https://*.supabase.co; media-src 'self'; frame-ancestors 'self'
```
   Notă: scriptul inline de reveal din `index.html` (linia ~497) trebuie mutat în
   `homepage.js` ca CSP-ul să nu ceară `unsafe-inline` pe scripts. La fel orice
   `<script>` inline cu `LISTING_CONFIG`/`PROPERTY_PAGE` — mută config-ul în
   `data-*` pe `<body>` (ex. `data-listing-category="rezidential"`) și citește-l din JS.

**Verificare Faza 5:** toate paginile publice funcționează identic (favorite, search,
tabs, cookie banner); consola fără erori CSP; un titlu de test cu `<script>` în el
randat ca text, nu executat.

---

## FAZA 6 — UX polish (opțional)

### 6.1 Intrare vizibilă pentru Favorite
În `renderNavbar()` (`main.js`): adaugă înaintea butonului Contact un link-icon
`<a href="favorite.html" class="nav-fav" aria-label="Favorite">` cu inimă + badge
counter (`getFavs().length`; ascuns când e 0). Actualizează badge-ul în `toggleFav()`
(emite un mic update direct, funcțiile sunt în același fișier… `toggleFav` e în main.js
— perfect). CSS în `main.css`, discret: icon outline midnight, badge mic sage.
Adaugă și în meniul mobil un rând „Favorite (n)".

### 6.2 Dedupe cifre de trust pe homepage
În `index.html`, șterge blocul `.hp-hero-trust` din hero (50+ / 3 ani apar din nou în
secțiunea „În cifre"). Verifică spacing-ul hero după ștergere (clasa `hp-enter-5`
rămâne nefolosită — OK).

### 6.3 Empty-state listings cu CTA
În `listings.js`, unde se randează „niciun rezultat" (grep `length === 0` /
`results-count`), îmbogățește: text scurt + buton `btn btn-outline` către
`contact.html?subiect=cautare` cu mesaj „Spune-ne ce cauți — îți trimitem selecția
personalizată." (contact.html are select de subiect; nu trebuie prefill, e suficient
linkul simplu).

### 6.4 Skeleton loaders pentru inline results
În `homepage.js` `renderInlineResults()`: înlocuiește `'<div class="flux-inline-loading">
Se încarcă…</div>'` cu 4 carduri skeleton folosind clasele EXISTENTE din `main.css`
(`.skeleton-card`, `.skeleton-img`, `.skeleton-line`) + un shimmer CSS dacă nu există
deja în `animations.css` (grep `skeleton` întâi).

---

## Ordine recomandată și dependențe

| Ordine | Faza | Dependențe | Notă |
|--------|------|-----------|------|
| 1 | Faza 1 | — | tot quick-wins, un commit |
| 2 | Faza 3.1 + 3.2 | 1.3 (og-default ca fallback) | cel mai mare impact business |
| 3 | Faza 2 | — | 2.1 cere ffmpeg local |
| 4 | Faza 4 | — | 4.2 înainte de 5.2 (să nu refactorezi cardurile de 2 ori) — sau fă-le împreună |
| 5 | Faza 5 | 4.2 recomandat înainte | CSP ultimul pas, în Report-Only întâi |
| 6 | Faza 3.3, 3.4, Faza 6 | restul | doar dacă mai e buget |

## Reguli generale pentru implementare

1. **Niciun framework, niciun bundler obligatoriu** — site-ul rămâne static + scripturi
   clasice. Singura unealtă nouă permisă: esbuild ca devDependency (Faza 2.5, opțional).
2. **Zero schimbări vizuale neintenționate** — la refactor (5.2, 4.2) compară vizual.
3. **Verifică pe preview deploy Vercel** înainte de producție, mai ales rewrites
   (3.1) și headers (1.8) — comportamentul local diferă.
4. **Nu rula migrații Supabase automat** — dacă apare nevoia, scrie SQL în `seed/` și
   anunță owner-ul să-l ruleze manual.
5. Commit-uri mici, mesaje în engleză, un subiect per commit (stilul existent în repo).
