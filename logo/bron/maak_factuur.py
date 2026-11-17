"""Factuursjabloon LWPRINTS3D (Word). Gebruik: python3 logo/bron/maak_factuur.py"""
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[2]
LOGO = ROOT / "logo/png/lwprints3d-liggend-2000.png"
ZWART, GRIJS, WIT_ = RGBColor(0x11, 0x11, 0x11), RGBColor(0x66, 0x66, 0x66), RGBColor(0xFF, 0xFF, 0xFF)


def shade(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear"); shd.set(qn("w:color"), "auto"); shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)


def fixed(table, widths):
    table.autofit = False
    lay = OxmlElement("w:tblLayout"); lay.set(qn("w:type"), "fixed"); table._tbl.tblPr.append(lay)
    for row in table.rows:
        for c, w in zip(row.cells, widths):
            c.width = w
    for col, w in zip(table.columns, widths):
        col.width = w


def line(doc, color="1F8BFF", size=18):
    p = doc.add_paragraph()
    bdr = OxmlElement("w:pBdr"); b = OxmlElement("w:bottom")
    for k, v in {"w:val": "single", "w:sz": str(size), "w:space": "1", "w:color": color}.items():
        b.set(qn(k), v)
    bdr.append(b); p._p.get_or_add_pPr().append(bdr)


def text(doc, s, size=10, bold=False, color=ZWART, align=None, after=4):
    p = doc.add_paragraph(); r = p.add_run(s)
    r.font.size, r.bold, r.font.color.rgb = Pt(size), bold, color
    p.paragraph_format.space_after = Pt(after)
    if align is not None: p.alignment = align
    return p


doc = Document()
st = doc.styles["Normal"]; st.font.name = "Arial"; st.font.size = Pt(10)
st.element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")
sec = doc.sections[0]
sec.page_height, sec.page_width = Cm(29.7), Cm(21.0)
sec.left_margin = sec.right_margin = Cm(2.2); sec.top_margin = sec.bottom_margin = Cm(1.8)

head = doc.add_table(rows=1, cols=2)
head.cell(0, 0).paragraphs[0].add_run().add_picture(str(LOGO), width=Cm(6.5))
info = head.cell(0, 1).paragraphs[0]; info.alignment = WD_ALIGN_PARAGRAPH.RIGHT
for i, s in enumerate(["LWPRINTS3D · onderdeel van LWPRINTS", "Gerrit van der Veenstraat 113", "5348 RC Oss",
                       "06-83161278 · info@lwprints.nl", "lwprints3d.nl", "KVK 98938185", "IBAN NL11 RABO 0167 2853 78"]):
    r = info.add_run(s + "\n"); r.font.size = Pt(8.5); r.bold = i == 0; r.font.color.rgb = ZWART if i == 0 else GRIJS
line(doc)

text(doc, "FACTUUR", 20, True, after=2)
meta = doc.add_table(rows=1, cols=2)
left = meta.cell(0, 0).paragraphs[0]
for s in ["Factuur aan:", "[Bedrijfsnaam of naam]", "t.a.v. [contactpersoon]", "[Adres]", "[Postcode en plaats]"]:
    r = left.add_run(s + "\n"); r.bold = s == "Factuur aan:"
right = meta.cell(0, 1).paragraphs[0]; right.alignment = WD_ALIGN_PARAGRAPH.RIGHT
for k, v in [("Factuurnummer", "[2026-001]"), ("Factuurdatum", "[dd-mm-jjjj]"), ("Vervaldatum", "[factuurdatum + 14 dagen]"),
             ("Offertenummer", "[optioneel]"), ("Uw referentie", "[optioneel]")]:
    r = right.add_run(f"{k}: "); r.bold = True
    right.add_run(v + "\n")

rows = [("[Omschrijving product of dienst]", "[1]", "€ [0,00]", "€ [0,00]"),
        ("Tekenwerk / ontwerp", "[0,5 uur]", "€ 40,00", "€ 20,00"),
        ("Opstartkosten", "1", "€ 7,50", "€ 7,50"),
        ("Verzendkosten", "[1]", "€ [0,00]", "€ [0,00]")]
t = doc.add_table(rows=1, cols=4); t.style = "Table Grid"; t.alignment = WD_TABLE_ALIGNMENT.CENTER
widths = [Cm(9.0), Cm(2.0), Cm(2.6), Cm(2.6)]
for i, h in enumerate(["Omschrijving", "Aantal", "Prijs", "Totaal"]):
    c = t.rows[0].cells[i]; shade(c, "111111")
    r = c.paragraphs[0].add_run(h); r.bold = True; r.font.color.rgb = WIT_; r.font.size = Pt(9.5)
    if i: c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
for row in rows:
    cells = t.add_row().cells
    for i, v in enumerate(row):
        r = cells[i].paragraphs[0].add_run(v); r.font.size = Pt(9.5)
        if i: cells[i].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
fixed(t, widths)

tot = doc.add_table(rows=2, cols=2); tot.alignment = WD_TABLE_ALIGNMENT.RIGHT
for i, (k, v) in enumerate([("Btw", "€ 0,00"), ("Te betalen", "€ [0,00]")]):
    a, b = tot.rows[i].cells
    ra, rb = a.paragraphs[0].add_run(k), b.paragraphs[0].add_run(v)
    for r in (ra, rb): r.font.size = Pt(11 if i else 9.5); r.bold = bool(i)
    b.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
    if i:
        shade(a, "1F8BFF"); shade(b, "1F8BFF"); ra.font.color.rgb = rb.font.color.rgb = WIT_
fixed(tot, [Cm(4.6), Cm(4.6)])

doc.add_paragraph()
text(doc, "Vrijgesteld van btw op grond van de kleineondernemersregeling (KOR).", 9.5, color=GRIJS, after=10)
text(doc, "Betaling", 11, True, after=2)
text(doc, "Graag het totaalbedrag binnen 14 dagen overmaken naar IBAN NL11 RABO 0167 2853 78 t.n.v. LWPRINTS, "
          "onder vermelding van het factuurnummer.", after=10)
text(doc, "Bedankt voor je opdracht! Op deze factuur zijn de algemene voorwaarden van LWPRINTS3D van toepassing "
          "(lwprints3d.nl/algemene-voorwaarden).", 9.5, after=10)
line(doc, size=6)
text(doc, "LWPRINTS3D is een onderdeel van LWPRINTS · Oss · lwprints3d.nl · KVK 98938185 · IBAN NL11 RABO 0167 2853 78",
     8, color=GRIJS, align=WD_ALIGN_PARAGRAPH.CENTER)

out = ROOT / "documenten/LWPRINTS3D-factuur-sjabloon.docx"
doc.save(out)
print("opgeslagen:", out)
