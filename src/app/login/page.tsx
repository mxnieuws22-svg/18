import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function login(formData: FormData) {
  "use server";
  const next = String(formData.get("next") || "/discover");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/discover";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) redirect(`/login?error=1&next=${encodeURIComponent(safeNext)}`);
  redirect(safeNext);
}

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string; check?: string }> }) {
  const { error, next = "/discover", check } = await searchParams;
  return (
    <div className="mx-auto max-w-sm px-5 py-20">
      <h1 className="font-display text-3xl text-white">Welkom terug</h1>
      <form action={login} className="card mt-8 space-y-4 p-6">
        <input type="hidden" name="next" value={next} />
        <div><label className="label">E-mail</label><input name="email" type="email" required autoComplete="email" className="input" /></div>
        <div><label className="label">Wachtwoord</label><input name="password" type="password" required autoComplete="current-password" className="input" /></div>
        {check && <p className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm text-accent-soft">Account aangemaakt. Controleer je e-mail (ook de spammap) en klik op de bevestigingslink. Daarna kun je inloggen.</p>}
        {error && <p className="text-sm text-red-400">Ongeldig e-mailadres of wachtwoord.</p>}
        <button className="btn-primary w-full">Inloggen</button>
        <p className="text-center text-xs"><Link href="/forgot-password" className="text-zinc-500 hover:text-accent">Wachtwoord vergeten?</Link></p>
      </form>
      <p className="mt-5 text-center text-sm text-zinc-500">Nog geen account? <Link href="/signup" className="text-accent">Aanmelden</Link></p>
    </div>
  );
}
