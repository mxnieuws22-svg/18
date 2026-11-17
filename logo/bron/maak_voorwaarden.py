"""Algemene voorwaarden als Word-document. Tekst staat in website/bron/voorwaarden.py.
Gebruik: python3 logo/bron/maak_voorwaarden.py"""
import sys
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "website/bron"))
from voorwaarden import ARTIKELEN, VERSIE  # noqa: E402

doc = Document()
st = doc.styles["Normal"]; st.font.name = "Arial"; st.font.size = Pt(10)
st.element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")
sec = doc.sections[0]
sec.page_height, sec.page_width = Cm(29.7), Cm(21.0)
sec.left_margin = sec.right_margin = Cm(2.2)
doc.add_picture(str(ROOT / "logo/png/lwprints3d-liggend-2000.png"), width=Cm(6.0))
h = doc.add_paragraph(); r = h.add_run("Algemene voorwaarden LWPRINTS3D"); r.bold = True; r.font.size = Pt(18)
v = doc.add_paragraph(); r = v.add_run(VERSIE); r.font.color.rgb = RGBColor(0x66, 0x66, 0x66)
for i, (titel, zinnen) in enumerate(ARTIKELEN, 1):
    p = doc.add_paragraph(); r = p.add_run(f"Artikel {i}. {titel}"); r.bold = True; r.font.size = Pt(12)
    p.paragraph_format.space_before = Pt(10)
    for j, z in enumerate(zinnen, 1):
        q = doc.add_paragraph(f"{i}.{j}  {z}"); q.paragraph_format.left_indent = Cm(0.6)
        q.paragraph_format.space_after = Pt(3)
out = ROOT / "documenten/LWPRINTS3D-algemene-voorwaarden.docx"
doc.save(out)
print("opgeslagen:", out)
