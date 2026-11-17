"""Genereert de LWPRINTS-logo's (SVG) en de sleutelhanger (STL).

Eigen blokletters, geen lettertype: uniek, geen licentie nodig en goed te printen
(streepdikte 22 eenheden op een letterhoogte van 100).

Gebruik:  python3 logo/bron/maak_logo.py
"""
from pathlib import Path

import trimesh
from shapely import affinity
from shapely.geometry import MultiPolygon, Point, Polygon, box
from shapely.ops import unary_union

OUT = Path(__file__).resolve().parent.parent
ZWART, WIT, ORANJE, GRIJS = "#111111", "#FFFFFF", "#FF6B00", "#3A3A3A"

# --- letters: hoogte 100, y naar beneden -----------------------------------
def P_(pts, holes=()):
    return Polygon(pts, holes=[h for h in holes])

LETTERS = {
    "L": (52, P_([(0, 0), (22, 0), (22, 78), (52, 78), (52, 100), (0, 100)])),
    "W": (88, P_([(0, 0), (20, 0), (27, 60), (35, 18), (53, 18), (61, 60), (68, 0), (88, 0),
                  (75, 100), (55, 100), (44, 50), (33, 100), (13, 100)])),
    "P": (58, P_([(0, 0), (58, 0), (58, 62), (22, 62), (22, 100), (0, 100)],
                 [[(22, 22), (36, 22), (36, 40), (22, 40)]])),
    "R": (60, P_([(0, 0), (58, 0), (58, 62), (44, 62), (60, 100), (37, 100), (24, 62),
                  (22, 62), (22, 100), (0, 100)],
                 [[(22, 22), (36, 22), (36, 40), (22, 40)]])),
    "I": (22, P_([(0, 0), (22, 0), (22, 100), (0, 100)])),
    "N": (64, P_([(0, 0), (21, 0), (43, 56), (43, 0), (64, 0), (64, 100), (43, 100),
                  (21, 44), (21, 100), (0, 100)])),
    "T": (60, P_([(0, 0), (60, 0), (60, 22), (41, 22), (41, 100), (19, 100), (19, 22), (0, 22)])),
    "S": (58, P_([(0, 0), (58, 0), (58, 22), (22, 22), (22, 39), (58, 39), (58, 100), (0, 100),
                  (0, 78), (36, 78), (36, 61), (0, 61)])),
}
GAP = 9


def word(text, accent_index=None):
    """Geeft (vorm in zwart, vorm in accent, breedte)."""
    x, main, accent = 0, [], []
    for i, ch in enumerate(text):
        w, poly = LETTERS[ch]
        (accent if i == accent_index else main).append(affinity.translate(poly, x, 0))
        x += w + GAP
    return unary_union(main), unary_union(accent) if accent else None, x - GAP


def place(geom, dx, dy, s=1.0):
    return affinity.translate(affinity.scale(geom, s, s, origin=(0, 0)), dx, dy)


def path_d(geom):
    polys = geom.geoms if isinstance(geom, MultiPolygon) else [geom]
    out = []
    for p in polys:
        if p.is_empty:
            continue
        for ring in [p.exterior, *p.interiors]:
            c = list(ring.coords)[:-1]
            out.append("M" + " L".join(f"{x:.2f} {y:.2f}" for x, y in c) + " Z")
    return " ".join(out)


def svg(w, h, layers, unit=""):
    size = f'width="{w}{unit}" height="{h}{unit}"' if unit else f'width="{w}" height="{h}"'
    body = "\n".join(f'  <path fill="{c}" fill-rule="evenodd" d="{path_d(g)}"/>' for g, c in layers if g and not g.is_empty)
    return f'<svg xmlns="http://www.w3.org/2000/svg" {size} viewBox="0 0 {w} {h}">\n{body}\n</svg>\n'


def save(name, content):
    (OUT / name).write_text(content)


def stripes(geom, band=10.0, gap=3.5):
    """Snijdt een vorm in horizontale 'printlagen'. Geeft (lagen, bovenste laag)."""
    minx, miny, maxx, maxy = geom.bounds
    bands, y = [], miny
    while y < maxy:
        bands.append(box(minx - 1, y, maxx + 1, min(y + band, maxy)))
        y += band + gap
    top = geom.intersection(bands[0])
    rest = geom.intersection(unary_union(bands[1:]))
    return rest, top


# --- 1. woordmerk ----------------------------------------------------------
def logo1(color):
    main, acc, w = word("LWPRINTS", accent_index=4)  # de I in oranje: de printkop
    pad = 30
    return svg(round(w + 2 * pad), 160, [(place(main, pad, 30), color), (place(acc, pad, 30), ORANJE)])


# --- 2. lagen --------------------------------------------------------------
def logo2(color):
    main, _, w = word("LWPRINTS")
    rest, top = stripes(main)
    pad = 30
    return svg(round(w + 2 * pad), 160, [(place(rest, pad, 30), color), (place(top, pad, 30), ORANJE)])


# --- 3. kubus + woordmerk --------------------------------------------------
def cube_layers(cx, cy, a, side_color, line_color):
    import math
    dx, dy = a * math.cos(math.radians(30)), a * math.sin(math.radians(30))
    top = Polygon([(cx, cy - a), (cx + dx, cy - a + dy), (cx, cy - a + 2 * dy), (cx - dx, cy - a + dy)])
    left = Polygon([(cx - dx, cy - a + dy), (cx, cy - a + 2 * dy), (cx, cy + 2 * dy), (cx - dx, cy + dy)])
    right = Polygon([(cx, cy - a + 2 * dy), (cx + dx, cy - a + dy), (cx + dx, cy + dy), (cx, cy + 2 * dy)])
    lines = []
    n = 5
    for k in range(1, n):
        t = k * a / n
        lines.append(box(0, 0, 0, 0))  # placeholder voor gelijke lengte
        # dunne strook als laaglijn op beide zijvlakken
        lines.append(Polygon([(cx - dx, cy - a + dy + t), (cx, cy - a + 2 * dy + t),
                              (cx, cy - a + 2 * dy + t + 2.2), (cx - dx, cy - a + dy + t + 2.2)]))
        lines.append(Polygon([(cx, cy - a + 2 * dy + t), (cx + dx, cy - a + dy + t),
                              (cx + dx, cy - a + dy + t + 2.2), (cx, cy - a + 2 * dy + t + 2.2)]))
    sides = unary_union([left, right]).difference(unary_union(lines))
    return top, sides


