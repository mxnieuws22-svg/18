"""Maakt het offertesjabloon voor LWPRINTS (Word). Gebruik: python3 logo/bron/maak_offerte.py"""
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[2]
LOGO = ROOT / "logo/png/lwprints-logo-zwart-2000.png"
ORANJE, ZWART, GRIJS = RGBColor(0xFF, 0x6B, 0x00), RGBColor(0x11, 0x11, 0x11), RGBColor(0x66, 0x66, 0x66)


def shade(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear"); shd.set(qn("w:color"), "auto"); shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)


def fixed(table, widths):
    table.autofit = False
    tblPr = table._tbl.tblPr
    lay = OxmlElement("w:tblLayout"); lay.set(qn("w:type"), "fixed"); tblPr.append(lay)
    for row in table.rows:
        for c, w in zip(row.cells, widths):
            c.width = w
    for col, w in zip(table.columns, widths):
        col.width = w


def line(doc, color="FF6B00", size=18):
    p = doc.add_paragraph()
    pPr = p._p.get_or_add_pPr()
    bdr = OxmlElement("w:pBdr"); b = OxmlElement("w:bottom")
    for k, v in {"w:val": "single", "w:sz": str(size), "w:space": "1", "w:color": color}.items():
        b.set(qn(k), v)
    bdr.append(b); pPr.append(bdr)
    return p


def text(doc, s, size=10, bold=False, color=ZWART, align=None, space_after=4):
    p = doc.add_paragraph()
    r = p.add_run(s); r.font.size = Pt(size); r.bold = bold; r.font.color.rgb = color
    p.paragraph_format.space_after = Pt(space_after)
    if align: p.alignment = align
    return p


doc = Document()
st = doc.styles["Normal"]; st.font.name = "Arial"; st.font.size = Pt(10)
st.element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")
sec = doc.sections[0]
sec.page_height, sec.page_width = Cm(29.7), Cm(21.0)
for m in ("left_margin", "right_margin"): setattr(sec, m, Cm(2.2))
sec.top_margin, sec.bottom_margin = Cm(1.8), Cm(1.8)

# kop: logo links, bedrijfsgegevens rechts
head = doc.add_table(rows=1, cols=2); head.alignment = WD_TABLE_ALIGNMENT.CENTER
head.cell(0, 0).paragraphs[0].add_run().add_picture(str(LOGO), width=Cm(6.5))
info = head.cell(0, 1).paragraphs[0]; info.alignment = WD_ALIGN_PARAGRAPH.RIGHT
for i, s in enumerate(["LWPRINTS · 3D-printservice", "[Straat en huisnummer]", "[Postcode] Oss",
                       "[telefoon] · [e-mail]", "lwprints.nl", "KVK [nummer]"]):
    r = info.add_run(s + "\n"); r.font.size = Pt(8.5); r.font.color.rgb = ZWART if i == 0 else GRIJS; r.bold = i == 0
line(doc)

text(doc, "OFFERTE", 20, True, space_after=2)
meta = doc.add_table(rows=1, cols=2)
left = meta.cell(0, 0).paragraphs[0]
for s in ["Aan:", "[Bedrijfsnaam]", "t.a.v. [naam contactpersoon]", "[Adres]", "[Postcode en plaats]"]:
    r = left.add_run(s + "\n"); r.font.size = Pt(10); r.bold = s == "Aan:"
right = meta.cell(0, 1).paragraphs[0]; right.alignment = WD_ALIGN_PARAGRAPH.RIGHT
for k, v in [("Offertenummer", "[2026-001]"), ("Datum", "[dd-mm-jjjj]"), ("Geldig tot", "[datum + 30 dagen]"), ("Uw referentie", "[optioneel]")]:
    r = right.add_run(f"{k}: "); r.bold = True; r.font.size = Pt(10)
    r = right.add_run(v + "\n"); r.font.size = Pt(10)

text(doc, "Beste [naam],", space_after=6)
text(doc, "Bedankt voor je aanvraag. Hieronder vind je de offerte voor [korte omschrijving van de opdracht]. "
          "Heb je vragen of wil je iets aanpassen? Laat het me gerust weten.", space_after=10)

rows = [("Tekenwerk / ontwerp", "[0,5 uur]", "€ 40,00", "€ 20,00"),
        ("[Product of onderdeel], materiaal [PETG], kleur [zwart]", "[10]", "€ [0,00]", "€ [0,00]"),
        ("Opstartkosten", "1", "€ 7,50", "€ 7,50"),
        ("", "", "", "")]
t = doc.add_table(rows=1, cols=4); t.alignment = WD_TABLE_ALIGNMENT.CENTER; t.style = "Table Grid"
widths = [Cm(9.0), Cm(2.0), Cm(2.6), Cm(2.6)]
for i, h in enumerate(["Omschrijving", "Aantal", "Prijs", "Totaal"]):
    c = t.rows[0].cells[i]; c.width = widths[i]; shade(c, "111111")
    r = c.paragraphs[0].add_run(h); r.bold = True; r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF); r.font.size = Pt(9.5)
    if i: c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
