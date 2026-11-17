"""LWPRINTS3D – definitief logo ("Label"): LWPRINTS in Inter ExtraBold met een blauw 3D-label.

Alle vormen worden als geometrie opgebouwd, zodat SVG's en printbare STL's precies gelijk zijn.
Lettertype: Inter (SIL Open Font License), omgezet naar vormen.
Gebruik:  python3 logo/bron/maak_logo_label.py
"""
from functools import reduce
from pathlib import Path

import trimesh
from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont
from shapely import affinity
from shapely.geometry import MultiPolygon, Point, Polygon, box
from shapely.ops import unary_union

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
ZWART, WIT, BLAUW = "#111111", "#FFFFFF", "#1F8BFF"


# --- lettertype naar vormen ---------------------------------------------------
class _Pen(BasePen):
    def __init__(self, glyphset, steps=10):
        super().__init__(glyphset)
        self.contours, self.cur, self.steps = [], [], steps

    def _moveTo(self, p): self.cur = [p]
    def _lineTo(self, p): self.cur.append(p)

    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        for i in range(1, self.steps + 1):
            t = i / self.steps
            a, b, c, d = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t ** 2, t ** 3
            self.cur.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))

    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]
        for i in range(1, self.steps + 1):
            t = i / self.steps
            a, b, c = (1 - t) ** 2, 2 * (1 - t) * t, t ** 2
            self.cur.append((a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]))

    def _closePath(self):
        if len(self.cur) >= 3:
            self.contours.append(self.cur)
        self.cur = []

    _endPath = _closePath


class Font:
    def __init__(self, file):
        f = TTFont(file)
        self.gs, self.cmap, self.upm = f.getGlyphSet(), f.getBestCmap(), f["head"].unitsPerEm
        self.cap = f["OS/2"].sCapHeight

    def glyph(self, ch):
        pen = _Pen(self.gs)
        name = self.cmap[ord(ch)]
        self.gs[name].draw(pen)
        polys = [Polygon(c).buffer(0) for c in pen.contours]
        geom = reduce(lambda a, b: a.symmetric_difference(b), polys) if polys else Polygon()
        return geom, self.gs[name].width

    def text(self, s, size, spacing=0.0):
        """Tekst als vorm, basislijn op y=0 en y naar beneden. Geeft (vorm, breedte)."""
        k = size / self.upm
        x, parts = 0.0, []
        for ch in s:
            g, adv = self.glyph(ch)
            parts.append(affinity.translate(affinity.scale(g, k, -k, origin=(0, 0)), x, 0))
            x += adv * k + spacing * size
        return unary_union(parts), x - spacing * size


INTER = Font(HERE / "fonts/inter-latin-800-normal.woff")


def rounded(x, y, w, h, r):
    r = min(r, w / 2, h / 2) * 0.995  # bij precies de halve hoogte zou de vorm verdwijnen
    return box(x, y, x + w, y + h).buffer(-r).buffer(r, quad_segs=12)


# --- composities (geometrie) --------------------------------------------------
def woordmerk():
    """Liggend logo. Geeft dict met 'tekst', 'label' (blauw vlak met 3D eruit gespaard), 'label_tekst', breedte, hoogte."""
    size = 100
    cap = INTER.cap * size / INTER.upm
    pad = 20
    base = pad + cap + 14
    naam, w1 = INTER.text("LWPRINTS", size, 0.01)
    naam = affinity.translate(naam, pad, base)
    d3, w3 = INTER.text("3D", size * 0.78, 0.02)
    cap3 = INTER.cap * size * 0.78 / INTER.upm
    tag_x, tag_w, tag_h = pad + w1 + 18, w3 + 36, cap + 28
    tag = rounded(tag_x, base - cap - 14, tag_w, tag_h, 12)
    d3 = affinity.translate(d3, tag_x + 18, base - (cap - cap3) / 2)
    return {"tekst": naam, "label": tag.difference(d3), "label_tekst": d3, "w": tag_x + tag_w + pad, "h": base + 14 + pad}


def beeldmerk_vormen(S=240):
    """LW met blauw streepje, gecentreerd in een vak S x S."""
    size = 118 * S / 240
    cap = INTER.cap * size / INTER.upm
    lw, w = INTER.text("LW", size, 0.0)
    lw = affinity.translate(lw, (S - w) / 2, (S + cap) / 2 - 16 * S / 240)
    bar = rounded(S / 2 - 34 * S / 240, (S + cap) / 2 + 2 * S / 240, 68 * S / 240, 14 * S / 240, 7 * S / 240)
    return lw, bar


# --- SVG ------------------------------------------------------------------------
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


