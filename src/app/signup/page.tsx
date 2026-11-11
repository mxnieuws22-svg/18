import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function adult(dob: string) {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return false;
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 18);
  return d <= limit;
}

async function signup(formData: FormData) {
  "use server";
  const username = String(formData.get("username") ?? "").toLowerCase().trim();
  const dob = String(formData.get("dob") ?? "");
  const role = formData.get("role") === "creator" ? "creator" : "fan";
  const fail = (m: string) => redirect(`/signup?error=${encodeURIComponent(m)}`);

  if (!/^[a-z0-9_]{3,24}$/.test(username)) fail("Username: 3–24 letters, numbers or underscores.");
  if (!adult(dob)) fail("You must be at least 18 years old.");
  if (formData.get("age") !== "on") fail("Please confirm you are 18 or older.");
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) fail("Password must be at least 10 characters.");

  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        username, role, date_of_birth: dob, age_confirmed: true,
        display_name: String(formData.get("display_name") ?? "").trim().slice(0, 60) || username,
      },
    },
  });
  if (error) fail(error.message.includes("Database error") ? "That username is taken or invalid." : error.message);
  redirect(data.session ? "/account" : "/login?check=1");
}

export default async function Signup({ searchParams }: { searchParams: Promise<{ error?: string; role?: string }> }) {
  const { error, role } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-display text-3xl text-white">Join Veil</h1>
      <p className="mt-2 text-sm text-zinc-400">Adults only. Creators are reviewed before they go live.</p>
      <form action={signup} className="card mt-8 space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="card flex cursor-pointer items-center gap-2 p-3 has-[:checked]:border-accent/60">
            <input type="radio" name="role" value="fan" defaultChecked={role !== "creator"} /> I’m a fan
          </label>
          <label className="card flex cursor-pointer items-center gap-2 p-3 has-[:checked]:border-accent/60">
            <input type="radio" name="role" value="creator" defaultChecked={role === "creator"} /> I’m a creator
          </label>
        </div>
        <div><label className="label">Email</label><input name="email" type="email" required autoComplete="email" className="input" /></div>
        <div><label className="label">Username</label><input name="username" required pattern="[a-zA-Z0-9_]{3,24}" className="input" /></div>
        <div><label className="label">Display name</label><input name="display_name" maxLength={60} className="input" /></div>
        <div><label className="label">Date of birth</label><input name="dob" type="date" required className="input" /></div>
        <div><label className="label">Password</label><input name="password" type="password" required minLength={10} autoComplete="new-password" className="input" /></div>
        <label className="flex items-start gap-2 text-sm text-zinc-400">
          <input type="checkbox" name="age" required className="mt-1" />
          I confirm that I am 18 years or older and legally allowed to view adult content where I live.
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="btn-primary w-full">Create account</button>
      </form>
      <p className="mt-5 text-center text-sm text-zinc-500">Already a member? <Link href="/login" className="text-accent">Log in</Link></p>
    </div>
  );
}
