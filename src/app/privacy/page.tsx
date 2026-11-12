import Legal from "@/components/Legal";

export const metadata = { title: "Privacy — Fannova" };

export default function Privacy() {
  return (
    <Legal title="Privacyverklaring">
      <section><h2>Welke gegevens we bewaren</h2>
        <ul>
          <li>E-mailadres en wachtwoord (het wachtwoord wordt versleuteld opgeslagen door onze inlogdienst).</li>
          <li>Gebruikersnaam en weergavenaam.</li>
          <li>Geboortedatum, uitsluitend om je leeftijd te controleren. Deze is alleen zichtbaar voor jou en beheerders.</li>
          <li>Voor creators: profielgegevens, geüploade bestanden en verificatiestatus.</li>
          <li>Wie je volgt en meldingen die je indient.</li>
        </ul></section>
      <section><h2>Waarom</h2><p>Om je account te beheren, leeftijd te controleren, het platform veilig te houden en misbruik tegen te gaan.</p></section>
      <section><h2>Privé standaard</h2><p>Bestanden staan in een privéopslag. Anderen zien alleen wat je bewust deelt en wat is goedgekeurd.</p></section>
      <section><h2>Bewaartermijn en verwijderen</h2>
        <p>Je kunt je account op elk moment verwijderen via <b>Account</b>. Daarbij worden je profiel, uploads, volgrelaties en meldingen gewist.</p></section>
      <section><h2>Jouw rechten</h2><p>Je mag je gegevens inzien, corrigeren of laten verwijderen. Neem hiervoor contact op: <em>[nog in te vullen]</em>.</p></section>
      <section><h2>Verwerkers</h2><p>We gebruiken Supabase (database, inloggen, opslag) en Vercel (hosting).</p></section>
    </Legal>
  );
}
