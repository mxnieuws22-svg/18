// Mobiel menu
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

// Jaar in de footer
document.querySelectorAll("[data-jaar]").forEach((el) => (el.textContent = new Date().getFullYear()));

// Product doorgeven aan het offerteformulier (?product=...)
const productVeld = document.querySelector("#omschrijving");
const params = new URLSearchParams(location.search);
if (productVeld && params.get("product") && !productVeld.value) {
  productVeld.value = `Ik heb interesse in: ${params.get("product")}\n\n`;
}

// Offerteformulier
const form = document.querySelector("#offerteformulier");
if (form) {
  const melding = document.querySelector("#melding");
  const knop = form.querySelector("button[type=submit]");
  const MAX_BESTAND = 4 * 1024 * 1024;

  const toonMelding = (soort, html) => {
    melding.className = `melding ${soort}`;
    melding.innerHTML = html;
    melding.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const leesBestand = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1] || "");
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form).entries());
    delete data.bestand;
    const file = form.querySelector("#bestand").files[0];
    if (file) {
      if (file.size > MAX_BESTAND) {
        toonMelding("fout", "Het bestand is groter dan 4 MB. Stuur het mee in een e-mail, of laat het veld leeg en vermeld dat je het later stuurt.");
        return;
      }
      data.bestand = { naam: file.name, type: file.type || "application/octet-stream", inhoud: await leesBestand(file) };
    }

    knop.disabled = true;
    knop.textContent = "Bezig met versturen…";
    try {
      const res = await fetch("/api/offerte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out.fout || "Versturen mislukt");
      form.reset();
      toonMelding("ok", "<strong>Bedankt!</strong> Je aanvraag is verstuurd. Je krijgt binnen één werkdag een reactie.");
    } catch (err) {
      const mail = form.dataset.email;
      const onderwerp = encodeURIComponent("Offerteaanvraag via de website");
      const body = encodeURIComponent(
        Object.entries(data).filter(([k]) => k !== "bestand" && k !== "website").map(([k, v]) => `${k}: ${v}`).join("\n")
      );
      toonMelding("fout", `Versturen is niet gelukt. Probeer het later opnieuw, of <a href="mailto:${mail}?subject=${onderwerp}&body=${body}">stuur je aanvraag per e-mail</a>.`);
    } finally {
      knop.disabled = false;
      knop.textContent = "Offerte aanvragen";
    }
  });
}
