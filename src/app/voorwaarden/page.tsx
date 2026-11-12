import Legal from "@/components/Legal";

export const metadata = { title: "Voorwaarden — Fannova" };

export default function Voorwaarden() {
  return (
    <Legal title="Gebruiksvoorwaarden">
      <section><h2>1. Alleen voor volwassenen</h2>
        <p>Fannova is uitsluitend bestemd voor personen van 18 jaar of ouder. Door een account aan te maken bevestig je dat je 18 of ouder bent en dat het bekijken van content voor volwassenen is toegestaan in jouw land.</p></section>
      <section><h2>2. Creators</h2>
        <ul>
          <li>Creators worden beoordeeld voordat hun profiel zichtbaar is.</li>
          <li>Alleen content waarop je alle rechten hebt, waarin alleen volwassenen en alleen instemmende personen voorkomen.</li>
          <li>Geüploade content is standaard privé en wordt pas zichtbaar na je eigen keuze én goedkeuring door moderatie.</li>
        </ul></section>
      <section><h2>3. Verboden</h2>
        <ul>
          <li>Elke content waarin minderjarigen voorkomen of lijken voor te komen.</li>
          <li>Content zonder instemming van alle afgebeelde personen, wraakporno of geweld.</li>
          <li>Het delen, kopiëren of doorverkopen van andermans content.</li>
        </ul></section>
      <section><h2>4. Moderatie en schorsing</h2>
        <p>Wij mogen content verwijderen en accounts schorsen of beëindigen bij overtreding van deze voorwaarden of de wet.</p></section>
      <section><h2>5. Melden</h2>
        <p>Illegale of ongewenste content kun je melden via de pagina “Content melden” of via de meldknop op een profiel.</p></section>
      <section><h2>6. Contact</h2><p>Contactgegevens: <em>[nog in te vullen]</em></p></section>
    </Legal>
  );
}
