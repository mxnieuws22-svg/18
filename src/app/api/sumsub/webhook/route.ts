import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook } from "@/lib/sumsub";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyWebhook(raw, request.headers.get("x-payload-digest"), request.headers.get("x-payload-digest-alg"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }
  let evt: any;
  try { evt = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const uid: string | undefined = evt.externalUserId;
  if (!uid || !/^[0-9a-f-]{36}$/i.test(uid)) return NextResponse.json({ ok: true }); // not ours

  // Server-only privileged client: this key must never reach the browser.
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  const answer: string | undefined = evt.reviewResult?.reviewAnswer;
  const rejectType: string | undefined = evt.reviewResult?.reviewRejectType;
  const { error } = await admin.from("creator_verifications").upsert({
    profile_id: uid,
    applicant_id: evt.applicantId ?? null,
    review_status: evt.reviewStatus ?? evt.type ?? null,
    review_answer: answer ?? null,
    reject_type: rejectType ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: "db" }, { status: 500 }); // Sumsub will retry

  if (evt.type === "applicantReviewed") {
    if (answer === "GREEN") {
      // ID passed → awaiting final admin approval.
      await admin.from("profiles").update({ verification_status: "pending" })
        .eq("id", uid).eq("role", "creator").in("verification_status", ["unverified", "rejected"]);
    } else if (answer === "RED" && rejectType === "FINAL") {
      await admin.from("profiles").update({ verification_status: "rejected" })
        .eq("id", uid).eq("role", "creator").in("verification_status", ["unverified", "pending"]);
    }
  }
  return NextResponse.json({ ok: true });
}
