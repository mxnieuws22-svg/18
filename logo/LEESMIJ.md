# LWPRINTS huisstijl en logobestanden

## Kleuren
| Kleur | Hex | Gebruik |
|---|---|---|
| Zwart | #111111 | Logo, tekst, achtergronden |
| Wit | #FFFFFF | Achtergrond, logo op donker |
| Oranje | #FF6B00 | Alleen als accent: de I in het logo, knoppen, lijnen |

Lettertype voor teksten op website en documenten: Arial of een vergelijkbare schreefloze letter.

## Regels
- Gebruik het logo altijd uit deze bestanden. Niet opnieuw typen, niet uitrekken.
- Houd rondom het logo minstens de breedte van de letter I vrij.
- Kleinste formaat: 25 mm breed op papier, 120 pixels op een scherm. Kleiner: gebruik het beeldmerk.
- Oranje is een accent. Geen grote oranje vlakken met zwarte tekst erop.
- Op een donkere achtergrond: de witte versie.

## Bestanden
| Map | Wat |
|---|---|
| svg/ | lwprints-logo (zwart), lwprints-logo-wit, lwprints-beeldmerk. Gebruik SVG waar het kan (website, drukwerk). |
| png/ | Dezelfde logo's als afbeelding. beeldmerk-1080 = profielfoto, 512/180/32 = favicon en app-icoon. |
| social/ | Facebook-omslag 1640 × 624 en een Instagram-sjabloon 1080 × 1350. |
| sleutelhanger/ | Printklare STL's: basis, tekst en de I als apart onderdeel. |
| archief/ | Niet gekozen richtingen, alleen ter referentie. |
| ../documenten/ | Offertesjabloon (Word). |

## Sleutelhanger printen
1. Laad `sleutelhanger-basis.stl`, `sleutelhanger-tekst.stl` en `sleutelhanger-accent-I.stl` tegelijk in de slicer.
2. Kies "laden als één object met meerdere onderdelen" als de slicer dat vraagt.
3. Kleuren nu: basis zwart, tekst en I groen. Later: tekst wit, I oranje.
4. Laaghoogte 0,2 mm. Zet 10 stuks op de plaat. Maat: 54 × 18 × 3 mm, inleg 0,6 mm.

## Opnieuw maken
`pip install shapely trimesh mapbox_earcut manifold3d python-docx`, daarna
`python3 logo/bron/maak_logo.py` en `python3 logo/bron/maak_offerte.py`.
De PNG's zijn gemaakt door de SVG's in een browser te renderen.
