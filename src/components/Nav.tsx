import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Nav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let role: string | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    role = data?.role ?? null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="font-display text-xl tracking-wide text-white">
          Veil<span className="text-accent">.</span>
        </Link>
        <div className="flex items-center gap-1 text-sm text-zinc-400 sm:gap-3">
          <Link href="/discover" className="rounded-full px-3 py-1.5 hover:text-white">Ontdekken</Link>
          {role === "creator" && (
            <Link href="/studio" className="rounded-full px-3 py-1.5 hover:text-white">Studio</Link>
          )}
          {user ? (
            <>
              <Link href="/account" className="rounded-full px-3 py-1.5 hover:text-white">Account</Link>
              <form action="/auth/signout" method="post">
                <button className="btn-ghost !py-1.5">Uitloggen</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-1.5 hover:text-white">Inloggen</Link>
              <Link href="/signup" className="btn-primary !py-1.5">Aanmelden</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
