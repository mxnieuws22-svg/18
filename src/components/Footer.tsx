export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/[0.06] py-10 text-center text-xs text-zinc-500">
      <p>Veil is for adults aged 18+ only. All creators are reviewed before they appear.</p>
      <p className="mt-1">© {new Date().getFullYear()} Veil</p>
    </footer>
  );
}
