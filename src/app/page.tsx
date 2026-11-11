import Link from "next/link";

const PILLARS = [
  { t: "Verified adults only", d: "Every member confirms they are 18+, and every creator is manually reviewed before appearing anywhere." },
  { t: "Private by default", d: "Uploads are locked to you. You choose what to share, and nothing is visible until it passes moderation." },
  { t: "Built on strict rules", d: "Access is enforced in the database with Row Level Security — not just in the interface." },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-[500px] max-w-3xl rounded-full bg-accent-deep/20 blur-[140px]" />
        <div className="relative mx-auto max-w-4xl px-5 pb-20 pt-28 text-center">
          <p className="mb-5 text-xs uppercase tracking-[0.3em] text-accent">18+ · Verified · Private</p>
          <h1 className="font-display text-5xl leading-[1.05] text-white sm:text-7xl">
            Where creators stay <em className="text-accent not-italic">in control.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400">
            A discreet, premium home for verified adult creators and the fans who value them.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="btn-primary">Create your account</Link>
            <Link href="/discover" className="btn-ghost">Discover creators</Link>
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
        <h2 className="font-display text-3xl text-white">For creators</h2>
        <p className="mt-3 text-zinc-400">
          Apply, get verified, and publish on your terms. Payments and messaging are coming later —
          the foundation comes first.
        </p>
        <Link href="/signup?role=creator" className="btn-ghost mt-6">Apply as a creator</Link>
      </section>
    </>
  );
}
