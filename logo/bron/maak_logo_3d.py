"""LWPRINTS3D: platte vectorversie van het printkop-logo, plus printbare sleutelhangers.

Gebruik:  python3 logo/bron/maak_logo_3d.py
"""
import math
import sys
from pathlib import Path

import trimesh
from shapely import affinity
from shapely.geometry import LineString, MultiPolygon, Point, Polygon, box
from shapely.ops import unary_union

sys.path.insert(0, str(Path(__file__).resolve().parent))
from maak_logo import LETTERS, GAP, place, svg, path_d  # noqa: E402

OUT = Path(__file__).resolve().parent.parent
ZWART, WIT, BLAUW, GRIJS = "#111111", "#FFFFFF", "#1F8BFF", "#8A939E"

LETTERS["3"] = (58, Polygon([(0, 0), (58, 0), (58, 100), (0, 100), (0, 78), (36, 78), (36, 61), (12, 61),
                             (12, 39), (36, 39), (36, 22), (0, 22)]))
LETTERS["D"] = (58, Polygon([(0, 0), (40, 0), (58, 18), (58, 82), (40, 100), (0, 100)],
                            [[(22, 22), (32, 22), (36, 26), (36, 74), (32, 78), (22, 78)]]))


def word_parts(text, blue_from):
    """Woord in hoofdkleur, met de letters vanaf index blue_from in blauw."""
    x, main, blue = 0, [], []
    for i, ch in enumerate(text):
        w, poly = LETTERS[ch]
        (blue if i >= blue_from else main).append(affinity.translate(poly, x, 0))
        x += w + GAP
    return unary_union(main), unary_union(blue), x - GAP


def arc(cx, cy, r, a0, a1, n=90):
    """Boog van a0 naar a1 graden (0 = rechts, met de klok mee in beeldcoordinaten)."""
    return LineString([(cx + r * math.cos(math.radians(a0 + (a1 - a0) * t / n)),
                        cy + r * math.sin(math.radians(a0 + (a1 - a0) * t / n))) for t in range(n + 1)])


def monogram(detail=True, fil_w=7.0):
    """Beeldmerk in een vak van 240x240: ring, printkop, L, W en filament.
    Geeft (hoofdkleur, blauw) als vormen."""
    c, r, ring_w = 120, 108, 8
    ring_main = arc(c, c, r, 95, 265).buffer(ring_w / 2, cap_style="flat")
    ring_blue = arc(c, c, r, 275, 445).buffer(ring_w / 2, cap_style="flat")

    s = 0.85
    _, wL = LETTERS["L"][0], LETTERS["L"][0]
    total = (52 + GAP + 88) * s
    x0, y0 = c - total / 2, 102
    L = place(LETTERS["L"][1], x0, y0, s)
    wx = x0 + (52 + GAP) * s
    W = place(LETTERS["W"][1], wx, y0, s)
    peak_x, peak_y = wx + 44 * s, y0 + 18 * s

    # portaal met printkop, de kop staat recht boven de middenpiek van de W
    rail = box(70, 52, 170, 61)
    ends = unary_union([box(65, 48, 75, 65), box(165, 48, 175, 65)])
    kx = peak_x
    carriage = Polygon([(kx - 16, 42), (kx + 16, 42), (kx + 16, 68), (kx + 10, 74), (kx - 10, 74), (kx - 16, 68)])
    nozzle = Polygon([(kx - 7, 74), (kx + 7, 74), (kx + 4, 81), (kx - 4, 81)])
    tip = Polygon([(kx - 4, 81), (kx + 4, 81), (kx, 88)])

    # filament: golvende lijn van de nozzle naar de W
    pts = []
    for i in range(41):
        t = i / 40
        y = 88 + t * (peak_y - 88 + 1)
        x = kx + 7 * math.sin(t * 2 * math.pi) * (1 - t)
        pts.append((x, y))
    fil = LineString(pts).buffer(fil_w / 2, cap_style="round")

    main = unary_union([ring_main, L, rail, ends, carriage, nozzle])
    blue = unary_union([ring_blue, W, tip, fil])
    if detail:
        led = box(78, 55, kx - 20, 58).union(box(kx + 20, 55, 162, 58))
        main = main.difference(led.buffer(0.01))
        blue = blue.union(led)
    main = main.difference(blue)
    return main, blue


def lockups(main_color):
    m_main, m_blue = monogram()
    w_main, w_blue, ww = word_parts("LWPRINTS3D", 8)
    files = {}

    # beeldmerk los (transparant)
    files["beeldmerk"] = svg(240, 240, [(m_main, main_color), (m_blue, BLAUW)])

    # liggend: beeldmerk links, naam rechts
    s = 0.62
    h = 240
    wx, wy = 262, (h - 100 * s) / 2
    files["liggend"] = svg(round(wx + ww * s + 20), h, [
        (m_main, main_color), (m_blue, BLAUW),
        (place(w_main, wx, wy, s), main_color), (place(w_blue, wx, wy, s), BLAUW)])

    # staand: beeldmerk boven, naam eronder
    s2 = 0.46
    W_ = max(240, ww * s2) + 40
    mx = (W_ - 240) / 2
    wy2 = 252
    files["staand"] = svg(round(W_), round(wy2 + 100 * s2 + 20), [
        (affinity.translate(m_main, mx, 0), main_color), (affinity.translate(m_blue, mx, 0), BLAUW),
        (place(w_main, (W_ - ww * s2) / 2, wy2, s2), main_color),
        (place(w_blue, (W_ - ww * s2) / 2, wy2, s2), BLAUW)])
    return files