for row in rows:
    cells = t.add_row().cells
    for i, v in enumerate(row):
        cells[i].width = widths[i]
        r = cells[i].paragraphs[0].add_run(v); r.font.size = Pt(9.5)
        if i: cells[i].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

fixed(t, widths)
tot = doc.add_table(rows=3, cols=2); tot.alignment = WD_TABLE_ALIGNMENT.RIGHT
for i, (k, v) in enumerate([("Subtotaal", "€ [0,00]"),
                            ("Btw", "niet van toepassing (KOR)"),
                            ("Totaal", "€ [0,00]")]):
    a, b = tot.rows[i].cells; a.width, b.width = Cm(4.5), Cm(4.5)
    ra = a.paragraphs[0].add_run(k); rb = b.paragraphs[0].add_run(v)
    for r in (ra, rb): r.font.size = Pt(11 if i == 2 else 9.5); r.bold = i == 2
    b.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
    if i == 2: shade(a, "FF6B00"); shade(b, "FF6B00")

fixed(tot, [Cm(4.6), Cm(4.6)])
doc.add_paragraph()
text(doc, "Levering", 11, True, space_after=2)
text(doc, "Levertijd: [3 tot 5] werkdagen na akkoord. Afhalen in Oss is gratis; verzenden tegen kostprijs.", space_after=8)
text(doc, "Voorwaarden", 11, True, space_after=2)
for s in ["Deze offerte is 30 dagen geldig.",
          "Betaling binnen 14 dagen na factuurdatum.",
          "Betaal je het tekenwerk, dan is het ontwerp van jou. Ik bewaar het voor nabestellingen.",
          "3D-geprinte onderdelen zijn niet bedoeld voor toepassingen waar de veiligheid van personen van afhangt.",
          "Kleine verschillen in kleur en oppervlak zijn eigen aan 3D-printen.",
          "Op deze offerte zijn de algemene voorwaarden van LWPRINTS van toepassing."]:
    p = doc.add_paragraph(style="List Bullet"); r = p.add_run(s); r.font.size = Pt(9.5)

doc.add_paragraph()
text(doc, "Akkoord? Stuur deze offerte ondertekend terug of bevestig per mail.", space_after=14)
sig = doc.add_table(rows=1, cols=2)
for i, who in enumerate(["Namens LWPRINTS", "Akkoord opdrachtgever"]):
    p = sig.cell(0, i).paragraphs[0]
    r = p.add_run(f"{who}\n\n\n______________________________\nNaam:\nDatum:"); r.font.size = Pt(9.5)

line(doc, size=6)
text(doc, "LWPRINTS · 3D-printservice uit Oss · lwprints.nl · KVK [nummer] · IBAN [nummer]",
     8, color=GRIJS, align=WD_ALIGN_PARAGRAPH.CENTER)

out = ROOT / "documenten/LWPRINTS-offerte-sjabloon.docx"
doc.save(out)
print("opgeslagen:", out)
