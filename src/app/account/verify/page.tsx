import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sumsubConfigured } from "@/lib/sumsub";
import Sdk from "./Sdk";

export const dynamic = "force-dynamic";

export default async function Verify() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/verify");
  const { data: me } = await supabase.from("profiles").select("role, verification_status").eq("id", user.id).single();
  if (me?.role !== "creator") redirect("/account");

  return (
    <div className="mx-auto max-w-xl px-5 py-14">
      <h1 className="font-display text-3xl text-white">Identiteitscontrole</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Je maakt een foto van je identiteitsbewijs en een selfie. De controle gebeurt door onze partner Sumsub.
        Fannova bewaart je ID-foto’s niet; wij ontvangen alleen de uitkomst.
      </p>
      <div className="mt-8">
        {me.verification_status === "verified" ? (
          <p className="card p-5 text-sm text-zinc-300">Je bent al geverifieerd.</p>
        ) : me.verification_status === "pending" ? (
          <p className="card p-5 text-sm text-zinc-300">Je identiteit is gecontroleerd. Ons team beoordeelt nu je profiel.</p>
        ) : !sumsubConfigured() ? (
          <p className="card p-5 text-sm text-zinc-400">De identiteitscontrole is nog niet beschikbaar. Probeer het later opnieuw.</p>
        ) : (
          <Sdk />
        )}
      </div>
      <p className="mt-6 text-sm"><Link href="/account" className="text-accent">← Terug naar account</Link></p>
    </div>
  );
}
