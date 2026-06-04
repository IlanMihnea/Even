const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, TabStopType, TabStopPosition,
} = require("docx");

// ---- EVEN brand palette ----
const MIDNIGHT = "1C2340";
const SAGE = "7A9B92";
const GOLD = "C8A96E";
const PEBBLE = "E8E5DC";
const STONE = "6B6E66"; // muted ink for secondary (printable)
const INK = "1C2340";

const SERIF = "Cormorant Garamond"; // display
const SANS = "DM Sans";             // body

// ---------- helpers ----------
function eyebrow(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 80, before: opts.before ?? 0 },
    alignment: opts.align ?? AlignmentType.LEFT,
    children: [
      new TextRun({
        text: text.toUpperCase(),
        font: SANS, size: 15, bold: true, color: SAGE,
        characterSpacing: 30,
      }),
    ],
  });
}

// Section heading: I. PĂRȚILE  — Cormorant, Midnight, with sage hairline under
function section(text) {
  return new Paragraph({
    spacing: { before: 320, after: 140 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: SAGE, space: 4 } },
    keepNext: true,
    children: [
      new TextRun({ text, font: SERIF, size: 30, bold: true, color: MIDNIGHT }),
    ],
  });
}

// Clause paragraph: bold number + normal text. Accepts array of runs or string.
function clause(num, body, opts = {}) {
  const runs = [];
  if (num) {
    runs.push(new TextRun({ text: num + "  ", font: SANS, size: 21, bold: true, color: MIDNIGHT }));
  }
  if (typeof body === "string") {
    runs.push(new TextRun({ text: body, font: SANS, size: 21, color: INK }));
  } else {
    for (const r of body) runs.push(r);
  }
  return new Paragraph({
    spacing: { after: opts.after ?? 120, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
    children: runs,
  });
}

function run(text, o = {}) {
  return new TextRun({ text, font: SANS, size: 21, color: INK, ...o });
}
function fill(label) {
  // placeholder field, shown in a discreet way
  return new TextRun({ text: label, font: SANS, size: 21, color: STONE, italics: true });
}

const NB = (n = 1) => new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: "", size: n * 8 })] });

// ---------- document body ----------
const children = [];

// === MASTHEAD ===
children.push(
  new Paragraph({
    spacing: { after: 20 },
    children: [
      new TextRun({ text: "E V E N", font: SERIF, size: 56, bold: true, color: MIDNIGHT, characterSpacing: 60 }),
    ],
  }),
  new Paragraph({
    spacing: { after: 40 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: MIDNIGHT, space: 6 } },
    children: [
      new TextRun({ text: "IMOBILIARE CU PLAN", font: SANS, size: 14, bold: true, color: SAGE, characterSpacing: 40 }),
    ],
  }),
);

children.push(NB(3));

// === TITLE BLOCK ===
children.push(
  eyebrow("Contract", { after: 60 }),
  new Paragraph({
    spacing: { after: 40 },
    children: [
      new TextRun({ text: "Contract de intermediere imobiliară", font: SERIF, size: 44, bold: true, color: MIDNIGHT }),
    ],
  }),
  new Paragraph({
    spacing: { after: 160 },
    children: [
      new TextRun({ text: "— mandat de vânzare —", font: SERIF, size: 26, italics: true, color: SAGE }),
    ],
  }),
);

// Nr / data line with tab to the right
children.push(
  new Paragraph({
    spacing: { after: 120 },
    tabStops: [{ type: TabStopType.RIGHT, position: 9026 }],
    children: [
      run("Nr. "),
      run("________________", { color: STONE }),
      new TextRun({ text: "\t", font: SANS, size: 21 }),
      run("Data "),
      run("________________", { color: STONE }),
    ],
  }),
);

// === I. PĂRȚILE ===
children.push(section("I.  Părțile"));

children.push(
  clause("1.", [
    new TextRun({ text: "AMIT ESTATE S.R.L.", font: SANS, size: 21, bold: true, color: MIDNIGHT }),
    run(", cu sediul social în România, Piatra Neamț, jud. Neamț, Str. Ion Creangă nr. 9, cod poștal 610102, înregistrată la Registrul Comerțului sub nr. J2026003443008, CUI 53340194, cont IBAN RO81BACX0000004110573000 deschis la UniCredit Bank, reprezentată legal prin Ilan-Mihnea Eibenschutz, administrator, telefon +40745609366, e-mail ilan@even-imobiliare.ro, denumită în continuare "),
    new TextRun({ text: "AGENȚIA", font: SANS, size: 21, bold: true, color: MIDNIGHT }),
    run(" (Intermediarul),"),
  ]),
);

