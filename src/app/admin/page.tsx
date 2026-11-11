import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") notFound();
  return supabase;
}

const VERIFICATION = ["verified", "rejected", "pending", "unverified"];
const MODERATION = ["approved", "rejected", "pending"];

async function setVerification(formData: FormData) {
  "use server";
  const supabase = await requireAdmin();
  const status = String(formData.get("status"));
  if (!VERIFICATION.includes(status)) return;
  await supabase.rpc("admin_set_verification", { pid: String(formData.get("id")), new_status: status });
  revalidatePath("/admin");
}
async function setSuspended(formData: FormData) {
  "use server";
  const supabase = await requireAdmin();
  await supabase.rpc("admin_set_suspended", { pid: String(formData.get("id")), suspended: formData.get("suspend") === "1" });
  revalidatePath("/admin");
}
async function setModeration(formData: FormData) {
  "use server";
  const supabase = await requireAdmin();
  const status = String(formData.get("status"));
  if (!MODERATION.includes(status)) return;
  await supabase.rpc("admin_set_moderation", { mid: String(formData.get("id")), new_status: status });
  revalidatePath("/admin");
}

function Btn({ name, value, children, danger }: { name: string; value: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <button name={name} value={value} className={`btn-ghost !px-3 !py-1 !text-xs ${danger ? "!text-red-400" : ""}`}>{children}</button>
  );
}

export default async function Admin() {
  const supabase = await requireAdmin();

  const [{ data: pendingCreators }, { data: pendingMedia }, { data: reports }, { data: creators }, { data: audit }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, created_at, creator_profiles(headline, about, categories)")
      .eq("role", "creator").eq("verification_status", "pending").order("created_at"),
    supabase.from("media").select("id, storage_path, kind, title, visibility, profiles!media_creator_id_fkey(username)")
      .eq("moderation", "pending").order("created_at").limit(30),
    supabase.from("reports").select("id, reason, created_at, target_profile_id, target_media_id, reporter:profiles!reports_reporter_id_fkey(username), target:profiles!reports_target_profile_id_fkey(username)")
      .order("created_at", { ascending: false }).limit(30),
    supabase.from("profiles").select("id, username, display_name, verification_status, is_suspended")
      .eq("role", "creator").order("created_at", { ascending: false }).limit(50),
    supabase.from("admin_audit").select("id, action, detail, created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  const media = pendingMedia ?? [];
  const signed = media.length
    ? await supabase.storage.from("media").createSignedUrls(media.map((m) => m.storage_path), 300)
    : { data: [] };
  const urls = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));
  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-5 py-12">
      <h1 className="font-display text-4xl text-white">Beheer</h1>

      <section>
        <h2 className="label">Creators in afwachting ({pendingCreators?.length ?? 0})</h2>
        {!pendingCreators?.length && <p className="card p-5 text-sm text-zinc-500">Geen aanvragen.</p>}
        <div className="space-y-3">
          {pendingCreators?.map((c) => {
            const cp = one(c.creator_profiles as any) as { headline: string; about: string; categories: string[] } | null;
            return (
              <div key={c.id} className="card p-5">
                <p className="text-white">{c.display_name} <span className="text-zinc-500">@{c.username}</span></p>
                {cp?.headline && <p className="text-sm text-zinc-300">{cp.headline}</p>}
                {cp?.about && <p className="mt-1 line-clamp-3 text-sm text-zinc-400">{cp.about}</p>}
                {!!cp?.categories?.length && <p className="mt-1 text-xs text-zinc-500">{cp.categories.join(" · ")}</p>}
                <form action={setVerification} className="mt-3 flex gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <Btn name="status" value="verified">Goedkeuren</Btn>
                  <Btn name="status" value="rejected" danger>Afwijzen</Btn>
                </form>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="label">Media ter beoordeling ({media.length})</h2>
        {!media.length && <p className="card p-5 text-sm text-zinc-500">Niets te beoordelen.</p>}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {media.map((m) => {
            const url = urls.get(m.storage_path);
            return (
              <div key={m.id} className="card overflow-hidden">
                <div className="aspect-square bg-ink-800">
                  {url && m.kind === "image" && /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt={m.title} className="h-full w-full object-cover" />}
                  {url && m.kind === "video" && <video src={url} controls preload="none" className="h-full w-full object-cover" />}
                </div>
                <div className="space-y-2 p-3 text-xs">
                  <p className="truncate text-zinc-300">@{one(m.profiles as any)?.username} · {m.title || "Zonder titel"} · {m.visibility}</p>
                  <form action={setModeration} className="flex gap-2">
                    <input type="hidden" name="id" value={m.id} />
                    <Btn name="status" value="approved">Goedkeuren</Btn>
                    <Btn name="status" value="rejected" danger>Afwijzen</Btn>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="label">Meldingen ({reports?.length ?? 0})</h2>
        {!reports?.length && <p className="card p-5 text-sm text-zinc-500">Geen meldingen.</p>}
        <div className="space-y-2">
          {reports?.map((r) => (
            <div key={r.id} className="card p-4 text-sm">
              <p className="text-zinc-300">{r.reason}</p>
              <p className="mt-1 text-xs text-zinc-500">
                door @{one(r.reporter as any)?.username ?? "?"} · over {r.target_media_id ? "media " + r.target_media_id : "@" + (one(r.target as any)?.username ?? "?")} · {new Date(r.created_at).toLocaleString("nl-NL")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="label">Alle creators</h2>
        <div className="card divide-y divide-white/5">
          {creators?.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <span className="text-zinc-200">{c.display_name} <span className="text-zinc-500">@{c.username}</span>
                <span className="ml-2 text-xs text-zinc-500">{c.verification_status}{c.is_suspended ? " · geschorst" : ""}</span></span>
              <div className="flex gap-2">
                <form action={setVerification} className="flex gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  {c.verification_status !== "verified" && <Btn name="status" value="verified">Verifiëren</Btn>}
                  {c.verification_status === "verified" && <Btn name="status" value="unverified" danger>Verificatie intrekken</Btn>}
                </form>
                <form action={setSuspended}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="suspend" value={c.is_suspended ? "0" : "1"} />
                  <button className={`btn-ghost !px-3 !py-1 !text-xs ${c.is_suspended ? "" : "!text-red-400"}`}>{c.is_suspended ? "Opheffen" : "Schorsen"}</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="label">Recente acties</h2>
        <ul className="space-y-1 text-xs text-zinc-500">
          {audit?.map((a) => <li key={a.id}>{new Date(a.created_at).toLocaleString("nl-NL")} · {a.action} · {a.detail}</li>)}
        </ul>
      </section>
    </div>
  );
}
