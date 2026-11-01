"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createEvent(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const organizationId = formData.get("organization_id") as string;
  const title = formData.get("title") as string;
  const location = formData.get("location") as string;
  const eventDate = formData.get("event_date") as string;
  const description = formData.get("description") as string;

  if (!organizationId || !title || !eventDate) {
    return { error: "Organization, Title, and Event Date/Time are required." };
  }

  const { error } = await supabase.from("events").insert({
    organization_id: organizationId,
    title,
    location,
    event_date: new Date(eventDate).toISOString(),
    description,
    created_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/events");
  return { success: "Event published successfully!" };
}