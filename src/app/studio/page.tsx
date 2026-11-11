import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MIME: Record<string, { kind: "image" | "video"; ext: string }> = {
  "image/jpeg": { kind: "image", ext: "jpg" }, "image/png": { kind: "image", ext: "png" },
  "image/webp": { kind: "image", ext: "webp" }, "video/mp4": { kind: "video", ext: "mp4" },
  "video/webm": { kind: "video", ext: "webm" },
};

async function upload(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const file = formData.get("file");
  if (!user || !(file instanceof File) || file.size === 0 || file.size > 50 * 1024 * 1024) return;
  const type = MIME[file.type];
  if (!type) return;

  // Server-generated path inside the creator's own folder; bucket is private.
  const path = `${user.id}/${crypto.randomUUID()}.${type.ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) return;
  // visibility defaults to 'private'; moderation defaults to 'pending'.
  const { error: dbErr } = await supabase.from("media").insert({
    creator_id: user.id, storage_path: path, kind: type.kind,
    title: String(formData.get("title") ?? "").slice(0, 120),
  });
  if (dbErr) await supabase.storage.from("media").remove([path]);
  revalidatePath("/studio");
}

async function setVisibility(formData: FormData) {
  "use server";
  const v = String(formData.get("visibility"));
  if (!["private", "followers", "public"].includes(v)) return;
  const supabase = await createClient();
  await supabase.from("media").update({ visibility: v }).eq("id", String(formData.get("id")));
  revalidatePath("/studio");
}

async function remove(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const path = String(formData.get("path"));
  const { error } = await supabase.from("media").delete().eq("id", String(formData.get("id")));
  if (!error) await supabase.storage.from("media").remove([path]);
  revalidatePath("/studio");
}

export default async function Studio() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/studio");
  const { data: me } = await supabase.from("profiles").select("role, verification_status").eq("id", user.id).single();
  if (me?.role !== "creator") redirect("/account");

  const verified = me.verification_status === "verified";
  const { data: media } = await supabase.from("media")
    .select("id, storage_path, kind, title, visibility, moderation")
    .eq("creator_id", user.id).order("created_at", { ascending: false });
  const signed = media?.length
    ? await supabase.storage.from("media").createSignedUrls(media.map((m) => m.storage_path), 300)
    : { data: [] };
  const urls = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="font-display text-3xl text-white">Studio</h1>
      <p className="mt-1 text-sm text-zinc-400">Alles wat je uploadt is <b className="text-white">privé</b> totdat je het deelt en het is goedgekeurd.</p>

      {!verified ? (
        <div className="card mt-8 p-6 text-sm text-zinc-400">Uploaden wordt beschikbaar nadat je profiel is geverifieerd. Bekijk je status bij Account.</div>
      ) : (
        <form action={upload} className="card mt-8 flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
          <div className="flex-1"><label className="label">Titel</label><input name="title" maxLength={120} className="input" /></div>
          <div className="flex-1"><label className="label">Bestand (jpg, png, webp, mp4, webm · max. 50 MB)</label>
            <input name="file" type="file" required accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="input" /></div>
          <button className="btn-primary">Uploaden</button>
        </form>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {(media ?? []).map((m) => {
          const url = urls.get(m.storage_path);
          return (
            <div key={m.id} className="card overflow-hidden">
              <div className="aspect-square bg-ink-800">
                {url && m.kind === "image" && /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt={m.title} className="h-full w-full object-cover" />}
                {url && m.kind === "video" && <video src={url} controls preload="none" className="h-full w-full object-cover" />}
              </div>
              <div className="space-y-2 p-3 text-xs">
                <p className="truncate text-zinc-300">{m.title || "Zonder titel"} · <span className="text-zinc-500">{m.moderation}</span></p>
                <form action={setVisibility} className="flex gap-2">
                  <input type="hidden" name="id" value={m.id} />
                  <select name="visibility" defaultValue={m.visibility} className="input !py-1 !text-xs">
                    <option value="private">Privé</option><option value="followers">Volgers</option><option value="public">Alle leden</option>
                  </select>
                  <button className="btn-ghost !px-3 !py-1">Instellen</button>
                </form>
                <form action={remove}>
                  <input type="hidden" name="id" value={m.id} /><input type="hidden" name="path" value={m.storage_path} />
                  <button className="text-red-400 hover:underline">Verwijderen</button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
