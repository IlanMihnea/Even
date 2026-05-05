# EVEN — Brand Kit

*Real estate · Bucharest*

Identitate vizuală: pietre stivuite = **echilibru, grounded luxury, serenitate**. Paletă mutată, pământie. Tipografie serif clasică + sans modern. Formă organică, nu geometrică.

---

## 1. Paletă — culori cu rol clar

Fiecare culoare are UN rol. Fără excepții.

| Rol | Nume | Hex | Folosire |
|-----|------|-----|----------|
| **Primar brand** | Midnight | `#1C2340` | CTA principal, logo, titluri mari, navbar text |
| **Fundal** | Linen | `#F5F3EE` | Fundalul paginilor, navbar |
| **Suprafețe** | Warm White | `#E8E4DA` | Carduri, panouri, formulare elevate |
| **Text pe dark** | Stone | `#D4CEC0` | Footer, hero dark, secțiuni intro |
| **Accent cald** | Sage | `#5F8A82` | Taglines, labels small-caps, underline, icoane |
| **Suport** | Slate Navy | `#3B5A7A` | Accent secundar, flux comercial |
| **Premium rar** | Gold | `#C8A96E` | DOAR badges premium, highlight rar. **Nu buton.** |

### Reguli nenegociabile

- **Fundalul default este Linen**, nu alb pur. Albul pur arată rece pe lângă paleta pământie.
- **Gold-ul e un seasoning, nu o bază.** Max 1 element gold per pagină (badge, highlight pe cifră).
- **Contrast text**: Midnight pe Linen/Warm White, Stone pe Midnight. Nu amesteca.

---

## 2. Tipografie — 3 roluri, 3 fonturi

### Regula de aur pentru italic
**Italic se folosește DOAR pentru highlight punctual pe un cuvânt**, niciodată pe titluri întregi, logo sau heading-uri. Dacă vrei să atragi atenția, folosește mai întâi weight, dimensiune sau culoare.

Exemplu corect: `Casa ta <em>perfectă</em> te așteaptă` — doar cuvântul "perfectă" e italic.
Exemplu greșit: întreg H1 italic.

### Cormorant Garamond (serif display)
Pentru heading-uri mari și moment de brand. **Regular always**, italic doar pe cuvântul highlight.

- **Regular 500** → logotype "EVEN", hero H1, H2 secțiuni, citate mari
- **Italic** → apare DOAR pe cuvântul/fraza scurtă scoasă în evidență în interiorul unui H1/H2

### DM Sans (sans body)
Calul de povară. Tot ce nu e moment de brand.

- **400** → body text
- **500** → labels, navigation
- **600-700** → butoane, H3, H4, micro-titles uppercase

### Syne (campanii)
Rezervat pentru social media și bannere. **Nu apare în site.**

### Scală tipografică

```
H1 hero     : Cormorant regular 500 · 4rem (mobile 2.5rem)
  └─ highlight word: Cormorant italic 500 (culoare Sage sau Gold)
H2 secțiune : Cormorant regular 500 · 2.25rem (mobile 1.75rem)
H3          : DM Sans 600 · 1.25rem
H4          : DM Sans 600 · 1rem
Body        : DM Sans 400 · 15px · line-height 1.65
Label caps  : DM Sans 600 · 11px · letter-spacing 0.14em · UPPERCASE
```

---

## 3. Butoane — 3 tipuri, reguli clare

### Primar (default CTA)
```
Background : Midnight #1C2340
Text       : Stone #D4CEC0
Font       : DM Sans 600
Radius     : 999px (pill) pe hero, 12px pe restul
Hover      : Midnight mai deschis + translateY -1px
```

### Secundar (outline)
```
Background : transparent
Border     : 1px Sage #5F8A82
Text       : Midnight
Hover      : background Warm White
```

### Premium (rar, 1 per pagină)
```
Background : Gold #C8A96E
Text       : Midnight
Când       : pagini de proiecte premium, "Rezervă vizionare"
```

---

## 4. Formă — organic, nu geometric

Limbajul vine din pietrele rotunjite ale logo-ului. **Softuri mari, umbre difuze.**

```
--r-sm : 6px   (badges, inputs mici)
--r-md : 12px  (inputs, cards small)
--r-lg : 20px  (cards proprietăți, panouri)
--r-xl : 32px  (hero search box, secțiuni featured)
--r-pill : 999px (butoane hero, tag-uri)
```

### Umbre
Soft, difuze, niciodată dure.
```
--shadow-sm : 0 1px 2px  rgba(28,35,64,0.04)
--shadow-md : 0 4px 16px rgba(28,35,64,0.06)
--shadow-lg : 0 12px 40px rgba(28,35,64,0.08)
```

---

## 5. Identitate vizuală — dark vs light

### Versiune DARK (hero, footer, section-intro)
- Fundal: Midnight `#1C2340`
- Logotype "EVEN": Stone `#D4CEC0` — Cormorant regular
- Tagline: Sage `#5F8A82` — UPPERCASE letter-spacing 0.14em
- Text body: Stone 70% opacity
- Buton primar: Gold → Midnight text (pe dark, Gold devine CTA vizibil)
- Buton secundar: border Sage + text Stone

### Versiune LIGHT (paginile normale)
- Fundal: Linen `#F5F3EE`
- Logotype "EVEN": Midnight — Cormorant regular
- Tagline: Sage — UPPERCASE
- Text body: Midnight 80%
- Buton primar: Midnight → Stone text
- Buton secundar: border Sage + text Midnight

---

## 6. Spacing — generos, calm

White space e parte din brand. Nu îngrămădi.

```
Section padding-y: 96px desktop, 56px mobile
Container max-w  : 1280px, padding 24px
Card gap         : 28-32px
Card interior    : 24px padding
```

---

## 7. Ton de comunicare

**Cuvinte cheie:** Confident · Direct · Aspirațional · Cald, uman · Expert

### Folosește
- Fraze scurte, clare
- Cifre concrete
- Verbe de acțiune: "Găsești la noi", "Îți livrăm", "Îți garantăm"

### Evită
- Limbaj de agenție generic
- Superlative fără substanță
- "Cea mai bună ofertă din piață" fără dovadă

---

*EVEN Real Estate · Bucharest*