def svg(w, h, layers, extra="", unit=""):
    size = f'width="{w:.1f}{unit}" height="{h:.1f}{unit}"'
    body = "\n".join(f'  <path fill="{c}" fill-rule="evenodd" d="{path_d(g)}"/>' for g, c in layers if g is not None and not g.is_empty)
    return f'<svg xmlns="http://www.w3.org/2000/svg" {size} viewBox="0 0 {w:.1f} {h:.1f}">\n{extra}{body}\n</svg>\n'


def logo_liggend(main):
    m = woordmerk()
    return svg(m["w"], m["h"], [(m["tekst"], main), (m["label"], BLAUW)])


def logo_staand(main):
    m = woordmerk()
    lw, bar = beeldmerk_vormen()
    S = 240
    sq = rounded(0, 0, S, S, 54)
    s = 0.62
    W = max(S, m["w"] * s) + 20
    ox = (W - S) / 2
    wx = (W - m["w"] * s) / 2
    wy = S + 18
    shift = lambda g, x, y, k=1.0: affinity.translate(affinity.scale(g, k, k, origin=(0, 0)), x, y)
    bg = WIT if main == WIT else ZWART
    return svg(W, wy + m["h"] * s, [
        (shift(sq, ox, 0), bg), (shift(lw, ox, 0), ZWART if bg == WIT else WIT), (shift(bar, ox, 0), BLAUW),
        (shift(m["tekst"], wx, wy, s), main), (shift(m["label"], wx, wy, s), BLAUW)])


def beeldmerk(bg=ZWART, fg=WIT, rond=True):
    S = 240
    lw, bar = beeldmerk_vormen(S)
    sq = rounded(0, 0, S, S, 54) if rond else box(0, 0, S, S)
    return svg(S, S, [(sq, bg), (lw, fg), (bar, BLAUW)])


def beeldmerk_los(fg):
    lw, bar = beeldmerk_vormen()
    return svg(240, 240, [(lw, fg), (bar, BLAUW)])


def profielfoto():
    """Vierkant voor Instagram/Facebook; die snijden rond bij, dus LW kleiner in het midden."""
    S = 240
    lw, bar = beeldmerk_vormen(S)
    k, o = 0.78, S * 0.11
    return svg(S, S, [(box(0, 0, S, S), ZWART), (affinity.translate(affinity.scale(lw, k, k, origin=(0, 0)), o, o), WIT),
                      (affinity.translate(affinity.scale(bar, k, k, origin=(0, 0)), o, o), BLAUW)])


