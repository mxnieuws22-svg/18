// Vercel serverless functie: verstuurt een offerteaanvraag per e-mail.
// Instellen in Vercel -> Settings -> Environment Variables:
//   SMTP_HOST, SMTP_PORT (465), SMTP_USER, SMTP_PASS (app-wachtwoord), OFFERTE_NAAR (jouw e-mailadres)
const nodemailer = require("nodemailer");

const MAX_BESTAND = 4 * 1024 * 1024; // 4 MB
const TOEGESTAAN = /\.(stl|step|stp|3mf|obj|jpe?g|png|pdf|heic|webp)$/i;

const schoon = (v, max = 2000) => String(v ?? "").replace(/\r/g, "").trim().slice(0, max);
const html = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function transport() {
  if (process.env.OFFERTE_TEST === "1") return nodemailer.createTransport({ jsonTransport: true });
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const port = Number(SMTP_PORT || 465);
  return nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, fout: "Alleen POST" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== "object") return res.status(400).json({ ok: false, fout: "Ongeldige aanvraag" });

  // Spamval: dit veld is onzichtbaar voor mensen
  if (schoon(body.website)) return res.status(200).json({ ok: true });

  const v = {
    naam: schoon(body.naam, 120),
    bedrijf: schoon(body.bedrijf, 120),
    email: schoon(body.email, 160),
    telefoon: schoon(body.telefoon, 40),
    omschrijving: schoon(body.omschrijving, 5000),
    afmetingen: schoon(body.afmetingen, 200),
    aantal: schoon(body.aantal, 20),
    materiaal: schoon(body.materiaal, 40),
    kleur: schoon(body.kleur, 60),
    wanneer: schoon(body.wanneer, 80),
    levering: schoon(body.levering, 40),
  };

  if (!v.naam || !v.omschrijving || !v.aantal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) {
    return res.status(400).json({ ok: false, fout: "Vul naam, een geldig e-mailadres, omschrijving en aantal in." });
  }

  const bijlagen = [];
  if (body.bestand && body.bestand.inhoud) {
    const naam = schoon(body.bestand.naam, 120).replace(/[^\w.\- ]/g, "_");
    const buf = Buffer.from(String(body.bestand.inhoud), "base64");
    if (!TOEGESTAAN.test(naam)) return res.status(400).json({ ok: false, fout: "Dit bestandstype wordt niet geaccepteerd." });
    if (buf.length > MAX_BESTAND) return res.status(400).json({ ok: false, fout: "Bestand is groter dan 4 MB." });
    bijlagen.push({ filename: naam, content: buf });
  }

  const t = transport();
  const naar = process.env.OFFERTE_NAAR || process.env.SMTP_USER || (process.env.OFFERTE_TEST === "1" ? "test@example.com" : "");
  if (!t || !naar) return res.status(500).json({ ok: false, fout: "E-mail is nog niet ingesteld op de server." });

  const labels = {
    naam: "Naam", bedrijf: "Bedrijf", email: "E-mail", telefoon: "Telefoon", omschrijving: "Omschrijving",
    afmetingen: "Afmetingen", aantal: "Aantal", materiaal: "Materiaal", kleur: "Kleur", wanneer: "Nodig op", levering: "Levering",
  };
  const regels = Object.entries(labels).filter(([k]) => v[k]).map(([k, l]) => [l, v[k]]);
  const tekst = regels.map(([l, w]) => `${l}: ${w}`).join("\n") + (bijlagen.length ? `\nBijlage: ${bijlagen[0].filename}` : "");
  const htmlBody = `<h2>Nieuwe offerteaanvraag</h2><table cellpadding="6">${regels
    .map(([l, w]) => `<tr><td><b>${html(l)}</b></td><td>${html(w).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>`;

  try {
    await t.sendMail({
      from: `"LWPRINTS3D website" <${process.env.SMTP_USER || naar}>`,
      to: naar,
      replyTo: `"${v.naam.replace(/"/g, "")}" <${v.email}>`,
      subject: `Offerteaanvraag: ${v.naam}${v.bedrijf ? ` (${v.bedrijf})` : ""}`,
      text: tekst,
      html: htmlBody,
      attachments: bijlagen,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Versturen mislukt:", err && err.message);
    return res.status(502).json({ ok: false, fout: "Versturen mislukt" });
  }
};
