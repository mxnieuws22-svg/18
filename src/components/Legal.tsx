export default function Legal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="font-display text-4xl text-white">{title}</h1>
      <p className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
        Conceptversie. Deze tekst is nog niet juridisch getoetst en moet worden beoordeeld voordat het platform live gaat.
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-300 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-white [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
