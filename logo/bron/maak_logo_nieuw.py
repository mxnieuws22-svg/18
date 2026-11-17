"""Drie nieuwe logo-richtingen voor LWPRINTS3D. Gebruik: python3 logo/bron/maak_logo_nieuw.py"""
import math
import sys
from pathlib import Path

from shapely import affinity
from shapely.geometry import LineString, Polygon, box
from shapely.ops import unary_union

sys.path.insert(0, str(Path(__file__).resolve().parent))
from maak_logo import GAP, LETTERS, place, svg  # noqa: E402
import maak_logo_3d as m3  # noqa: E402  (voegt de letters 3 en D toe)

OUT = Path(__file__).resolve().parent.parent / "nieuw"
OUT.mkdir(exist_ok=True)
ZWART, WIT, BLAUW, GRIJS_D, GRIJS_L = "#111111", "#FFFFFF", "#1F8BFF", "#9CA3AF", "#4B5563"


def letters(text):
    x, out = 0, []
    for ch in text:
        w, poly = LETTERS[ch]
        out.append(affinity.translate(poly, x, 0))
        x += w + GAP
    return out, x - GAP


def wordmark():
    main, blue, w = m3.word_parts("LWPRINTS3D", 8)
    return main, blue, w


def lockup(icon_layers, main_color, icon_w=240):
    wm, wb, w = wordmark()
    s = 0.6
    x, y = icon_w + 26, (240 - 100 * s) / 2
    layers = list(icon_layers) + [(place(wm, x, y, s), main_color), (place(wb, x, y, s), BLAUW)]
    return svg(round(x + w * s + 16), 240, layers)


# --- A: nozzle (zeskant + punt) met LW erin --------------------------------
def nozzle_icon(main):
    c = 120
    R = 96
    hexa = Polygon([(c + R * math.cos(math.radians(a)), 104 + R * math.sin(math.radians(a))) for a in range(0, 360, 60)])
    ring = hexa.difference(hexa.buffer(-11, join_style="mitre"))
    tip = Polygon([(c - 26, 104 + R * math.sin(math.radians(60))), (c + 26, 104 + R * math.sin(math.radians(60))), (c, 104 + R * 0.866 + 30)])
    tip = tip.difference(box(0, 0, 240, 104 + R * 0.866))
    s = 0.62
    tw = (52 + GAP + 88) * s
    x0, y0 = c - tw / 2, 104 - 50 * s
    L = place(LETTERS["L"][1], x0, y0, s)
    W = place(LETTERS["W"][1], x0 + (52 + GAP) * s, y0, s)
    drop = LineString([(c, 104 + R * 0.866 + 32), (c, 236)]).buffer(4, cap_style="round")
    return [(unary_union([ring, L]), main), (unary_union([W, tip, drop]), BLAUW)]


# --- B: isometrische kubus met L en W in de zijvlakken --------------------
def iso_icon(main):
    cx, cy, a = 120, 120, 104
    dx, dy = a * math.cos(math.radians(30)), a * math.sin(math.radians(30))
    top = Polygon([(cx, cy - a), (cx + dx, cy - a + dy), (cx, cy - a + 2 * dy), (cx - dx, cy - a + dy)])
    left = Polygon([(cx - dx, cy - a + dy), (cx, cy - a + 2 * dy), (cx, cy + 2 * dy), (cx - dx, cy + dy)])
    right = Polygon([(cx, cy - a + 2 * dy), (cx + dx, cy - a + dy), (cx + dx, cy + dy), (cx, cy + 2 * dy)])

    def on_face(poly, origin, u, v, w_units):
        # letter (0..w, 0..100) -> vlak; u = richting langs de breedte, v = omlaag
        k = 0.62
        m = 0.19
        ox = origin[0] + u[0] * (1 - k) / 2 * 1 + v[0] * m
        oy = origin[1] + u[1] * (1 - k) / 2 * 1 + v[1] * m
        sx = k / w_units
        sy = (1 - 2 * m) / 100
        return affinity.affine_transform(poly, [u[0] * sx, v[0] * sy, u[1] * sx, v[1] * sy, ox, oy])

    lo = (cx - dx, cy - a + dy)
    u_l, v = (dx, dy), (0, a)
    L = on_face(LETTERS["L"][1], lo, u_l, v, LETTERS["L"][0])
    ro = (cx, cy - a + 2 * dy)
    u_r = (dx, -dy)
    W = on_face(LETTERS["W"][1], ro, u_r, v, LETTERS["W"][0])
    gap = 3
    left_f = left.buffer(-gap / 2, join_style="mitre").difference(L)
    right_f = right.buffer(-gap / 2, join_style="mitre").difference(W)
    top_f = top.buffer(-gap / 2, join_style="mitre")
    return [(left_f, main), (right_f, GRIJS_L if main == ZWART else GRIJS_D), (top_f, BLAUW)]


# --- C: woordmerk met blauwe 3D-diepte -----------------------------------
def extrude(polys, depth=9, step=0.5):
    shadow = unary_union([affinity.translate(p, d, d) for p in polys for d in [i * step for i in range(1, int(depth / step) + 1)]])
    face = unary_union(polys)
    return face, shadow.difference(face)


def extruded_wordmark(main):
    ls, w = letters("LWPRINTS3D")
    face, shadow = extrude(ls)
    return svg(round(w + 50), 150, [(place(shadow, 20, 22), BLAUW), (place(face, 20, 22), main)])


def extruded_icon(main, bg):
    ls, w = letters("LW")
    face, shadow = extrude(ls, depth=10)
    size, r = 240, 44
    sq = box(0, 0, size, size).buffer(-r).buffer(r, quad_segs=16)
    s = 1.12
    dx, dy = (size - (w + 10) * s) / 2, (size - 110 * s) / 2
    return svg(size, size, [(sq, bg), (place(shadow, dx, dy, s), BLAUW), (place(face, dx, dy, s), main)])


if __name__ == "__main__":
    for main, suf in [(ZWART, ""), (WIT, "-wit")]:
        (OUT / f"A-nozzle-beeldmerk{suf}.svg").write_text(svg(240, 240, nozzle_icon(main)))
        (OUT / f"A-nozzle-liggend{suf}.svg").write_text(lockup(nozzle_icon(main), main))
        (OUT / f"B-kubus-beeldmerk{suf}.svg").write_text(svg(240, 240, iso_icon(main)))
        (OUT / f"B-kubus-liggend{suf}.svg").write_text(lockup(iso_icon(main), main))
        (OUT / f"C-3d-woordmerk{suf}.svg").write_text(extruded_wordmark(main))
    (OUT / "C-3d-beeldmerk.svg").write_text(extruded_icon(WIT, ZWART))
    (OUT / "C-3d-beeldmerk-licht.svg").write_text(extruded_icon(ZWART, "#EEF2F7"))
    print("klaar")
