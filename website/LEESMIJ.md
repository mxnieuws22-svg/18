# Website lwprints3d.nl

Snelle statische website (HTML/CSS) met één serverfunctie voor het offerteformulier.
Geen cookies, geen externe lettertypes, geen tracking.

## Wat je eerst invult
Open `bron/bouw.py` en vul bovenaan `GEGEVENS` in: e-mailadres, telefoonnummer, KVK-nummer en eventueel WhatsApp.
Draai daarna `python3 bron/bouw.py` om alle pagina's opnieuw te maken.
Vul op de pagina **Over** (`over` in `bron/bouw.py`) je eigen verhaal in, op de plek tussen [haken].

## Online zetten met Vercel
1. Vercel → **Add New → Project** → kies de GitHub-repo.
2. **Root Directory:** `website`. Framework: **Other**. Build command leeg laten.
3. **Settings → Environment Variables** (voor het offerteformulier):
   | Naam | Waarde |
   |---|---|
   | SMTP_HOST | smtp.gmail.com |
   | SMTP_PORT | 465 |
   | SMTP_USER | je Gmail-adres |
   | SMTP_PASS | een Gmail **app-wachtwoord** (niet je gewone wachtwoord) |
   | OFFERTE_NAAR | info@lwprints.nl |
4. **Settings → Domains:** koppel `lwprints3d.nl` en `www.lwprints3d.nl` aan dit project.
5. **Settings → Deployment Protection:** zet bescherming voor productie uit, anders zien bezoekers een inlogscherm.
6. Deploy opnieuw nadat je de variabelen hebt ingesteld.

Zonder de SMTP-variabelen werkt de site wel, maar geeft het formulier een melding met een link om per e-mail te versturen.

## Lokaal testen
```
npm install
OFFERTE_TEST=1 node bron/dev-server.js
```
Open http://localhost:3000. Met `OFFERTE_TEST=1` wordt er geen echte mail verstuurd.

## Bestanden
| Bestand | Wat |
|---|---|
| `*.html` | De pagina's (gemaakt door `bron/bouw.py`) |
| `assets/css/style.css` | Opmaak en kleuren |
| `assets/js/main.js` | Mobiel menu en offerteformulier |
| `api/offerte.js` | Verstuurt offerteaanvragen per e-mail (max. 4 MB bijlage) |
| `vercel.json` | Schone URL's en beveiligingsheaders |
| `sitemap.xml`, `robots.txt` | Voor Google |

## Algemene voorwaarden
De tekst staat in `bron/voorwaarden.py` en wordt de pagina `/algemene-voorwaarden`.
Het is een model, geen juridisch advies: laat het controleren voordat je de site live zet.
