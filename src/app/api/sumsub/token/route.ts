import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAccessToken, sumsubConfigured } from "@/lib/sumsub";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!sumsubConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "creator") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    return NextResponse.json({ token: await createAccessToken(user.id) });
  } catch {
    return NextResponse.json({ error: "provider_error" }, { status: 502 });
  }
}
