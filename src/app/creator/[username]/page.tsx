import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MediaItem } from "@/lib/types";
import { toggleFollow, reportCreator } from "./actions";

export const dynamic = "force-dynamic";

export default async function CreatorPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: creator } = await supabase
    .from("profiles")
    .select("id, username, display_name, creator_profiles(headline, about, categories)")
    .eq("username", username.toLowerCase())
    .eq("role", "creator")
    .eq("verification_status", "verified")
    .maybeSingle();
  if (!creator) notFound(); // RLS hides unlisted creators entirely

  const cp = Array.isArray(creator.creator_profiles) ? creator.creator_profiles[0] : creator.creator_profiles;
  const isSelf = creator.id === user.id;

  const [{ data: followRow }, { data: count }, { data: media }] = await Promise.all([
    supabase.from("follows").select("creator_id").eq("follower_id", user.id).eq("creator_id", creator.id).maybeSingle(),
    supabase.rpc("follower_count", { cid: creator.id }),
    supabase.from("media").select("id, storage_path, kind, title, visibility, moderation")
      .eq("creator_id", creator.id).order("created_at", { ascending: false }).limit(30),
  ]);
  const following = !!followRow;

  // Short-lived signed URLs; storage RLS re-checks access for every object.
  const items = (media ?? []) as MediaItem[];
  const signed = items.length
    ? await supabase.storage.from("media").createSignedUrls(items.map((m) => m.storage_path), 300)
    : { data: [] };
  const urlByPath = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="card flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600/70 to-fuchsia-500/30 font-display text-4xl text-white">
          {creator.display_name.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-3xl text-white">
            {creator.display_name} <span className="text-lg text-accent" title="Geverifieerd">✓</span>
          </h1>
          <p className="text-sm text-zinc-500">@{creator.username} · {Number(count ?? 0)} volgers</p>
          {cp?.headline && <p className="mt-2 text-zinc-300">{cp.headline}</p>}
        </div>
        {!isSelf && (
          <form action={toggleFollow}>
            <input type="hidden" name="creatorId" value={creator.id} />
            <input type="hidden" name="username" value={creator.username} />
            <input type="hidden" name="following" value={following ? "1" : "0"} />
            <button className={following ? "btn-ghost" : "btn-primary"}>{following ? "Volgend" : "Volgen"}</button>
          </form>
        )}
      </div>

      {cp?.about && (
        <section className="mt-8">
          <h2 className="label">Over</h2>
          <p className="whitespace-pre-line leading-relaxed text-zinc-300">{cp.about}</p>
        </section>
      )}
      {!!cp?.categories?.length && (
        <div className="mt-5 flex flex-wrap gap-2">
          {cp.categories.map((c: string) => (
            <span key={c} className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">{c}</span>
          ))}
        </div>
      )}

      <section className="mt-10">
        <h2 className="label">Content</h2>
        {items.length === 0 ? (
          <div className="card p-8 text-center text-sm text-zinc-500">
            Er is nog niets met jou gedeeld. Content is privé tenzij de creator het deelt.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((m) => {
              const url = urlByPath.get(m.storage_path);
              return (
                <figure key={m.id} className="card aspect-square overflow-hidden">
                  {url && m.kind === "image" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={m.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  )}
                  {url && m.kind === "video" && <video src={url} controls preload="none" className="h-full w-full object-cover" />}
                </figure>
              );
            })}
          </div>
        )}
      </section>

      {!isSelf && (
        <details className="mt-12 text-sm text-zinc-500">
          <summary className="cursor-pointer hover:text-zinc-300">Dit profiel melden</summary>
          <form action={reportCreator} className="mt-3 flex max-w-md flex-col gap-3">
            <input type="hidden" name="creatorId" value={creator.id} />
            <textarea name="reason" required minLength={3} maxLength={1000} rows={3} className="input" placeholder="Wat is er mis?" />
            <button className="btn-ghost self-start">Melding versturen</button>
          </form>
        </details>
      )}
    </div>
  );
}
