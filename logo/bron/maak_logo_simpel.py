"""Drie eenvoudige logo-richtingen voor LWPRINTS3D met open-source lettertypes (SIL OFL),
omgezet naar vormen zodat het logo niet afhangt van een geinstalleerd lettertype.
Gebruik: python3 logo/bron/maak_logo_simpel.py"""
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "simpel"
OUT.mkdir(exist_ok=True)
F = HERE / "fonts"
ZWART, WIT, BLAUW = "#111111", "#FFFFFF", "#1F8BFF"


class Font:
    def __init__(self, file):
        self.f = TTFont(file)
        self.gs = self.f.getGlyphSet()
        self.cmap = self.f.getBestCmap()
        self.upm = self.f["head"].unitsPerEm
        self.asc = self.f["OS/2"].sCapHeight or 700
        self.xh = self.f["OS/2"].sxHeight or 500

    def text(self, s, size, x, y, spacing=0.0):
        """Pad voor tekst; (x, y) = begin van de basislijn. Geeft (d, breedte)."""
        k = size / self.upm
        pen = SVGPathPen(self.gs)
        cx = 0.0
        for ch in s:
            g = self.cmap[ord(ch)]
            tp = TransformPen(pen, (k, 0, 0, -k, x + cx, y))
            self.gs[g].draw(tp)
            cx += self.gs[g].width * k + spacing * size
        return pen.getCommands(), cx - spacing * size


def svg(w, h, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.0f}" height="{h:.0f}" viewBox="0 0 {w:.1f} {h:.1f}">\n{body}\n</svg>\n'


def path(d, color):
    return f'<path fill="{color}" d="{d}"/>'


SG = Font(F / "space-grotesk-latin-700-normal.woff")
IN = Font(F / "inter-latin-800-normal.woff")
MR = Font(F / "manrope-latin-800-normal.woff")


# --- 1: kleine letters, "3d" in blauw ------------------------------------
def r1_word(main):
    size, pad = 120, 20
    base = pad + SG.asc * size / SG.upm * 1.05
    d1, w1 = SG.text("lwprints", size, pad, base, -0.02)
    d2, w2 = SG.text("3d", size, pad + w1 + 0.01 * size, base, -0.02)
    W = pad + w1 + 0.01 * size + w2 + pad
    H = base + 0.28 * size
    return svg(W, H, path(d1, main) + path(d2, BLAUW))


def r1_mark():
    S, r = 240, 54
    size = 150
    d, w = SG.text("lw", size, 0, 0, -0.03)
    x = (S - w) / 2
    y = S / 2 + SG.xh * size / SG.upm / 2 - 6
    d, _ = SG.text("lw", size, x, y, -0.03)
    return svg(S, S, f'<rect width="{S}" height="{S}" rx="{r}" fill="{BLAUW}"/>' + path(d, WIT))


# --- 2: hoofdletters met blauw "3D"-label ---------------------------------
def r2_word(main):
    size, pad = 100, 20
    cap = IN.asc * size / IN.upm
    base = pad + cap + 14
    d1, w1 = IN.text("LWPRINTS", size, pad, base, 0.01)
    tag_x, tag_h = pad + w1 + 18, cap + 28
    ds, ws = IN.text("3D", size * 0.78, 0, 0, 0.02)
    tag_w = ws + 36
    d2, _ = IN.text("3D", size * 0.78, tag_x + 18, base - (cap - IN.asc * size * 0.78 / IN.upm) / 2, 0.02)
    W = tag_x + tag_w + pad
    H = base + 14 + pad
    tag = f'<rect x="{tag_x:.1f}" y="{base - cap - 14:.1f}" width="{tag_w:.1f}" height="{tag_h:.1f}" rx="12" fill="{BLAUW}"/>'
    return svg(W, H, path(d1, main) + tag + path(d2, WIT))


def r2_mark():
    S, r = 240, 54
    size = 118
    cap = IN.asc * size / IN.upm
    _, w = IN.text("LW", size, 0, 0, 0.0)
    d, _ = IN.text("LW", size, (S - w) / 2, (S + cap) / 2 - 16, 0.0)
    tag = f'<rect x="{S/2 - 34}" y="{(S + cap) / 2 + 2:.1f}" width="68" height="14" rx="7" fill="{BLAUW}"/>'
    return svg(S, S, f'<rect width="{S}" height="{S}" rx="{r}" fill="{ZWART}"/>' + path(d, WIT) + tag)


# --- 3: blauwe stip (de druppel uit de printer) + naam + regel ------------
def r3_word(main, sub):
    size, pad = 110, 20
    xh = MR.xh * size / MR.upm
    asc = MR.asc * size / MR.upm
    dot_r = xh * 0.42
    base = pad + asc + 6
    cx = pad + dot_r
    d1, w1 = MR.text("lwprints3d", size, pad + dot_r * 2 + 18, base, -0.02)
    d2, w2 = IN.text("3D-PRINTSERVICE · OSS", size * 0.22, pad + dot_r * 2 + 22, base + size * 0.42, 0.18)
    W = pad + dot_r * 2 + 18 + max(w1, w2) + pad
    H = base + size * 0.42 + pad
    dot = f'<circle cx="{cx:.1f}" cy="{base - xh / 2:.1f}" r="{dot_r:.1f}" fill="{BLAUW}"/>'
    return svg(W, H, dot + path(d1, main) + path(d2, sub))


def r3_mark():
    S = 240
    size = 132
    xh = MR.xh * size / MR.upm
    _, w = MR.text("lw", size, 0, 0, -0.03)
    d, _ = MR.text("lw", size, (S - w) / 2, S / 2 + xh / 2 + 4, -0.03)
    return svg(S, S, f'<circle cx="{S/2}" cy="{S/2}" r="{S/2}" fill="{BLAUW}"/>' + path(d, WIT))


if __name__ == "__main__":
    (OUT / "1-klein-woordmerk.svg").write_text(r1_word(ZWART))
    (OUT / "1-klein-woordmerk-wit.svg").write_text(r1_word(WIT))
    (OUT / "1-klein-beeldmerk.svg").write_text(r1_mark())
    (OUT / "2-label-woordmerk.svg").write_text(r2_word(ZWART))
    (OUT / "2-label-woordmerk-wit.svg").write_text(r2_word(WIT))
    (OUT / "2-label-beeldmerk.svg").write_text(r2_mark())
    (OUT / "3-stip-woordmerk.svg").write_text(r3_word(ZWART, "#6B7280"))
    (OUT / "3-stip-woordmerk-wit.svg").write_text(r3_word(WIT, "#9CA3AF"))
    (OUT / "3-stip-beeldmerk.svg").write_text(r3_mark())
    print("klaar")
