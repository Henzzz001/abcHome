"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createOrganization(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const code = (formData.get("code") as string)?.toUpperCase().trim();
  const description = formData.get("description") as string;

  if (!name || !code) {
    return { error: "Organization Name and Short Code are required." };
  }

  const { error } = await supabase.from("organizations").insert({
    name,
    code,
    description,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "An organization with this Short Code already exists." };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/organizations");
  return { success: "Organization created successfully!" };
}