"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function loginAction(
  prevState: { error?: string } | null,
  formData: FormData
) {
  const studentIdRaw = ((formData.get("identifier") as string) || "").trim();
  const password = formData.get("password") as string;

  if (!studentIdRaw || !password) {
    return { error: "Please enter your Student ID and password." };
  }

  // Pure Student ID input handling: Format to UPPERCASE and construct internal email
  const studentId = studentIdRaw.toUpperCase();
  const email = `${studentId}@school.internal`;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Invalid Student ID or password." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export const signOut = logoutAction;