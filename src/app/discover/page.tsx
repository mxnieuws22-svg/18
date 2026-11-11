import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreatorCard from "@/components/CreatorCard";
import { CATEGORIES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Discover({
  searchParams,
}: { searchParams: Promise<{ q?: string; cat?: string }> }) {
  const { q = "", cat = "" } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/discover");

  // RLS only returns verified, non-suspended creators (to adult members).
  let query = supabase
    .from("profiles")
    .select("id, username, display_name, creator_profiles!inner(headline, categories)")
    .eq("role", "creator")
    .eq("verification_status", "verified")
    .order("created_at", { ascending: false })
    .limit(48);

  const term = q.trim().replace(/[%,()*]/g, "").slice(0, 40);
  if (term) query = query.or(`username.ilike.%${term}%,display_name.ilike.%${term}%`);
  if ((CATEGORIES as readonly string[]).includes(cat)) {
    query = query.contains("creator_profiles.categories", [cat]);
  }

  const { data: creators, error } = await query;
  const rows = (creators ?? []).map((c) => {
    const cp = Array.isArray(c.creator_profiles) ? c.creator_profiles[0] : c.creator_profiles;
    return { ...c, headline: cp?.headline ?? "", categories: (cp?.categories ?? []) as string[] };
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-display text-4xl text-white">Discover</h1>
      <p className="mt-2 text-zinc-400">Verified creators, reviewed by our team.</p>

      <form className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input name="q" defaultValue={q} placeholder="Search by name or @username" className="input sm:max-w-sm" />
        <select name="cat" defaultValue={cat} className="input sm:max-w-[200px]">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button className="btn-primary">Search</button>
      </form>

      {error && <p className="mt-8 text-sm text-red-400">Could not load creators. Please try again.</p>}
      {!error && rows.length === 0 && (
        <div className="card mt-10 p-10 text-center text-zinc-400">
          No creators found. <Link href="/discover" className="text-accent">Clear filters</Link>
        </div>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((c) => (
          <CreatorCard key={c.id} username={c.username} displayName={c.display_name}
            headline={c.headline} categories={c.categories} />
        ))}
      </div>
    </div>
  );
}
