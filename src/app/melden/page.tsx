import Legal from "@/components/Legal";

export const metadata = { title: "Content melden — Veil" };

export default function Melden() {
  return (
    <Legal title="Content melden">
      <section><h2>Zo meld je iets</h2>
        <ul>
          <li>Op elk creatorprofiel staat onderaan “Dit profiel melden”. Je moet daarvoor ingelogd zijn.</li>
          <li>Beschrijf zo concreet mogelijk wat er mis is.</li>
          <li>Ons team beoordeelt meldingen en kan content verwijderen of accounts schorsen.</li>
        </ul></section>
      <section><h2>Ernstige gevallen</h2>
        <p>Heb je content gezien waarin een minderjarige voorkomt of die zonder toestemming is gedeeld? Meld dat direct bij ons én bij de politie of een meldpunt in jouw land.</p></section>
      <section><h2>Direct contact</h2><p><em>[e-mailadres of formulier voor meldingen nog in te vullen]</em></p></section>
    </Legal>
  );
}