def profielfoto():
    m_main, m_blue = monogram()
    size = 300
    bg = box(0, 0, size, size)
    return svg(size, size, [(bg, ZWART), (affinity.translate(m_main, 30, 30), WIT),
                            (affinity.translate(m_blue, 30, 30), BLAUW)])


def favicon():
    """Voor heel klein formaat (32 px): alleen LW, groot, zonder details."""
    size, r = 240, 40
    sq = box(0, 0, size, size).buffer(-r).buffer(r, quad_segs=16)
    s = 1.3
    total = (52 + GAP + 88) * s
    x0, y0 = (size - total) / 2, (size - 100 * s) / 2
    L = place(LETTERS["L"][1], x0, y0, s)
    W = place(LETTERS["W"][1], x0 + (52 + GAP) * s, y0, s)
    return svg(size, size, [(sq, ZWART), (L, WIT), (W, BLAUW)])


# --- sleutelhangers (mm) -----------------------------------------------------
def flip(g, h):
    return affinity.scale(g, 1, -1, origin=(0, h / 2))


def extrude(geom, height, z0=0.0):
    polys = geom.geoms if isinstance(geom, MultiPolygon) else [geom]
    meshes = [trimesh.creation.extrude_polygon(p, height) for p in polys if not p.is_empty and p.area > 1e-4]
    m = trimesh.util.concatenate(meshes)
    m.apply_translation([0, 0, z0])
    return m


def export_keychain(name, plate, main, blue, h, dikte=3.0, inleg=0.6):
    d = OUT / "sleutelhanger"
    d.mkdir(exist_ok=True)
    pocket = extrude(flip(unary_union([main, blue]), h), inleg + 0.01, dikte - inleg)
    base = extrude(flip(plate, h), dikte).difference(pocket)
    parts = {"basis": base,
             "wit": extrude(flip(main, h), inleg, dikte - inleg),
             "blauw": extrude(flip(blue, h), inleg, dikte - inleg)}
    for k, m in parts.items():
        m.export(d / f"{name}-{k}.stl")
    return parts


def keychain_rect():
    w, h, r = 60.0, 18.0, 4.0
    plate = box(0, 0, w, h).buffer(-r).buffer(r, quad_segs=16).difference(Point(6.5, h / 2).buffer(2.5, quad_segs=32))
    wm, wb, ww = word_parts("LWPRINTS3D", 8)
    s = 44.0 / ww
    y = (h - 100 * s) / 2
    main, blue = place(wm, 13, y, s), place(wb, 13, y, s)
    (OUT / "sleutelhanger/lwprints3d-tekst-voorbeeld.svg").write_text(
        svg(w, h, [(plate, ZWART), (main, WIT), (blue, BLAUW)], unit="mm"))
    return export_keychain("lwprints3d-tekst", plate, main, blue, h)


def keychain_round():
    D = 40.0
    k = D / 240 * 0.92
    m_main, m_blue = monogram(detail=False, fil_w=8.0)
    off = (D - 240 * k) / 2
    main = affinity.translate(affinity.scale(m_main, k, k, origin=(0, 0)), off, off + 8)
    blue = affinity.translate(affinity.scale(m_blue, k, k, origin=(0, 0)), off, off + 8)
    disc = Point(D / 2, D / 2 + 8).buffer(D / 2, quad_segs=48)
    lug = box(D / 2 - 6, 0, D / 2 + 6, 14).buffer(2, quad_segs=8)
    plate = unary_union([disc, lug]).difference(Point(D / 2, 5.5).buffer(2.5, quad_segs=32))
    h = D + 8
    (OUT / "sleutelhanger/lwprints3d-rond-voorbeeld.svg").write_text(
        svg(D, h, [(plate, ZWART), (main, WIT), (blue, BLAUW)], unit="mm"))
    return export_keychain("lwprints3d-rond", plate, main, blue, h)


if __name__ == "__main__":
    (OUT / "svg").mkdir(exist_ok=True)
    for color, suffix in [(ZWART, ""), (WIT, "-wit")]:
        for k, v in lockups(color).items():
            (OUT / f"svg/lwprints3d-{k}{suffix}.svg").write_text(v)
    (OUT / "svg/lwprints3d-profielfoto.svg").write_text(profielfoto())
    (OUT / "svg/lwprints3d-favicon.svg").write_text(favicon())
    for name, parts in [("tekst", keychain_rect()), ("rond", keychain_round())]:
        for k, m in parts.items():
            print(f"{name}-{k}: watertight={m.is_watertight} volume={m.volume:.1f} mm3")


