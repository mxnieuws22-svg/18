# LWPRINTS logo-bestanden

Eigen blokletters (geen lettertype), dus vrij te gebruiken en goed te printen.
Kleuren: zwart #111111, wit #FFFFFF, oranje #FF6B00.

| Bestand | Gebruik |
|---|---|
| lwprints-logo-1-woordmerk(-wit).svg | Richting 1: woordmerk, de I in oranje |
| lwprints-logo-2-lagen(-wit).svg | Richting 2: letters uit printlagen |
| lwprints-logo-3-kubus(-wit).svg | Richting 3: kubus naast de naam |
| lwprints-beeldmerk.svg | Profielfoto, favicon, kleine producten |
| sleutelhanger-basis.stl / -inleg.stl | Printklaar: 54 × 18 × 3 mm, inleg 0,6 mm |
| sleutelhanger-*.svg | Dezelfde sleutelhanger als 2D-bestand |

## Sleutelhanger printen (twee kleuren)
1. Laad `sleutelhanger-basis.stl` en `sleutelhanger-inleg.stl` tegelijk in de slicer.
2. Kies "laden als één object met meerdere onderdelen" als de slicer dat vraagt.
3. Geef de basis zwart en de inleg groen (of oranje).
4. Laaghoogte 0,2 mm. Zet 10 stuks op de plaat om het spoelafval te verdelen.

Aanpassen: wijzig de maten in `bron/maak_logo.py` (blok KH) en draai `python3 logo/bron/maak_logo.py`.
Nodig: `pip install shapely trimesh mapbox_earcut manifold3d`.
