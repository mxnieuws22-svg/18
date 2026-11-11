export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/[0.06] py-10 text-center text-xs text-zinc-500">
      <p>Veil is uitsluitend voor volwassenen (18+). Alle creators worden beoordeeld voordat ze zichtbaar zijn.</p>
      <p className="mt-3 flex justify-center gap-4">
        <a href="/voorwaarden" className="hover:text-zinc-300">Voorwaarden</a>
        <a href="/privacy" className="hover:text-zinc-300">Privacy</a>
        <a href="/melden" className="hover:text-zinc-300">Content melden</a>
      </p>
      <p className="mt-2">© {new Date().getFullYear()} Veil</p>
    </footer>
  );
}
