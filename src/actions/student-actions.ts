"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRoles } from "@/lib/auth/get-user-roles";
import { revalidatePath } from "next/cache";

export async function createStudentAccount(formData: FormData) {
  const roles = await getUserRoles();
  if (!roles.includes("admin")) {
    return { error: "Unauthorized action." };
  }

  const fullName = formData.get("full_name") as string;
  const studentId = formData.get("student_id") as string;
  const department = formData.get("department") as string;
  const course = formData.get("course") as string;
  const yearLevel = formData.get("year_level") as string;
  const password = formData.get("password") as string;

  if (!fullName || !studentId || !password) {
    return { error: "Full Name, Student ID, and Password are required." };
  }

  const cleanStudentId = studentId.trim();
  // Internal auth identifier for Supabase Auth engine
  const internalAuthEmail = `${cleanStudentId.toLowerCase()}@school.internal`;

  const adminSupabase = createAdminClient();

  // 1. Create account in Supabase Auth
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: internalAuthEmail,
    password: password,
    email_confirm: true,
    user_metadata: { full_name: fullName, student_id: cleanStudentId },
  });

  if (authError) {
    return { error: authError.message };
  }

  const userId = authData.user.id;

  // 2. Insert into profiles table without requiring an email column
  const { error: profileError } = await adminSupabase.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    student_id: cleanStudentId,
    department: department,
    course: course,
    year_level: yearLevel,
  });

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath("/admin/students");
  return { success: true, message: `Successfully encoded student: ${fullName} (${cleanStudentId})` };
}