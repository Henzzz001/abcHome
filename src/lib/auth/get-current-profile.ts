import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      middle_name,
      last_name,
      phone,
      avatar_path,
      status,
      school_id,
      schools (
        id,
        name,
        code
      )
    `)
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error("Unable to load current profile.");
  }

  return {
    user,
    profile,
  };
}