children.push(
  new Paragraph({
    spacing: { after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "și", font: SERIF, size: 24, italics: true, color: SAGE })],
  }),
);

children.push(
  clause("2.", [
    new TextRun({ text: "BROTNEI ALEXA", font: SANS, size: 21, bold: true, color: MIDNIGHT }),
    run(", domiciliat în "), fill("[domiciliu]"), run(", CNP "), fill("[__________]"),
    run(", CI seria "), fill("[___]"), run(" nr. "), fill("[______]"),
    run(", telefon "), fill("[__________]"), run(", e-mail "), fill("[__________]"),
    run(", împreună cu soția "),
    new TextRun({ text: "BROTNEI MARIA-FLORENTINA", font: SANS, size: 21, bold: true, color: MIDNIGHT }),
    run(", domiciliată în "), fill("[domiciliu]"), run(", CNP "), fill("[__________]"),
    run(", CI seria "), fill("[___]"), run(" nr. "), fill("[______]"),
    run(", care își exprimă acordul pentru vânzare, imobilul fiind bun comun al soților, denumiți în continuare împreună "),
    new TextRun({ text: "PROPRIETARUL", font: SANS, size: 21, bold: true, color: MIDNIGHT }),
    run(" (Clientul),"),
  ]),
);

children.push(
  new Paragraph({
    spacing: { after: 60 },
    children: [run("au convenit încheierea prezentului contract.")],
  }),
);

// === II. OBIECTUL ===
children.push(section("II.  Obiectul contractului"));
children.push(
  clause("2.1.", "Proprietarul încredințează Agenției intermedierea în vederea vânzării imobilului situat în Jud. Neamț, UAT Bicaz, Loc. Izvoru Muntelui, punct „Ramificație”, înscris în Cartea Funciară nr. 50530 Bicaz (CF vechi 581/N), respectiv: terenul intravilan cu nr. cadastral 50530 (nr. cadastral vechi 825), categoria curți-construcții, suprafața de 1.000 mp, împreună cu toate construcțiile edificate pe acesta — incluzând casa de vacanță cu nr. cadastral 50530-C1 (suprafață construită la sol 49 mp) și motelul în regim S+P+3M edificat pe teren (conform Autorizației de Construire nr. 12/2005). Vânzarea se face „la pachet”, teren și construcții împreună."),
  clause("2.2.", "Părțile iau act că, la data semnării, în Cartea Funciară figurează ca edificată numai casa de vacanță de 49 mp; intabularea motelului se va realiza în vederea semnării contractului autentic."),
  clause("2.3.", [
    run("Prețul de vânzare solicitat este de "),
    new TextRun({ text: "350.000 EUR", font: SANS, size: 21, bold: true, color: MIDNIGHT }),
    run(". Poate fi modificat numai prin acordul scris al părților."),
  ]),
  clause("2.4.", "Proprietarul declară că este titularul dreptului de proprietate (cotă 1/1, dobândit prin Contractul de vânzare-cumpărare nr. 3080/2004, intabulat sub nr. 843/17.08.2004) și că imobilul nu este revendicat. Singura sarcină înscrisă în Cartea Funciară este sechestrul de la poziția C1 (Act Administrativ nr. 7196 din 13.07.2010, Primăria Bicaz), în sumă de 2.749,98 RON, pe care Proprietarul se obligă să îl achite și să îl radieze până la data semnării contractului autentic, astfel încât imobilul să fie transmis liber de orice sarcină."),
);

// === III. COMISIONUL ===
children.push(section("III.  Comisionul"));
children.push(
  clause("3.1.", [
    run("Comisionul de intermediere este de "),
    new TextRun({ text: "3% din prețul de vânzare", font: SANS, size: 21, bold: true, color: MIDNIGHT }),
    run(". Dacă prețul final de vânzare atinge sau depășește 400.000 EUR, comisionul este de "),
    new TextRun({ text: "4% din prețul de vânzare", font: SANS, size: 21, bold: true, color: MIDNIGHT }),
    run(". Agenția nu este plătitoare de TVA; comisionul nu include TVA."),
  ]),
  clause("3.2.", "Comisionul este datorat de Proprietar (Vânzător)."),
  clause("3.3.", "Comisionul devine scadent la momentul semnării contractului autentic de vânzare-cumpărare și se achită prin transfer bancar în contul Agenției indicat la art. I."),
  clause("3.4.", "Se consideră „tranzacție încheiată prin intermedierea Agenției” orice vânzare a imobilului către un cumpărător prezentat de Agenție, conform listei datate din Anexa 1."),
);

