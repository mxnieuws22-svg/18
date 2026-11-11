import Link from "next/link";

const PILLARS = [
  { t: "Alleen geverifieerde volwassenen", d: "Elk lid bevestigt 18+ te zijn en elke creator wordt handmatig beoordeeld voordat die ergens zichtbaar is." },
  { t: "Standaard privé", d: "Uploads zijn alleen voor jou. Jij bepaalt wat je deelt en niets is zichtbaar totdat het door moderatie is goedgekeurd." },
  { t: "Gebouwd op strikte regels", d: "Toegang wordt afgedwongen in de database met Row Level Security — niet alleen in de interface." },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-[500px] max-w-3xl rounded-full bg-accent-deep/20 blur-[140px]" />
        <div className="relative mx-auto max-w-4xl px-5 pb-20 pt-28 text-center">
          <p className="mb-5 text-xs uppercase tracking-[0.3em] text-accent">18+ · Geverifieerd · Privé</p>
          <h1 className="font-display text-5xl leading-[1.05] text-white sm:text-7xl">
            Waar creators <em className="text-accent not-italic">de regie houden.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400">
            Een discrete, premium plek voor geverifieerde volwassen creators en de fans die hen waarderen.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="btn-primary">Account aanmaken</Link>
            <Link href="/discover" className="btn-ghost">Creators ontdekken</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 md:grid-cols-3">
        {PILLARS.map((p) => (
          <div key={p.t} className="card p-6">
            <h3 className="font-display text-xl text-white">{p.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{p.d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-20 max-w-3xl px-5 text-center">
        <h2 className="font-display text-3xl text-white">Voor creators</h2>
        <p className="mt-3 text-zinc-400">
          Meld je aan, laat je verifiëren en publiceer op jouw voorwaarden. Betalingen en berichten komen later —
          eerst de basis.
        </p>
        <Link href="/signup?role=creator" className="btn-ghost mt-6">Aanmelden als creator</Link>
      </section>
    </>
  );
}