def hero_animatie():
    """Groot beeldmerk voor de website: LW wordt laag voor laag 'geprint', daarna verschijnt het blauwe label."""
    S = 240
    lw, bar = beeldmerk_vormen(S)
    b = lw.bounds
    m = woordmerk()
    tag = affinity.translate(affinity.scale(unary_union([m["label"], m["label_tekst"]]), 0.62, 0.62, origin=(0, 0)), 0, 0)
    t3 = m["label_tekst"]
    k = 0.5
    tb = affinity.scale(m["label"], k, k, origin=(0, 0)).bounds
    dx, dy = b[2] - tb[2], (b[1] - 14) - tb[3]  # rechtsboven, boven de W
    label = affinity.translate(affinity.scale(m["label"], k, k, origin=(0, 0)), dx, dy)
    del tag, t3
    style = f"""<style>
.lb{{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0);animation:lb 2s steps(14,end) .3s forwards}}
.bar{{transform-box:fill-box;transform-origin:50% 50%;transform:scaleX(0);animation:bar .5s ease-out 2.3s forwards}}
.tag{{transform-box:fill-box;transform-origin:0% 100%;opacity:0;transform:translateY(8px) scale(.9);animation:tag .5s cubic-bezier(.2,.8,.2,1.2) 2.6s forwards}}
@keyframes lb{{to{{transform:scaleY(1)}}}}
@keyframes bar{{to{{transform:scaleX(1)}}}}
@keyframes tag{{to{{opacity:1;transform:none}}}}
@media (prefers-reduced-motion:reduce){{.lb,.bar,.tag{{animation:none;transform:none;opacity:1}}}}
</style>
<defs><clipPath id="lwc"><rect class="lb" x="{b[0]-3:.1f}" y="{b[1]-3:.1f}" width="{b[2]-b[0]+6:.1f}" height="{b[3]-b[1]+6:.1f}"/></clipPath></defs>
"""
    body = (f'  <path fill="{WIT}" fill-rule="evenodd" clip-path="url(#lwc)" d="{path_d(lw)}"/>\n'
            f'  <path class="bar" fill="{BLAUW}" d="{path_d(bar)}"/>\n'
            f'  <path class="tag" fill="{BLAUW}" fill-rule="evenodd" d="{path_d(label)}"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -24 {S} {S + 24}" role="img" aria-label="LWPRINTS3D">\n{style}{body}\n</svg>\n'


# --- sleutelhangers (STL) -------------------------------------------------------
def _flip(g, h):
    return affinity.scale(g, 1, -1, origin=(0, h / 2))


def _extrude(geom, height, z0=0.0):
    polys = geom.geoms if isinstance(geom, MultiPolygon) else [geom]
    meshes = [trimesh.creation.extrude_polygon(p, height) for p in polys if not p.is_empty and p.area > 1e-4]
    m = trimesh.util.concatenate(meshes)
    m.apply_translation([0, 0, z0])
    return m


def _export(naam, plate, wit, blauw, h, dikte=3.0, inleg=0.6):
    d = OUT / "sleutelhanger"
    d.mkdir(exist_ok=True)
    pocket = _extrude(_flip(unary_union([wit, blauw]), h), inleg + 0.01, dikte - inleg)
    parts = {"basis": _extrude(_flip(plate, h), dikte).difference(pocket),
             "wit": _extrude(_flip(wit, h), inleg, dikte - inleg),
             "blauw": _extrude(_flip(blauw, h), inleg, dikte - inleg)}
    for k, m in parts.items():
        m.export(d / f"{naam}-{k}.stl")
    return parts


def sleutelhanger_tekst():
    m = woordmerk()
    W, H, r = 64.0, 18.0, 4.0
    plate = rounded(0, 0, W, H, r).difference(Point(6.5, H / 2).buffer(2.5, quad_segs=32))
    k = 48.0 / m["w"]
    oy = (H - m["h"] * k) / 2
    sc = lambda g: affinity.translate(affinity.scale(g, k, k, origin=(0, 0)), 11.0, oy)
    wit, blauw = sc(m["tekst"]), sc(m["label"])
    (OUT / "sleutelhanger/lwprints3d-tekst-voorbeeld.svg").write_text(svg(W, H, [(plate, ZWART), (wit, WIT), (blauw, BLAUW)], unit="mm"))
    return _export("lwprints3d-tekst", plate, wit, blauw, H)


def sleutelhanger_rond():
    D = 40.0
    lw, bar = beeldmerk_vormen(240)
    k = D / 240 * 0.9
    off_x, off_y = (D - 240 * k) / 2, (D - 240 * k) / 2 + 8
    sc = lambda g: affinity.translate(affinity.scale(g, k, k, origin=(0, 0)), off_x, off_y)
    disc = Point(D / 2, D / 2 + 8).buffer(D / 2, quad_segs=48)
    lug = box(D / 2 - 6, 0, D / 2 + 6, 14).buffer(2, quad_segs=8)
    plate = unary_union([disc, lug]).difference(Point(D / 2, 5.5).buffer(2.5, quad_segs=32))
    wit, blauw = sc(lw), sc(bar)
    h = D + 8
    (OUT / "sleutelhanger/lwprints3d-rond-voorbeeld.svg").write_text(svg(D, h, [(plate, ZWART), (wit, WIT), (blauw, BLAUW)], unit="mm"))
    return _export("lwprints3d-rond", plate, wit, blauw, h)


if __name__ == "__main__":
    S = OUT / "svg"
    S.mkdir(exist_ok=True)
    (S / "lwprints3d-liggend.svg").write_text(logo_liggend(ZWART))
    (S / "lwprints3d-liggend-wit.svg").write_text(logo_liggend(WIT))
    (S / "lwprints3d-staand.svg").write_text(logo_staand(ZWART))
    (S / "lwprints3d-staand-wit.svg").write_text(logo_staand(WIT))
    (S / "lwprints3d-beeldmerk.svg").write_text(beeldmerk())
    (S / "lwprints3d-beeldmerk-wit.svg").write_text(beeldmerk(bg=WIT, fg=ZWART))
    (S / "lwprints3d-beeldmerk-los.svg").write_text(beeldmerk_los(ZWART))
    (S / "lwprints3d-beeldmerk-los-wit.svg").write_text(beeldmerk_los(WIT))
    (S / "lwprints3d-favicon.svg").write_text(beeldmerk())
    (S / "lwprints3d-profielfoto.svg").write_text(profielfoto())
    (S / "lwprints3d-beeldmerk-animatie.svg").write_text(hero_animatie())
    for naam, parts in [("tekst", sleutelhanger_tekst()), ("rond", sleutelhanger_rond())]:
        for k, m in parts.items():
            print(f"{naam}-{k}: watertight={m.is_watertight} volume={m.volume:.1f} mm3")
    print("klaar")