// === IV. DURATA ȘI EXCLUSIVITATEA ===
children.push(section("IV.  Durata și exclusivitatea"));
children.push(
  clause("4.1.", [
    run("Contractul se încheie pe durata de "),
    new TextRun({ text: "6 luni", font: SANS, size: 21, bold: true, color: MIDNIGHT }),
    run(" de la data semnării."),
  ]),
  clause("4.2.", "Pe durata contractului, Proprietarul acordă Agenției exclusivitate: nu va încredința imobilul altei agenții și nu va face publicitate proprie pentru vânzare."),
  clause("4.3.", "La expirare, contractul încetează de drept, fără reînnoire automată."),
  clause("4.4.", "Oricare parte poate denunța unilateral contractul printr-o notificare scrisă cu un preaviz de 30 de zile."),
);

// === V. OBLIGAȚIILE PĂRȚILOR ===
children.push(section("V.  Obligațiile părților"));
children.push(
  clause("5.1.", [
    new TextRun({ text: "Agenția", font: SANS, size: 21, bold: true, color: MIDNIGHT }),
    run(" se obligă: să promoveze imobilul pe cheltuiala sa (anunțuri, fotografii, panou), să prezinte potențiali cumpărători, să țină evidența datată a clienților prezentați, să asiste părțile până la finalizarea tranzacției și să trateze datele Proprietarului conform legii."),
  ]),
  clause("5.2.", [
    new TextRun({ text: "Proprietarul", font: SANS, size: 21, bold: true, color: MIDNIGHT }),
    run(" se obligă: să pună la dispoziție actele imobilului, să permită vizionările, să comunice Agenției orice ofertă primită direct și să nu ocolească Agenția în relația cu clienții prezentați de aceasta."),
  ]),
);

// === VI. ANTI-OCOLIRE ===
children.push(section("VI.  Clauza anti-ocolire"));
children.push(
  clause("6.1.", "Dacă, în termen de 12 luni de la încetarea contractului, Proprietarul vinde imobilul unui cumpărător prezentat de Agenție (conform Anexei 1), comisionul prevăzut la art. III rămâne datorat integral."),
);

// === VII. RĂSPUNDERE ===
children.push(section("VII.  Răspundere"));
children.push(
  clause("7.1.", "Pentru neexecutarea obligațiilor, partea în culpă datorează despăgubiri. Eventualele penalități nu pot depăși cuantumul comisionului prevăzut la art. III."),
);

// === VIII. GDPR ===
children.push(section("VIII.  Protecția datelor (GDPR)"));
children.push(
  clause("8.1.", "Proprietarul își exprimă acordul ca Agenția să prelucreze datele sale și să promoveze imobilul (anunțuri, fotografii) în scopul executării contractului, conform Regulamentului (UE) 2016/679."),
);

// === IX. LITIGII ===
children.push(section("IX.  Litigii"));
children.push(
  clause("9.1.", "Litigiile se soluționează amiabil, iar în lipsa unei soluții, de instanțele competente. Termenul de prescripție pentru acțiunea privind comisionul este de 3 ani."),
);

// === X. DISPOZIȚII FINALE ===
children.push(section("X.  Dispoziții finale"));
children.push(
  clause("10.1.", "Contractul s-a încheiat în 2 (două) exemplare, câte unul pentru fiecare parte."),
  clause("10.2.", "Anexa 1 (Lista clienților prezentați) face parte integrantă din contract."),
);

// === SIGNATURES ===
children.push(NB(6));
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder,
  insideHorizontal: noBorder, insideVertical: noBorder };

