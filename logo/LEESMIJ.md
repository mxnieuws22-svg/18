# LWPRINTS3D huisstijl en logobestanden

Logo: "LWPRINTS" in Inter ExtraBold met een blauw 3D-label. Inter valt onder de SIL Open Font License (vrij te gebruiken, ook in een logo); de letters zijn omgezet naar vormen.

LWPRINTS3D is het 3D-printonderdeel van LWPRINTS. Kleding houdt het eigen T-shirtlogo.

## Kleuren
| Kleur | Hex | Gebruik |
|---|---|---|
| Zwart | #111111 | Logo, tekst, achtergronden |
| Wit | #FFFFFF | Achtergrond, logo op donker |
| Blauw | #1F8BFF | Accent: het 3D-label, het streepje onder LW, knoppen, lijnen |

Lettertype voor teksten op website en documenten: Arial of een vergelijkbare schreefloze letter.

## Welk logo waar
| Bestand | Gebruik |
|---|---|
| svg/lwprints3d-liggend(-wit) | Website-header, offerte, e-mailhandtekening |
| svg/lwprints3d-staand(-wit) | Flyer, visitekaartje, verpakking |
| svg/lwprints3d-beeldmerk(-wit) | Beeldmerk LW in een vierkant (zwart of wit) |
| svg/lwprints3d-beeldmerk-los(-wit) | LW zonder vierkant, voor op een eigen achtergrond |
| svg/lwprints3d-beeldmerk-animatie | Geanimeerd beeldmerk voor de website |
| svg/lwprints3d-profielfoto | Profielfoto Instagram en Facebook (zwarte achtergrond) |
| svg/lwprints3d-favicon | Alleen voor heel klein: browsertabblad, app-icoon |
| png/ | Dezelfde bestanden als afbeelding (2000 en 600 px breed) |
| social/ | Facebook-omslag 1640 × 624 en Instagram-sjabloon 1080 × 1350 |
| sleutelhanger/ | Printklare STL's: tekstversie (64 × 18 mm) en ronde versie (40 mm) |
| archief/, nieuw/, simpel/ | Eerdere en niet gekozen richtingen, alleen ter referentie |
| ../documenten/ | Offertesjabloon (Word) |

## Regels
- Gebruik het logo altijd uit deze bestanden. Niet opnieuw typen, niet uitrekken.
- Op een donkere achtergrond: de witte versie.
- Kleinste formaat liggend logo: 35 mm op papier, 160 px op scherm. Kleiner: beeldmerk of favicon.
- Blauw is een accent. Geen grote blauwe vlakken met zwarte tekst.

## Sleutelhangers printen
Elke sleutelhanger bestaat uit drie onderdelen: `-basis` (zwart), `-wit` en `-blauw`.
1. Laad de drie STL's tegelijk en kies "laden als één object met meerdere onderdelen" als de slicer dat vraagt.
2. Kleuren nu (zwart + groen): basis zwart, wit en blauw allebei groen. Later: wit en blauw filament.
3. Laaghoogte 0,2 mm, dikte 3 mm, inleg 0,6 mm. Zet meerdere op de plaat om spoelafval te verdelen.

## Opnieuw maken
`pip install shapely trimesh mapbox_earcut manifold3d python-docx`, daarna:
`python3 logo/bron/maak_logo_label.py`, `node logo/bron/render_png.js` (Playwright nodig) en `python3 logo/bron/maak_offerte.py`.