# --- geanimeerd beeldmerk (voor de website) ----------------------------------
def animated_svg(main_color=WIT):
    """Beeldmerk met animatie: ring tekent zich, W wordt laag voor laag geprint, filament stroomt.
    Respecteert 'prefers-reduced-motion' (dan statisch eindbeeld)."""
    c, r = 120, 108
    s = 0.85
    x0, y0 = c - (52 + GAP + 88) * s / 2, 102
    L = place(LETTERS["L"][1], x0, y0, s)
    wx = x0 + (52 + GAP) * s
    W = place(LETTERS["W"][1], wx, y0, s)
    kx, peak_y = wx + 44 * s, y0 + 18 * s
    rail = unary_union([box(70, 52, 170, 61), box(65, 48, 75, 65), box(165, 48, 175, 65)])
    led = box(78, 55, kx - 20, 58).union(box(kx + 20, 55, 162, 58))
    head = unary_union([Polygon([(kx - 16, 42), (kx + 16, 42), (kx + 16, 68), (kx + 10, 74), (kx - 10, 74), (kx - 16, 68)]),
                        Polygon([(kx - 7, 74), (kx + 7, 74), (kx + 4, 81), (kx - 4, 81)])])
    tip = Polygon([(kx - 4, 81), (kx + 4, 81), (kx, 88)])
    pts = [(kx + 7 * math.sin(t / 40 * 2 * math.pi) * (1 - t / 40), 88 + t / 40 * (peak_y - 88 + 1)) for t in range(41)]
    fil_d = "M" + " L".join(f"{x:.2f} {y:.2f}" for x, y in pts)

    def arc_d(a0, a1):
        p = lambda a: (c + r * math.cos(math.radians(a)), c + r * math.sin(math.radians(a)))
        (xa, ya), (xb, yb) = p(a0), p(a1)
        return f"M{xa:.2f} {ya:.2f} A{r} {r} 0 0 1 {xb:.2f} {yb:.2f}"

    arc_len = round(2 * math.pi * r * 170 / 360, 1)
    wb = W.bounds  # minx, miny, maxx, maxy
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="LWPRINTS3D logo">
<style>
.lw-ring-m{{fill:none;stroke:{main_color};stroke-width:8}}
.lw-ring-b{{fill:none;stroke:{BLAUW};stroke-width:8;stroke-dasharray:{arc_len};stroke-dashoffset:{arc_len};animation:lw-draw 1.4s ease-out .2s forwards}}
.lw-fil{{fill:none;stroke:{BLAUW};stroke-width:7;stroke-linecap:round;stroke-dasharray:9 5;animation:lw-flow .9s linear infinite}}
.lw-tip{{fill:{BLAUW};animation:lw-pulse 1.8s ease-in-out infinite}}
.lw-led{{fill:{BLAUW};animation:lw-pulse 2.4s ease-in-out infinite}}
.lw-build{{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0);animation:lw-build 2.2s steps(12,end) .5s forwards}}
@keyframes lw-draw{{to{{stroke-dashoffset:0}}}}
@keyframes lw-flow{{to{{stroke-dashoffset:-14}}}}
@keyframes lw-pulse{{0%,100%{{opacity:1}}50%{{opacity:.45}}}}
@keyframes lw-build{{to{{transform:scaleY(1)}}}}
@media (prefers-reduced-motion:reduce){{.lw-ring-b,.lw-fil,.lw-tip,.lw-led,.lw-build{{animation:none}}.lw-ring-b{{stroke-dashoffset:0}}.lw-build{{transform:none}}}}
</style>
<defs><clipPath id="lw-wclip"><rect class="lw-build" x="{wb[0]-2:.2f}" y="{wb[1]-2:.2f}" width="{wb[2]-wb[0]+4:.2f}" height="{wb[3]-wb[1]+4:.2f}"/></clipPath></defs>
<path class="lw-ring-m" d="{arc_d(95, 265)}"/>
<path class="lw-ring-b" d="{arc_d(275, 445)}"/>
<path fill="{main_color}" fill-rule="evenodd" d="{path_d(rail.difference(led))}"/>
<path class="lw-led" d="{path_d(led)}"/>
<path fill="{main_color}" fill-rule="evenodd" d="{path_d(L)}"/>
<path fill="{BLAUW}" fill-rule="evenodd" clip-path="url(#lw-wclip)" d="{path_d(W)}"/>
<path class="lw-fil" d="{fil_d}"/>
<path fill="{main_color}" d="{path_d(head)}"/>
<path class="lw-tip" d="{path_d(tip)}"/>
</svg>
"""


if __name__ == "__main__":
    (OUT / "svg/lwprints3d-beeldmerk-animatie.svg").write_text(animated_svg(WIT))
