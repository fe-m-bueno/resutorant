"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function togglePlanToGo(venueId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Check if plan exists
  const { data: existingPlan } = await supabase
    .from("user_venue_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("venue_id", venueId)
    .single();

  if (existingPlan) {
    // Remove plan
    await supabase.from("user_venue_plans").delete().eq("id", existingPlan.id);
  } else {
    // Add plan
    await supabase.from("user_venue_plans").insert({
      user_id: user.id,
      venue_id: venueId,
    });
  }

  revalidatePath("/venues");
  revalidatePath("/profile");
}

export async function getPlannedVenues(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_venue_plans")
    .select("venue_id")
    .eq("user_id", userId);

  return data?.map((plan) => plan.venue_id) || [];
}
