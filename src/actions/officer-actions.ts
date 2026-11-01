"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function assignOfficer(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const organizationId = formData.get("organization_id") as string;
  const studentIdentifier = (formData.get("student_id") as string)?.trim();
  const position = (formData.get("position") as string)?.trim() || "Officer";

  if (!organizationId || !studentIdentifier) {
    return { error: "Organization and Student ID are required." };
  }

  // Construct target school email format
  const formattedEmail = studentIdentifier.includes("@")
    ? studentIdentifier.toLowerCase()
    : `${studentIdentifier.toLowerCase()}@school.internal`;

  // Find user profile by email or student ID match
  const { data: targetUser, error: findError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", formattedEmail)
    .single();

  if (findError || !targetUser) {
    return { error: `Student with ID "${studentIdentifier}" not found in database.` };
  }

  const { error: assignError } = await supabase
    .from("organization_officers")
    .insert({
      organization_id: organizationId,
      user_id: targetUser.id,
      position,
    });

  if (assignError) {
    if (assignError.code === "23505") {
      return { error: "This student is already an officer of this organization." };
    }
    return { error: assignError.message };
  }

  revalidatePath("/admin/organizations");
  return { success: "Officer assigned successfully!" };
}

export async function removeOfficer(officerId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("organization_officers")
    .delete()
    .eq("id", officerId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/organizations");
  return { success: "Officer removed successfully." };
}