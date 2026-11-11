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

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next = "/discover" } = await searchParams;
  return (
    <div className="mx-auto max-w-sm px-5 py-20">
      <h1 className="font-display text-3xl text-white">Welcome back</h1>
      <form action={login} className="card mt-8 space-y-4 p-6">
        <input type="hidden" name="next" value={next} />
        <div><label className="label">Email</label><input name="email" type="email" required autoComplete="email" className="input" /></div>
        <div><label className="label">Password</label><input name="password" type="password" required autoComplete="current-password" className="input" /></div>
        {error && <p className="text-sm text-red-400">Invalid email or password.</p>}
        <button className="btn-primary w-full">Log in</button>
      </form>
      <p className="mt-5 text-center text-sm text-zinc-500">No account? <Link href="/signup" className="text-accent">Join</Link></p>
    </div>
  );
}
