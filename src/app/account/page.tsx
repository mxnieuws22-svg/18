import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/types";

export const dynamic = "force-dynamic";

async function saveProfile(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const name = String(formData.get("display_name") ?? "").trim().slice(0, 60);
  if (name) await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);

  if (formData.get("is_creator") === "1") {
    const cats = formData.getAll("categories").map(String).filter((c) => (CATEGORIES as readonly string[]).includes(c)).slice(0, 6);
    await supabase.from("creator_profiles").update({
      headline: String(formData.get("headline") ?? "").slice(0, 120),
      about: String(formData.get("about") ?? "").slice(0, 2000),
      categories: cats,
    }).eq("profile_id", user.id);
  }
  revalidatePath("/account");
}

async function requestVerification() {
  "use server";
  const supabase = await createClient();
  await supabase.rpc("request_verification");
  revalidatePath("/account");
}

async function deleteAccount(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("username, role").eq("id", user.id).single();
  if (!me || me.role === "admin") redirect("/account?delete=admin");
  if (String(formData.get("confirm")).trim().toLowerCase() !== me.username) redirect("/account?delete=confirm");

  // Remove stored files first (direct SQL deletes on storage are blocked).
  const { data: files } = await supabase.storage.from("media").list(user.id, { limit: 1000 });
  if (files?.length) await supabase.storage.from("media").remove(files.map((f) => `${user.id}/${f.name}`));
  const { error } = await supabase.rpc("delete_my_account");
  if (error) redirect("/account?delete=error");
  await supabase.auth.signOut();
  redirect("/?verwijderd=1");
}

const STATUS_COPY: Record<string, string> = {
  unverified: "Dien je profiel in voor beoordeling om zichtbaar te worden.",
  pending: "In beoordeling. Je verschijnt in Ontdekken zodra je bent goedgekeurd.",
  verified: "Geverifieerd — je profiel is live.",
  rejected: "Je aanvraag is niet goedgekeurd. Pas je profiel aan en vraag opnieuw aan.",
};

export default async function Account({ searchParams }: { searchParams: Promise<{ delete?: string }> }) {
  const { delete: del } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");
  const { data: profile } = await supabase.from("profiles")
    .select("username, display_name, role, verification_status").eq("id", user.id).single();
  if (!profile) redirect("/login");
  const isCreator = profile.role === "creator";
  const { data: cp } = isCreator
    ? await supabase.from("creator_profiles").select("headline, about, categories").eq("profile_id", user.id).single()
    : { data: null };

  return (
    <div className="mx-auto max-w-xl px-5 py-14">
      <h1 className="font-display text-3xl text-white">Account</h1>
      <p className="mt-1 text-sm text-zinc-500">@{profile.username} · {profile.role}</p>

      {isCreator && (
        <div className="card mt-8 flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-medium text-white">Verificatie: {profile.verification_status}</p>
            <p className="text-sm text-zinc-400">{STATUS_COPY[profile.verification_status]}</p>
          </div>
          {(profile.verification_status === "unverified" || profile.verification_status === "rejected") && (
            <form action={requestVerification}><button className="btn-primary">Aanvragen</button></form>
          )}
        </div>
      )}

      <form action={saveProfile} className="card mt-6 space-y-4 p-6">
        <input type="hidden" name="is_creator" value={isCreator ? "1" : "0"} />
        <div><label className="label">Weergavenaam</label><input name="display_name" defaultValue={profile.display_name} maxLength={60} className="input" /></div>
        {isCreator && (
          <>
            <div><label className="label">Kopregel</label><input name="headline" defaultValue={cp?.headline ?? ""} maxLength={120} className="input" /></div>
            <div><label className="label">Over</label><textarea name="about" defaultValue={cp?.about ?? ""} maxLength={2000} rows={5} className="input" /></div>
            <div>
              <span className="label">Categorieën (max. 6)</span>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <label key={c} className="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400 has-[:checked]:border-accent/60 has-[:checked]:text-accent">
                    <input type="checkbox" name="categories" value={c} defaultChecked={cp?.categories?.includes(c)} className="sr-only" /> {c}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
        <button className="btn-primary">Opslaan</button>
      </form>

      <details className="card mt-6 p-6" open={!!del}>
        <summary className="cursor-pointer text-sm text-red-400">Account verwijderen</summary>
        <form action={deleteAccount} className="mt-4 space-y-3">
          <p className="text-sm text-zinc-400">Dit wist je profiel, uploads, volgrelaties en meldingen definitief. Typ je gebruikersnaam (<b className="text-white">{profile.username}</b>) ter bevestiging.</p>
          <input name="confirm" required className="input" autoComplete="off" />
          {del === "confirm" && <p className="text-sm text-red-400">De gebruikersnaam komt niet overeen.</p>}
          {del === "admin" && <p className="text-sm text-red-400">Beheerders kunnen hun account niet zelf verwijderen.</p>}
          {del === "error" && <p className="text-sm text-red-400">Verwijderen mislukt. Probeer het opnieuw.</p>}
          <button className="btn-ghost !text-red-400">Definitief verwijderen</button>
        </form>
      </details>
    </div>
  );
}
