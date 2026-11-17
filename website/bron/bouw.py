"""Bouwt de HTML-pagina's van lwprints3d.nl.

Pas bedrijfsgegevens aan in GEGEVENS hieronder en draai:  python3 website/bron/bouw.py
(Je kunt de HTML-bestanden daarna ook direct bewerken; draai dit script dan niet opnieuw.)
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://lwprints3d.nl"

# --- VUL IN ------------------------------------------------------------------
GEGEVENS = {
    "naam": "LWPRINTS3D",
    "moeder": "LWPRINTS",
    "moeder_url": "https://lwprints.nl",
    "email": "[jouw-e-mailadres]",
    "telefoon": "[jouw telefoonnummer]",
    "whatsapp": "",  # bijv. 31612345678 (zonder + en spaties); leeg = geen WhatsApp-knop
    "plaats": "Oss",
    "werkgebied": "Oss, Uden, Veghel, Nijmegen en omgeving",
    "kvk": "[KVK-nummer]",
    "contactpersoon": "Luc",
}
# ---------------------------------------------------------------------------

G = GEGEVENS

ICONS = {
    "printer": '<path d="M6 3h12v3H6zM4 6h16v10H4z" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M10 16h4l-1 3h-2z" fill="#1F8BFF"/><path d="M12 19v2" stroke="#1F8BFF" stroke-width="1.8"/>',
    "potlood": '<path d="M4 20l1-5L16 4l4 4L9 19z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 6l4 4" stroke="#1F8BFF" stroke-width="1.8"/>',
    "tandwiel": '<circle cx="12" cy="12" r="3.2" fill="none" stroke="#1F8BFF" stroke-width="1.8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="7" fill="none" stroke="#fff" stroke-width="1.8"/>',
    "kubus": '<path d="M12 2l9 5v10l-9 5-9-5V7z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 12l9-5M12 12v10M12 12L3 7" stroke="#1F8BFF" stroke-width="1.8"/>',
    "stapel": '<path d="M3 8l9-4 9 4-9 4z" fill="none" stroke="#1F8BFF" stroke-width="1.8" stroke-linejoin="round"/><path d="M3 12l9 4 9-4M3 16l9 4 9-4" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>',
    "sleutel": '<circle cx="7" cy="12" r="4" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M11 12h10M18 12v3M15 12v2" stroke="#1F8BFF" stroke-width="1.8"/>',
    "telefoon": '<rect x="7" y="2" width="10" height="16" rx="2" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M4 22h16l-2-4H6z" fill="none" stroke="#1F8BFF" stroke-width="1.8" stroke-linejoin="round"/>',
    "boor": '<path d="M3 9h11v6H3zM14 11h4M18 12h3" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M6 15v6h4v-6" fill="none" stroke="#1F8BFF" stroke-width="1.8"/>',
    "gereedschap": '<path d="M4 20l8-8M14 4a4 4 0 1 0 6 6l-3-1-2-2z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><path d="M3 4h7M6.5 4v6" stroke="#1F8BFF" stroke-width="1.8"/>',
    "lade": '<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M3 12h18M12 5v14M7.5 12v7" stroke="#1F8BFF" stroke-width="1.8"/>',
    "kabel": '<path d="M3 17c4 0 4-10 9-10s5 10 9 10" fill="none" stroke="#fff" stroke-width="1.8"/><rect x="9" y="5" width="6" height="4" rx="1" fill="#1F8BFF"/>',
    "bord": '<rect x="3" y="7" width="18" height="10" rx="2" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M7 12h10" stroke="#1F8BFF" stroke-width="2.4"/>',
    "qr": '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 19h2M19 14h2" stroke="#1F8BFF" stroke-width="1.8"/>',
    "mal": '<rect x="3" y="6" width="18" height="12" rx="1.5" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="8" cy="12" r="1.8" fill="#1F8BFF"/><circle cx="16" cy="12" r="1.8" fill="#1F8BFF"/>',
    "locatie": '<path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="10" r="2.5" fill="#1F8BFF"/>',
    "snel": '<circle cx="12" cy="13" r="8" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M12 13V8M12 13l3 2" stroke="#1F8BFF" stroke-width="1.8"/><path d="M9 2h6" stroke="#fff" stroke-width="1.8"/>',
    "check": '<path d="M4 12l5 5L20 6" fill="none" stroke="#1F8BFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
}


def icon(name, size=None):
    s = f' width="{size}" height="{size}"' if size else ""
    return f'<svg viewBox="0 0 24 24"{s} aria-hidden="true">{ICONS[name]}</svg>'


NAV = [("index.html", "Home"), ("diensten.html", "Diensten"), ("producten.html", "Producten"),
       ("zakelijk.html", "Zakelijk"), ("over.html", "Over"), ("veelgestelde-vragen.html", "Vragen"),
       ("contact.html", "Contact")]


def href(page):
    return "/" if page == "index.html" else "/" + page.replace(".html", "")


def layout(page, title, desc, body):
    nav = "".join(
        f'<a href="{href(p)}"{" aria-current=\"page\"" if p == page else ""}>{label}</a>' for p, label in NAV)
    wa = (f'<li><a href="https://wa.me/{G["whatsapp"]}">WhatsApp</a></li>' if G["whatsapp"] else "")
    ld = {
        "@context": "https://schema.org", "@type": "LocalBusiness", "name": G["naam"],
        "description": "3D-printservice in Oss: onderdelen, prototypes, kleine series en producten op maat.",
        "url": SITE, "image": f"{SITE}/assets/img/lwprints3d-profielfoto-1080.png",
        "areaServed": ["Oss", "Uden", "Veghel", "Nijmegen"], "address": {"@type": "PostalAddress", "addressLocality": G["plaats"], "addressCountry": "NL"},
        "parentOrganization": {"@type": "Organization", "name": G["moeder"], "url": G["moeder_url"]},
    }
    canonical = SITE + href(page)
    return f"""<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{SITE}/assets/img/lwprints3d-profielfoto-1080.png">
