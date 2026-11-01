"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function verifyBarcodeAndResetPassword(
  studentIdScanned: string,
  newPassword: string
) {
  const studentIdClean = studentIdScanned.trim().toUpperCase();

  if (!studentIdClean || !newPassword) {
    return { success: false, error: "Student ID and new password are required." };
  }

  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  // Use admin client to query and update auth safely
  const supabaseAdmin = createAdminClient();

  // 1. Check if student ID exists in the database
  const { data: student, error: studentError } = await supabaseAdmin
    .from("students")
    .select("profile_id, student_id")
    .eq("student_id", studentIdClean)
    .maybeSingle();

  if (studentError || !student) {
    return { success: false, error: "Scanned Student ID was not found in the database." };
  }

  // 2. Update Supabase Auth user password
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    student.profile_id,
    { password: newPassword }
  );

  if (authError) {
    return { success: false, error: authError.message };
  }

  // 3. Reset must_change_password flag
  await supabaseAdmin
    .from("students")
    .update({ must_change_password: false })
    .eq("profile_id", student.profile_id);

  return { success: true };
}