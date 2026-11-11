import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

async function requestReset(formData: FormData) {
  "use server";
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const supabase = await createClient();
  // Result is deliberately not revealed: prevents checking which emails have accounts.
  await supabase.auth.resetPasswordForEmail(String(formData.get("email")), {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  redirect("/forgot-password?sent=1");
}

export default async function ForgotPassword({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  return (
    <div className="mx-auto max-w-sm px-5 py-20">
      <h1 className="font-display text-3xl text-white">Wachtwoord vergeten</h1>
      <form action={requestReset} className="card mt-8 space-y-4 p-6">
        <div><label className="label">E-mail</label><input name="email" type="email" required autoComplete="email" className="input" /></div>
        {sent && <p className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm text-accent-soft">Als dit adres bij een account hoort, sturen we een link om je wachtwoord te wijzigen.</p>}
        <button className="btn-primary w-full">Link versturen</button>
      </form>
      <p className="mt-5 text-center text-sm text-zinc-500"><Link href="/login" className="text-accent">Terug naar inloggen</Link></p>
    </div>
  );
}