function sigCell(lines) {
  return new TableCell({
    borders: noBorders,
    width: { size: 4513, type: WidthType.DXA },
    margins: { top: 40, bottom: 40, left: 0, right: 200 },
    children: lines,
  });
}
function sigLabel(t) {
  return new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: t.toUpperCase(), font: SANS, size: 14, bold: true, color: SAGE, characterSpacing: 24 })] });
}
function sigName(t) {
  return new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: t, font: SANS, size: 21, bold: true, color: MIDNIGHT })] });
}
function sigSub(t) {
  return new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: t, font: SANS, size: 19, color: STONE })] });
}
function sigLine() {
  return new Paragraph({ spacing: { before: 160, after: 240 }, children: [new TextRun({ text: "_______________________________", color: STONE, font: SANS, size: 21 })] });
}

children.push(
  new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [4513, 4513],
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          sigCell([
            sigLabel("Agenția"),
            sigName("AMIT ESTATE S.R.L."),
            sigSub("prin Ilan-Mihnea Eibenschutz, administrator"),
            sigLine(),
          ]),
          sigCell([
            sigLabel("Proprietarul"),
            sigName("BROTNEI ALEXA"),
            sigSub(""),
            sigLine(),
            sigName("BROTNEI MARIA-FLORENTINA"),
            sigSub(""),
            sigLine(),
          ]),
        ],
      }),
    ],
  }),
);

// === ANEXA 1 (new page) ===
children.push(new Paragraph({ pageBreakBefore: true, spacing: { after: 0 }, children: [] }));
children.push(
  eyebrow("Anexă", { after: 60 }),
  new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: "Anexa 1 — Lista clienților prezentați", font: SERIF, size: 32, bold: true, color: MIDNIGHT })],
  }),
  new Paragraph({
    spacing: { after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: SAGE, space: 4 } },
    children: [new TextRun({ text: "Parte integrantă din contractul de intermediere imobiliară", font: SANS, size: 18, color: STONE })],
  }),
);

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: PEBBLE };
const tblBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder,
  insideHorizontal: cellBorder, insideVertical: cellBorder };

function headCell(text, w) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: { fill: MIDNIGHT, type: ShadingType.CLEAR, color: "auto" },
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text: text.toUpperCase(), font: SANS, size: 15, bold: true, color: "F1F0EC", characterSpacing: 20 })] })],
  });
}
function bodyCell(w, h) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    margins: { top: 160, bottom: 160, left: 140, right: 140 },
    children: [new Paragraph({ children: [new TextRun({ text: "", font: SANS, size: 21 })] })],
  });
}

const colW = [900, 3326, 3400, 1400]; // sums to 9026
const anexaRows = [
  new TableRow({
    tableHeader: true,
    children: [headCell("Nr.", colW[0]), headCell("Nume client", colW[1]), headCell("Data prezentării / vizionării", colW[2]), headCell("Semnătură", colW[3])],
  }),
];
for (let i = 1; i <= 8; i++) {
  anexaRows.push(new TableRow({
    children: [
      new TableCell({ width: { size: colW[0], type: WidthType.DXA }, margins: { top: 160, bottom: 160, left: 140, right: 140 }, verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(i), font: SANS, size: 21, color: STONE })] })] }),
      bodyCell(colW[1]), bodyCell(colW[2]), bodyCell(colW[3]),
    ],
  }));
}

children.push(new Table({ width: { size: 9026, type: WidthType.DXA }, columnWidths: colW, borders: tblBorders, rows: anexaRows }));

// ---------- assemble ----------
const doc = new Document({
  creator: "EVEN — AMIT ESTATE S.R.L.",
  title: "Contract de intermediere imobiliară",
  styles: { default: { document: { run: { font: SANS, size: 21, color: INK } } } },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: PEBBLE, space: 6 } },
            tabStops: [{ type: TabStopType.RIGHT, position: 9026 }],
            children: [
              new TextRun({ text: "EVEN · Imobiliare cu plan", font: SERIF, size: 18, italics: true, color: SAGE }),
              new TextRun({ text: "\tAMIT ESTATE S.R.L. · CUI 53340194", font: SANS, size: 15, color: STONE }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 20 },
            children: [
              new TextRun({ text: "Pag. ", font: SANS, size: 15, color: STONE }),
              new TextRun({ children: [PageNumber.CURRENT], font: SANS, size: 15, color: STONE }),
              new TextRun({ text: " / ", font: SANS, size: 15, color: STONE }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: SANS, size: 15, color: STONE }),
            ],
          }),
        ],
      }),
    },
    children,
  }],
});

const out = "C:/Users/Ilan/Desktop/claude/EVEN/contracte/Contract_intermediere_EVEN_Brotnei.docx";
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log("WROTE", out, buf.length, "bytes"); });