<meta property="og:locale" content="nl_NL">
<meta name="theme-color" content="#111111">
<link rel="icon" href="/assets/img/lwprints3d-favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/img/lwprints3d-favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/lwprints3d-favicon-180.png">
<link rel="stylesheet" href="/assets/css/style.css">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
<a class="skip" href="#inhoud">Naar de inhoud</a>
<header class="site-header">
  <div class="wrap">
    <a class="logo" href="/" aria-label="{G['naam']} home"><img src="/assets/img/lwprints3d-liggend-wit.svg" alt="{G['naam']}" width="180" height="62"></a>
    <button class="nav-toggle" aria-label="Menu" aria-expanded="false">&#9776;</button>
    <nav class="nav" aria-label="Hoofdmenu">{nav}<a class="btn btn-blauw" href="/offerte">Offerte aanvragen</a></nav>
  </div>
</header>
<main id="inhoud">
{body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="kolommen">
      <div>
        <a class="logo" href="/"><img src="/assets/img/lwprints3d-liggend-wit.svg" alt="{G['naam']}" width="150" height="52"></a>
        <p>3D-printservice uit {G['plaats']}. Onderdelen, prototypes en producten op maat voor bedrijven en particulieren.</p>
        <p>{G['naam']} is een onderdeel van <a href="{G['moeder_url']}">{G['moeder']}</a>. Kleding bedrukken? Kijk op <a href="{G['moeder_url']}">{G['moeder_url'].replace('https://', '')}</a>.</p>
      </div>
      <div>
        <h3>Pagina's</h3>
        <ul>{"".join(f'<li><a href="{href(p)}">{label}</a></li>' for p, label in NAV)}<li><a href="/offerte">Offerte aanvragen</a></li></ul>
      </div>
      <div>
        <h3>Contact</h3>
        <ul>
          <li><a href="mailto:{G['email']}">{G['email']}</a></li>
          <li>{G['telefoon']}</li>
          {wa}
          <li>Werkgebied: {G['werkgebied']}</li>
          <li>KVK {G['kvk']}</li>
        </ul>
      </div>
    </div>
    <div class="onder"><span>&copy; <span data-jaar>2026</span> {G['naam']} · onderdeel van {G['moeder']}</span><a href="/privacy">Privacyverklaring</a></div>
  </div>
</footer>
<script src="/assets/js/main.js" defer></script>
</body>
</html>
"""


def cta(titel="Twijfel je of iets geprint kan worden?", tekst="Stuur een foto of tekening. Je krijgt eerlijk antwoord, ook als het antwoord nee is."):
    return f"""<section><div class="wrap"><div class="cta"><div><h2>{titel}</h2><p>{tekst}</p></div>
<a class="btn btn-blauw" href="/offerte">Offerte aanvragen</a></div></div></section>"""


# --- Producten ----------------------------------------------------------------
PRODUCTEN = [
    ("sleutel", "Sleutelhangers met naam of logo", "€ 25,00", "per 10 stuks",
     "Stevige sleutelhanger met jouw naam of bedrijfslogo in een tweede kleur. Ideaal als relatiegeschenk of voor sleutellabels."),
    ("telefoon", "Telefoonstandaard met naam", "€ 14,95", "per stuk",
     "Stevige bureaustandaard, past ook met hoesje. Met een naam of logo aan de voorkant. Een persoonlijk cadeau."),
    ("boor", "Wandhouder voor accuboormachine", "€ 24,95", "per stuk",
     "Boormachine, accu en bits op één vaste plek. Geprint in sterk PETG. Geef het type van je machine door, dan passen wij hem aan."),
    ("gereedschap", "Gereedschapshouders", "€ 19,95", "set van 3",
     "Houders voor schroevendraaiers, tangen en steeksleutels, voor aan de wand of het gaatjesbord."),
    ("lade", "Lade-indeling op maat", "€ 34,95", "per lade",
     "Bakjes op maat van jouw lade, tot 40 × 30 cm. Stuur de binnenmaten, wij maken een voorstel."),
    ("kabel", "Kabelclips", "€ 9,95", "set van 10",
     "Clips voor onder het bureau of langs de werkbank. Nooit meer losse kabels."),
    ("bord", "Naambord voor bureau of deur", "€ 17,50", "per stuk",
     "Naambord in twee kleuren, staand op het bureau of op de deur. Per medewerker bij te bestellen."),
    ("qr", "QR-standaard", "€ 14,95", "per stuk · 5 voor € 59",
     "Standaard met QR-code voor je menukaart, wifi, betaalverzoek of Google-review. In jouw kleuren."),
]


def producten_grid(limit=None):
    items = PRODUCTEN[:limit] if limit else PRODUCTEN
    out = []
    for ic, naam, prijs, eenheid, tekst in items:
        out.append(f"""<article class="kaart product"><div class="beeld">{icon(ic)}</div>
<h3>{naam}</h3><p class="muted">{tekst}</p>
<p class="prijs">{prijs} <small>{eenheid}</small></p>
<a class="btn btn-rand" style="width:100%" href="/offerte?product={naam.replace(' ', '%20')}">Bestellen</a></article>""")
    return '<div class="grid grid-4">' + "".join(out) + "</div>"


# --- Pagina's -----------------------------------------------------------------
def home():
    return f"""
<section class="hero"><div class="wrap">
  <div>
    <div class="kicker">3D-printservice · {G['plaats']}</div>
    <h1>3D-printwerk uit {G['plaats']}. Van idee tot onderdeel.</h1>
    <p class="lead">Onderdelen, prototypes en producten op maat. Getekend en geprint in {G['plaats']}, meestal klaar binnen 5 werkdagen.</p>
    <div class="acties"><a class="btn btn-blauw" href="/offerte">Offerte aanvragen</a><a class="btn btn-rand" href="/producten">Bekijk producten</a></div>
  </div>
  <div class="beeld"><img src="/assets/img/lwprints3d-beeldmerk-wit.svg" alt="" width="380" height="380"></div>
</div></section>

<section><div class="wrap">
  <div class="grid grid-3">
    <div class="kaart"><div class="icoon">{icon('potlood')}</div><h3>Op maat</h3><p>Stuur een tekening, een foto of het kapotte onderdeel. Wij tekenen het na en printen het.</p></div>
    <div class="kaart"><div class="icoon">{icon('snel')}</div><h3>Snel en lokaal</h3><p>De meeste opdrachten zijn binnen 5 werkdagen klaar. Afhalen in {G['plaats']} of laten verzenden.</p></div>
    <div class="kaart"><div class="icoon">{icon('stapel')}</div><h3>Bedrijf en particulier</h3><p>Van één knopje tot een serie van 50 stuks. Staffelkorting vanaf 10 stuks.</p></div>
  </div>
</div></section>

<section class="grijs"><div class="wrap">
  <div class="sectie-kop"><div class="kicker">Zo werkt het</div><h2>In vier stappen geregeld</h2></div>
  <div class="grid grid-4 stappen">
    <div class="stap"><h3>Aanvraag</h3><p>Je stuurt je idee, maten of bestand.</p></div>
    <div class="stap"><h3>Offerte</h3><p>Binnen één werkdag krijg je een vaste prijs.</p></div>
    <div class="stap"><h3>Printen</h3><p>Na akkoord tekenen en printen wij.</p></div>
    <div class="stap"><h3>Klaar</h3><p>Ophalen in {G['plaats']} of thuisbezorgd.</p></div>
  </div>
</div></section>

<section><div class="wrap">
  <div class="sectie-kop"><div class="kicker">Producten</div><h2>Slim opgeruimd, persoonlijk gemaakt</h2>
  <p class="muted">Ons eigen assortiment. Elk product is aan te passen in kleur, maat en tekst.</p></div>
  {producten_grid(4)}
  <p style="margin-top:24px"><a class="btn btn-rand" href="/producten">Alle producten</a></p>
</div></section>

<section class="grijs"><div class="wrap">
  <div class="grid grid-2" style="align-items:center">
    <div><div class="sectie-kop" style="margin:0"><div class="kicker">Zakelijk</div><h2>Hulpstukken voor je bedrijf, binnen een week</h2>
    <p>Een mal die je monteur elke dag tijd scheelt. Een afdekkap die niet meer leverbaar is. Een prototype voor je klant. Wij maken het, in de regio en zonder minimale afname.</p>
    <a class="btn btn-blauw" href="/zakelijk">Meer voor bedrijven</a></div></div>
    <div class="grid grid-2">
      <div class="kaart"><div class="icoon">{icon('mal')}</div><h3>Mallen</h3><p class="muted">Boren en monteren op dezelfde plek.</p></div>
      <div class="kaart"><div class="icoon">{icon('kubus')}</div><h3>Prototypes</h3><p class="muted">Vorm en pasvorm testen.</p></div>
      <div class="kaart"><div class="icoon">{icon('tandwiel')}</div><h3>Onderdelen</h3><p class="muted">Ook als ze niet meer leverbaar zijn.</p></div>
      <div class="kaart"><div class="icoon">{icon('stapel')}</div><h3>Kleine series</h3><p class="muted">Tot enkele tientallen stuks.</p></div>
    </div>
  </div>
</div></section>
{cta()}"""


def diensten():
    diensten_lijst = [
        ("printer", "3D-printservice", "Heb je al een bestand (STL, STEP of 3MF)? Wij printen het in PLA, PETG of flexibel TPU."),
        ("potlood", "Tekenen en ontwerpen", "Geen bestand? Wij tekenen eenvoudige onderdelen na op basis van maten, een foto of het origineel."),
        ("tandwiel", "Vervangingsonderdelen", "Knoppen, clips, kappen en beugels die niet meer te koop zijn."),
        ("kubus", "Prototypes", "Test vorm en pasvorm voordat je een dure matrijs of serie bestelt."),
        ("stapel", "Kleine series", "Tot enkele tientallen stuks, met staffelkorting vanaf 10 stuks."),
        ("mal", "Mallen en hulpstukken", "Boor- en montagemallen, houders en hulpstukken voor de werkplaats."),
    ]
    kaarten = "".join(f'<div class="kaart"><div class="icoon">{icon(i)}</div><h3>{t}</h3><p>{d}</p></div>' for i, t, d in diensten_lijst)
    tarieven = [
        ("Opstartkosten per opdracht", "€ 7,50"),
        ("Materiaal PLA of PETG", "€ 0,06 per gram"),
        ("Materiaal TPU (flexibel)", "€ 0,10 per gram"),
        ("Printtijd", "€ 2,00 per uur"),
        ("Tekenwerk en aanpassingen", "€ 40,00 per uur, per kwartier"),
        ("Nabewerking (schuren, inserts, lijmen)", "€ 30,00 per uur"),
        ("Minimumbedrag per opdracht", "€ 15,00"),
        ("Spoed (binnen 48 uur)", "+ 30%"),
    ]
    rows = "".join(f"<tr><td>{a}</td><td>{b}</td></tr>" for a, b in tarieven)
    staffel = "".join(f"<tr><td>{a}</td><td>{b}</td></tr>" for a, b in [
        ("10 tot 24 stuks", "10% korting"), ("25 tot 49 stuks", "15% korting"), ("50 stuks of meer", "20% · offerte op maat")])
    return f"""
<section class="hero klein"><div class="wrap"><div>
  <div class="kicker">Diensten</div><h1>Wat we voor je maken</h1>
  <p class="lead">Van één vervangend knopje tot een serie van 50 stuks. Met of zonder eigen tekening.</p>
</div></div></section>

<section><div class="wrap"><div class="grid grid-3">{kaarten}</div></div></section>

<section class="grijs"><div class="wrap">
  <div class="sectie-kop"><div class="kicker">Materialen</div><h2>Welk materiaal kies je?</h2></div>
  <div class="grid grid-3">
    <div class="kaart materiaal"><h3>PLA</h3><p>Strak en vormvast, voor binnen. Niet geschikt voor hitte, zoals in een auto in de zon.</p></div>
    <div class="kaart materiaal"><h3>PETG</h3><p>Sterker, taaier en beter bestand tegen warmte en vocht. Voor de werkplaats en buiten.</p></div>
    <div class="kaart materiaal"><h3>TPU</h3><p>Flexibel en slijtvast. Voor doppen, buffers en afdichtingen.</p></div>
  </div>
  <p class="muted" style="margin-top:20px">Maximale afmeting uit één stuk: 25 × 25 × 25 cm. Grotere onderdelen maken wij in delen.</p>
</div></section>

<section><div class="wrap">
  <div class="sectie-kop"><div class="kicker">Tarieven</div><h2>Printservice op aanvraag</h2>
  <p class="muted">Je krijgt altijd vooraf een vaste prijs. Wij rekenen geen btw (kleineondernemersregeling); de genoemde prijzen zijn eindprijzen.</p></div>
  <div class="grid grid-2">
    <table class="tabel"><thead><tr><th>Onderdeel</th><th>Tarief</th></tr></thead><tbody>{rows}</tbody></table>
    <div>
      <table class="tabel"><thead><tr><th>Staffel voor series</th><th>Korting</th></tr></thead><tbody>{staffel}</tbody></table>
      <div class="kaart" style="margin-top:22px"><h3>Rekenvoorbeeld</h3>
      <p>Onderdeel van 80 gram PETG, 4 uur printen en een half uur tekenwerk:<br>€ 7,50 + € 4,80 + € 8,00 + € 20,00 = <strong>€ 40,30</strong>.</p></div>
    </div>
  </div>
</div></section>

<section class="grijs"><div class="wrap tekst">
  <h2>Wat we niet maken</h2>
  <p>Onderdelen waar de veiligheid van personen van afhangt (zoals remmen, stuurdelen, hijsmiddelen of gasonderdelen), producten voor contact met voedsel en merkartikelen zonder toestemming van de merkeigenaar.</p>
</div></section>
{cta()}"""


def producten():
    return f"""
<section class="hero klein"><div class="wrap"><div>
  <div class="kicker">Producten</div><h1>Slim opgeruimd, persoonlijk gemaakt</h1>
  <p class="lead">Ons eigen assortiment. Elk product is aan te passen in kleur, maat en tekst.</p>
</div></div></section>
<section><div class="wrap">{producten_grid()}
<p class="muted" style="margin-top:28px">Prijzen zijn eindprijzen; wij rekenen geen btw (kleineondernemersregeling). Afhalen in {G['plaats']} is gratis, verzenden tegen kostprijs. Levertijd 3 tot 5 werkdagen.</p>
</div></section>
{cta("Iets anders in gedachten?", "Wij maken ook producten op maat. Beschrijf wat je zoekt en je krijgt binnen één werkdag een voorstel.")}"""


def zakelijk():
    branches = [
        ("Garages", "Sleutellabels, gereedschapshouders, afdekkappen en clips."),
        ("Machinebouwers", "Prototypes, afdekkappen, kabelgeleiders en proefmodellen."),
        ("Installatiebedrijven", "Boormallen, afstandhouders en houders voor in de bus."),
        ("Interieurbouwers", "Montagemallen, afdekdopjes in kleur en proefmodellen."),
        ("Productiebedrijven", "Productdragers, sorteerbakjes en hulpstukken aan de lijn."),
        ("Winkels en horeca", "QR-standaards, naambordjes en displays in je huisstijl."),
    ]
    kaarten = "".join(f'<div class="kaart"><h3>{a}</h3><p class="muted">{b}</p></div>' for a, b in branches)
    waarom = ["Eén aanspreekpunt, in de buurt.", "Offerte binnen één werkdag.",
              "Je ontwerp blijft van jou en wordt bewaard voor nabestellingen.", "Eerste proefopdracht zonder risico: bevalt het niet, dan geen factuur."]
    lijst = "".join(f'<li style="display:flex;gap:10px;margin-bottom:10px">{icon("check", 22)}<span>{w}</span></li>' for w in waarom)
    return f"""
<section class="hero klein"><div class="wrap"><div>
  <div class="kicker">Zakelijk</div><h1>Hulpstukken en onderdelen voor je bedrijf, binnen een week</h1>
  <p class="lead">Een mal die je monteur elke dag tijd scheelt. Een afdekkap die niet meer leverbaar is. Een prototype om aan je klant te laten zien. Wij maken het, in de regio en zonder minimale afname.</p>
  <div class="acties"><a class="btn btn-blauw" href="/offerte">Plan een kennismaking</a></div>
</div></div></section>

<section><div class="wrap">
  <div class="grid grid-4">
    <div class="kaart"><div class="icoon">{icon('mal')}</div><h3>Boor- en montagemallen</h3><p class="muted">Elke keer op dezelfde plek boren, meten of positioneren.</p></div>
    <div class="kaart"><div class="icoon">{icon('gereedschap')}</div><h3>Houders en organizers</h3><p class="muted">Voor werkplaats, gereedschapswagen en bus.</p></div>
    <div class="kaart"><div class="icoon">{icon('kubus')}</div><h3>Prototypes</h3><p class="muted">Proefmodellen om vorm en pasvorm te testen.</p></div>
    <div class="kaart"><div class="icoon">{icon('stapel')}</div><h3>Series en nabestellingen</h3><p class="muted">Vaste prijs, snel na te bestellen.</p></div>
  </div>
</div></section>

<section class="grijs"><div class="wrap">
  <div class="sectie-kop"><div class="kicker">Voor jouw branche</div><h2>Wat we voor bedrijven maken</h2></div>
  <div class="grid grid-3">{kaarten}</div>
</div></section>

<section><div class="wrap"><div class="grid grid-2" style="align-items:center">
  <div><h2>Waarom {G['naam']}</h2><ul style="list-style:none;padding:0;margin:20px 0 0">{lijst}</ul></div>
  <div class="kaart"><h3>Ook bedrijfskleding nodig?</h3><p>{G['naam']} hoort bij <a href="{G['moeder_url']}">{G['moeder']}</a>. Daar bedrukken we werkkleding met je logo. Combineer kleding met sleutelhangers, naambordjes of QR-standaards in dezelfde huisstijl.</p>
  <a class="btn btn-rand" href="{G['moeder_url']}">Naar {G['moeder']}</a></div>
</div></div></section>
{cta("Benieuwd wat we voor je bedrijf kunnen maken?", "Stuur een korte omschrijving of foto. We denken mee en sturen binnen één werkdag een voorstel.")}"""


def over():
    return f"""
<section class="hero klein"><div class="wrap"><div>
  <div class="kicker">Over ons</div><h1>Over {G['naam']}</h1>
</div></div></section>
<section><div class="wrap"><div class="grid grid-2">
  <div class="tekst">
    <p>{G['naam']} is de 3D-printservice van {G['moeder']} uit {G['plaats']}. Naast het bedrukken van kleding print ik onderdelen en producten in 3D voor bedrijven en particulieren in de regio.</p>
    <p>Ik ben {G['contactpersoon']}. [Vertel hier in twee of drie zinnen hoe je met 3D-printen bent begonnen en wat je er leuk aan vindt.]</p>
    <p>Je hebt altijd direct contact met mij. Ik denk mee over materiaal en ontwerp, en ik zeg het eerlijk als 3D-printen niet de beste oplossing is.</p>
    <p><a class="btn btn-blauw" href="/offerte">Vraag een offerte aan</a></p>
  </div>
  <div class="grid">
    <div class="kaart"><div class="icoon">{icon('locatie')}</div><h3>Uit de regio</h3><p class="muted">{G['werkgebied']}. Afhalen kan.</p></div>
    <div class="kaart"><div class="icoon">{icon('printer')}</div><h3>Eigen werkplaats</h3><p class="muted">Gesloten 3D-printer, prints tot 25 × 25 × 25 cm.</p></div>
  </div>
</div></div></section>"""


def offerte():
    return f"""
<section class="hero klein"><div class="wrap"><div>
  <div class="kicker">Offerte</div><h1>Vraag een offerte aan</h1>
  <p class="lead">Je krijgt binnen één werkdag antwoord. Geen verplichtingen.</p>
</div></div></section>
<section class="grijs"><div class="wrap" style="max-width:860px">
<form id="offerteformulier" class="formulier" data-email="{G['email']}" novalidate>
  <div class="rij">
    <div class="veld"><label for="naam">Naam <span class="verplicht">*</span></label><input id="naam" name="naam" required autocomplete="name"></div>
    <div class="veld"><label for="bedrijf">Bedrijfsnaam</label><input id="bedrijf" name="bedrijf" autocomplete="organization"></div>
  </div>
  <div class="rij">
    <div class="veld"><label for="email">E-mail <span class="verplicht">*</span></label><input id="email" name="email" type="email" required autocomplete="email"></div>
    <div class="veld"><label for="telefoon">Telefoon</label><input id="telefoon" name="telefoon" type="tel" autocomplete="tel"></div>
  </div>
  <div class="veld"><label for="omschrijving">Wat wil je laten maken? <span class="verplicht">*</span></label>
    <textarea id="omschrijving" name="omschrijving" required placeholder="Bijvoorbeeld: een vervangend knopje voor mijn vaatwasser, of 20 sleutelhangers met ons logo."></textarea></div>
  <div class="veld"><label for="bestand">Bestand of foto <span class="hint">(STL, STEP, 3MF, JPG, PNG of PDF, max. 4 MB)</span></label>
    <input id="bestand" name="bestand" type="file" accept=".stl,.step,.stp,.3mf,.obj,.jpg,.jpeg,.png,.pdf,.heic,.webp"></div>
  <div class="rij">
    <div class="veld"><label for="afmetingen">Afmetingen <span class="hint">(l × b × h)</span></label><input id="afmetingen" name="afmetingen" placeholder="bijv. 80 × 40 × 20 mm"></div>
    <div class="veld"><label for="aantal">Aantal <span class="verplicht">*</span></label><input id="aantal" name="aantal" type="number" min="1" value="1" required></div>
  </div>
  <div class="rij">
    <div class="veld"><label for="materiaal">Materiaal</label><select id="materiaal" name="materiaal">
      <option>Weet ik niet</option><option>PLA</option><option>PETG</option><option>TPU (flexibel)</option></select></div>
    <div class="veld"><label for="kleur">Kleur</label><input id="kleur" name="kleur"></div>
  </div>
  <div class="rij">
    <div class="veld"><label for="wanneer">Wanneer heb je het nodig?</label><input id="wanneer" name="wanneer" placeholder="bijv. binnen 2 weken"></div>
    <div class="veld"><label for="levering">Afhalen of verzenden</label><select id="levering" name="levering">
      <option>Afhalen in {G['plaats']}</option><option>Verzenden</option></select></div>
  </div>
  <div class="hp" aria-hidden="true"><label for="website">Laat dit veld leeg</label><input id="website" name="website" tabindex="-1" autocomplete="off"></div>
  <button type="submit" class="btn btn-blauw">Offerte aanvragen</button>
  <p class="muted" style="margin:14px 0 0;font-size:.9rem">Je gegevens en bestanden gebruiken we alleen voor je offerte. Lees de <a href="/privacy">privacyverklaring</a>.</p>
  <div id="melding" class="melding" role="status" aria-live="polite"></div>
</form>
</div></section>"""


def faq():
    vragen = [
        ("Wat kost een 3D-print?", "De meeste opdrachten kosten € 15 tot € 60. Je krijgt altijd vooraf een vaste prijs. Bekijk de <a href=\"/diensten\">tarieven</a> voor een rekenvoorbeeld."),
        ("Ik heb geen tekening. Kan dat?", "Ja. Stuur maten, een foto of het onderdeel zelf. Wij tekenen het na; tekenwerk kost € 40 per uur, per kwartier afgerekend."),
        ("Hoe groot kan een print zijn?", "Tot 25 × 25 × 25 cm uit één stuk. Grotere onderdelen maken wij in delen."),
        ("Hoe sterk is een print?", "Sterk genoeg voor houders, kappen en hulpstukken, zeker in PETG. Voor zwaar belaste of veiligheidskritische onderdelen is 3D-printen niet geschikt."),
        ("Hoe snel is het klaar?", "Meestal binnen 5 werkdagen. Spoed binnen 48 uur kan in overleg, tegen 30% toeslag."),
        ("Welke bestanden kan ik sturen?", "STL, STEP, 3MF of OBJ. Een foto of PDF met maten is ook goed."),
        ("Van wie is het ontwerp?", "Betaal je het tekenwerk, dan is het ontwerp van jou. Wij bewaren het voor nabestellingen."),
        ("Rekenen jullie btw?", "Nee. Wij vallen onder de kleineondernemersregeling en rekenen geen btw. De prijzen zijn eindprijzen."),
        ("Kan ik ophalen?", f"Ja, afhalen in {G['plaats']} is gratis. Verzenden kan ook, tegen de kosten van de vervoerder."),
        ("Maken jullie ook kleding?", f"Ja, via <a href=\"{G['moeder_url']}\">{G['moeder']}</a> bedrukken we kleding, zoals werkkleding met logo."),
    ]
    items = "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in vragen)
    return f"""
<section class="hero klein"><div class="wrap"><div>
  <div class="kicker">Veelgestelde vragen</div><h1>Vragen over 3D-printen</h1>
</div></div></section>
<section class="grijs"><div class="wrap" style="max-width:860px">{items}</div></section>
{cta("Staat je vraag er niet bij?", "Stel hem gerust via het formulier of per e-mail.")}"""


def contact():
    wa = (f'<p><a class="btn btn-rand" href="https://wa.me/{G["whatsapp"]}">WhatsApp</a></p>' if G["whatsapp"] else "")
    return f"""
<section class="hero klein"><div class="wrap"><div>
  <div class="kicker">Contact</div><h1>Neem contact op</h1>
  <p class="lead">Een vraag, een idee of een kapot onderdeel? Laat het weten.</p>
</div></div></section>
<section><div class="wrap"><div class="grid grid-3">
  <div class="kaart"><h3>E-mail</h3><p><a href="mailto:{G['email']}">{G['email']}</a></p></div>
  <div class="kaart"><h3>Telefoon</h3><p>{G['telefoon']}</p>{wa}</div>
  <div class="kaart"><h3>Werkgebied</h3><p>{G['werkgebied']}. Afhalen in {G['plaats']} op afspraak.</p></div>
</div>
<p class="muted" style="margin-top:24px">{G['naam']} is een onderdeel van {G['moeder']} · KVK {G['kvk']}</p>
</div></section>
{cta("Liever direct een prijs?", "Vul het offerteformulier in. Je krijgt binnen één werkdag antwoord.")}"""


def privacy():
    return f"""
<section class="hero klein"><div class="wrap"><div><div class="kicker">Privacy</div><h1>Privacyverklaring</h1></div></div></section>
<section><div class="wrap tekst">
<p>{G['naam']} is een onderdeel van {G['moeder']} (KVK {G['kvk']}), gevestigd in {G['plaats']}. In deze verklaring lees je welke persoonsgegevens we verwerken en waarom.</p>
<h2>Welke gegevens</h2>
<p>Als je het offerteformulier invult of contact opneemt: je naam, bedrijfsnaam, e-mailadres, telefoonnummer, je omschrijving en eventuele bestanden of foto's die je meestuurt.</p>
<h2>Waarvoor</h2>
<p>Om je aanvraag te beantwoorden, een offerte te maken en je opdracht uit te voeren. Na een opdracht bewaren we gegevens die nodig zijn voor de administratie, zoals facturen.</p>
<h2>Hoe lang</h2>
<p>Aanvragen die niet tot een opdracht leiden, verwijderen we binnen 12 maanden. Facturen bewaren we 7 jaar, omdat de wet dat verplicht.</p>
<h2>Delen</h2>
<p>We verkopen je gegevens nooit. We gebruiken alleen dienstverleners die nodig zijn om de website en e-mail te laten werken, zoals de hostingpartij en de e-mailprovider.</p>
<h2>Cookies</h2>
<p>Deze website gebruikt geen tracking- of advertentiecookies.</p>
<h2>Jouw rechten</h2>
<p>Je mag je gegevens inzien, laten corrigeren of laten verwijderen. Stuur daarvoor een e-mail naar <a href="mailto:{G['email']}">{G['email']}</a>. Ben je het niet eens met hoe we met je gegevens omgaan, dan kun je een klacht indienen bij de Autoriteit Persoonsgegevens.</p>
</div></section>"""


PAGES = [
    ("index.html", "3D printservice Oss · Onderdelen en prototypes op maat · LWPRINTS3D",
     "3D-printservice in Oss. Onderdelen, prototypes, kleine series en producten op maat voor bedrijven en particulieren. Offerte binnen één werkdag.", home),
    ("diensten.html", "3D printen laten doen in Oss, Uden en Veghel · Tarieven · LWPRINTS3D",
     "3D-printservice, tekenwerk, vervangingsonderdelen, prototypes en kleine series. Materialen PLA, PETG en TPU. Bekijk de tarieven.", diensten),
    ("producten.html", "Gereedschapshouders, organizers en cadeaus op maat · LWPRINTS3D",
     "Sleutelhangers met logo, telefoonstandaards, gereedschapshouders, lade-indelingen en meer. Aan te passen in kleur, maat en tekst.", producten),
    ("zakelijk.html", "Mallen, prototypes en kleine series · 3D print voor bedrijven · LWPRINTS3D",
     "Boor- en montagemallen, houders, prototypes en kleine series voor bedrijven in Oss, Uden, Veghel en Nijmegen. Binnen een week geleverd.", zakelijk),
    ("over.html", "Over LWPRINTS3D · 3D-printservice uit Oss",
     "LWPRINTS3D is de 3D-printservice van LWPRINTS uit Oss. Direct contact, eerlijk advies en snelle levering.", over),
    ("offerte.html", "Offerte aanvragen · 3D-printservice Oss · LWPRINTS3D",
     "Vraag gratis een offerte aan voor je 3D-print. Upload je bestand of foto en ontvang binnen één werkdag een vaste prijs.", offerte),
    ("veelgestelde-vragen.html", "Veelgestelde vragen over 3D-printen · LWPRINTS3D",
     "Antwoorden op vragen over prijzen, materialen, afmetingen, levertijd en bestanden voor 3D-printen in Oss.", faq),
    ("contact.html", "Contact · LWPRINTS3D 3D-printservice Oss",
     "Neem contact op met LWPRINTS3D in Oss voor 3D-printwerk, onderdelen en prototypes op maat.", contact),
    ("privacy.html", "Privacyverklaring · LWPRINTS3D",
     "Lees hoe LWPRINTS3D omgaat met je persoonsgegevens.", privacy),
]

if __name__ == "__main__":
    for fname, title, desc, fn in PAGES:
        (ROOT / fname).write_text(layout(fname, title, desc, fn()), encoding="utf-8")
    urls = "".join(f"<url><loc>{SITE}{href(f)}</loc></url>" for f, *_ in PAGES)
    (ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n')
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
    (ROOT / "404.html").write_text(layout("404.html", "Pagina niet gevonden · LWPRINTS3D", "Deze pagina bestaat niet.",
        '<section class="hero klein"><div class="wrap"><div><h1>Pagina niet gevonden</h1><p class="lead">Deze pagina bestaat niet (meer).</p>'
        '<div class="acties"><a class="btn btn-blauw" href="/">Naar home</a></div></div></div></section>'), encoding="utf-8")
    print("klaar:", len(PAGES), "pagina's")
