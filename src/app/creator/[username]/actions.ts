"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleFollow(formData: FormData) {
  const creatorId = String(formData.get("creatorId"));
  const username = String(formData.get("username"));
  const following = formData.get("following") === "1";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // RLS enforces: adult member, listed creator, own follower_id.
  if (following) {
    await supabase.from("follows").delete().eq("follower_id", user.id).eq("creator_id", creatorId);
  } else {
    await supabase.from("follows").insert({ follower_id: user.id, creator_id: creatorId });
  }
  revalidatePath(`/creator/${username}`);
}

export async function reportCreator(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);
  if (reason.length < 3) return;
  await supabase.from("reports").insert({
    reporter_id: user.id,
    target_profile_id: String(formData.get("creatorId")),
    reason,
  });
}
