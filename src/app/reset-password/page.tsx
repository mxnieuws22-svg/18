import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function updatePassword(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) redirect("/reset-password?error=kort");
  if (password !== String(formData.get("confirm") ?? "")) redirect("/reset-password?error=verschil");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/reset-password?error=fout");
  redirect("/account");
}

const MSG: Record<string, string> = {
  kort: "Wachtwoord moet minimaal 10 tekens bevatten.",
  verschil: "De wachtwoorden komen niet overeen.",
  fout: "Wijzigen mislukt. Vraag een nieuwe link aan.",
};

export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password");
  return (
    <div className="mx-auto max-w-sm px-5 py-20">
      <h1 className="font-display text-3xl text-white">Nieuw wachtwoord</h1>
      <form action={updatePassword} className="card mt-8 space-y-4 p-6">
        <div><label className="label">Nieuw wachtwoord</label><input name="password" type="password" required minLength={10} autoComplete="new-password" className="input" /></div>
        <div><label className="label">Herhaal wachtwoord</label><input name="confirm" type="password" required minLength={10} autoComplete="new-password" className="input" /></div>
        {error && <p className="text-sm text-red-400">{MSG[error] ?? MSG.fout}</p>}
        <button className="btn-primary w-full">Opslaan</button>
      </form>
    </div>
  );
}
