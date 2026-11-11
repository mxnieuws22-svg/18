import Link from "next/link";

const GRADIENTS = [
  "from-violet-600/60 to-fuchsia-500/20",
  "from-sky-600/50 to-indigo-500/20",
  "from-rose-600/50 to-orange-500/20",
  "from-emerald-600/50 to-teal-500/20",
];

export default function CreatorCard(props: {
  username: string; displayName: string; headline: string; categories: string[];
}) {
  const g = GRADIENTS[props.username.charCodeAt(0) % GRADIENTS.length];
  return (
    <Link href={`/creator/${props.username}`} className="card group block overflow-hidden transition hover:border-white/20">
      <div className={`flex h-32 items-center justify-center bg-gradient-to-br ${g}`}>
        <span className="font-display text-4xl text-white/90">{props.displayName.slice(0, 1).toUpperCase()}</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-medium text-white">{props.displayName}</h3>
          <span title="Verified" className="text-accent">✓</span>
        </div>
        <p className="text-xs text-zinc-500">@{props.username}</p>
        {props.headline && <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{props.headline}</p>}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {props.categories.slice(0, 3).map((c) => (
            <span key={c} className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-zinc-400">{c}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}
