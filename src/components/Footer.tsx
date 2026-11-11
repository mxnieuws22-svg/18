export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/[0.06] py-10 text-center text-xs text-zinc-500">
      <p>Veil is uitsluitend voor volwassenen (18+). Alle creators worden beoordeeld voordat ze zichtbaar zijn.</p>
      <p className="mt-1">© {new Date().getFullYear()} Veil</p>
    </footer>
  );
}