def logo3(color):
    top, sides = cube_layers(60, 70, 52, color, WIT)
    main, _, w = word("LWPRINTS")
    s = 0.56
    pad = 30
    total_w = 120 + 26 + w * s + pad
    return svg(round(total_w), 160, [(sides, color), (top, ORANJE),
                                     (place(main, 146, 80 - 50 * s, s), color)])


# --- beeldmerk: gelaagde LW in een vierkant ------------------------------
def beeldmerk():
    lw, _, w = word("LW")
    rest, top = stripes(lw)
    size, r = 240, 44
    sq = box(0, 0, size, size).buffer(-r).buffer(r, quad_segs=16)
    s = 1.15
    dx, dy = (size - w * s) / 2, (size - 100 * s) / 2
    return svg(size, size, [(sq, ZWART), (place(rest, dx, dy, s), WIT), (place(top, dx, dy, s), ORANJE)])


# --- beeldmerk in stijl 1: witte LW met oranje "printbed" eronder -------
def beeldmerk1():
    lw, _, w = word("LW")
    size, r = 240, 44
    sq = box(0, 0, size, size).buffer(-r).buffer(r, quad_segs=16)
    s = 1.05
    total_h = 100 * s + 14 + 14
    dx, dy = (size - w * s) / 2, (size - total_h) / 2
    bar = box(dx, dy + 100 * s + 14, dx + w * s, dy + 100 * s + 28)
    return svg(size, size, [(sq, ZWART), (place(lw, dx, dy, s), WIT), (bar, ORANJE)])


# --- sleutelhanger (mm) ----------------------------------------------------
KH = dict(w=54.0, h=18.0, r=4.0, hole_d=5.0, hole_x=6.5, text_x=13.0, text_w=38.0,
          dikte=3.0, inleg=0.6)


def keychain_shapes():
    k = KH
    plate = box(0, 0, k["w"], k["h"]).buffer(-k["r"]).buffer(k["r"], quad_segs=16)
    hole = Point(k["hole_x"], k["h"] / 2).buffer(k["hole_d"] / 2, quad_segs=32)
    plate = plate.difference(hole)
    main, acc, w = word("LWPRINTS", accent_index=4)
    s = k["text_w"] / w
    text = place(main, k["text_x"], (k["h"] - 100 * s) / 2, s)
    accent = place(acc, k["text_x"], (k["h"] - 100 * s) / 2, s)
    return plate, text, accent


def keychain_files():
    plate, text, accent = keychain_shapes()
    k = KH
    allt = unary_union([text, accent])
    save("sleutelhanger/sleutelhanger-voorbeeld-groen.svg", svg(k["w"], k["h"], [(plate, ZWART), (allt, "#2E9E4F")], unit="mm"))
    save("sleutelhanger/sleutelhanger-voorbeeld-oranje.svg", svg(k["w"], k["h"], [(plate, ZWART), (text, WIT), (accent, ORANJE)], unit="mm"))

    # STL: SVG heeft y omlaag, 3D heeft y omhoog -> spiegel zodat de tekst leesbaar is
    def flip(g):
        return affinity.scale(g, 1, -1, origin=(0, k["h"] / 2))

    def extrude(geom, height, z0=0.0):
        polys = geom.geoms if isinstance(geom, MultiPolygon) else [geom]
        meshes = [trimesh.creation.extrude_polygon(p, height) for p in polys if not p.is_empty]
        m = trimesh.util.concatenate(meshes)
        m.apply_translation([0, 0, z0])
        return m

    full = extrude(flip(plate), k["dikte"])
    pocket = extrude(flip(allt), k["inleg"] + 0.01, k["dikte"] - k["inleg"])
    base = full.difference(pocket)
    tekst = extrude(flip(text), k["inleg"], k["dikte"] - k["inleg"])
    acc = extrude(flip(accent), k["inleg"], k["dikte"] - k["inleg"])
    base.export(OUT / "sleutelhanger/sleutelhanger-basis.stl")
    tekst.export(OUT / "sleutelhanger/sleutelhanger-tekst.stl")
    acc.export(OUT / "sleutelhanger/sleutelhanger-accent-I.stl")
    return base, tekst, acc


if __name__ == "__main__":
    for d in ["svg", "sleutelhanger", "archief"]:
        (OUT / d).mkdir(exist_ok=True)
    save("svg/lwprints-logo.svg", logo1(ZWART))
    save("svg/lwprints-logo-wit.svg", logo1(WIT))
    save("svg/lwprints-beeldmerk.svg", beeldmerk1())
    # niet gekozen richtingen, bewaard ter referentie
    save("archief/lwprints-logo-2-lagen.svg", logo2(ZWART))
    save("archief/lwprints-logo-3-kubus.svg", logo3(ZWART))
    save("archief/lwprints-beeldmerk-lagen.svg", beeldmerk())
    parts = keychain_files()
    print("klaar")
    for name, m in zip(["basis", "tekst", "accent-I"], parts):
        print(name, "watertight:", m.is_watertight, "volume mm3:", round(m.volume, 1))
