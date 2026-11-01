"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";

const createStudentSchema = z.object({
  studentId: z
    .string()
    .trim()
    .min(1, "Student ID is required.")
    .max(50, "Student ID is too long."),

  firstName: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(100, "First name is too long."),

  middleName: z
    .string()
    .trim()
    .max(100, "Middle name is too long.")
    .optional()
    .or(z.literal("")),

  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .max(100, "Last name is too long."),

  department: z
    .string()
    .trim()
    .min(1, "Department is required.")
    .max(200, "Department is too long."),

  course: z
    .string()
    .trim()
    .min(1, "Course is required.")
    .max(200, "Course is too long."),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long."),

  phone: z
    .string()
    .trim()
    .max(50, "Phone number is too long.")
    .optional()
    .or(z.literal("")),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export async function createStudent(input: CreateStudentInput) {
  await requireRole("admin");

  const parsed = createStudentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid student information.",
    };
  }

  const values = parsed.data;

  const admin = createAdminClient();

  const normalizedStudentId = values.studentId.toUpperCase();

  const { data: existingStudent, error: existingStudentError } =
    await admin
      .from("students")
      .select("id")
      .eq("student_id", normalizedStudentId)
      .maybeSingle();

  if (existingStudentError) {
    return {
      success: false,
      error: "Unable to verify student information.",
    };
  }

  if (existingStudent) {
    return {
      success: false,
      error: "A student with this Student ID already exists.",
    };
  }

  const syntheticEmail = `${normalizedStudentId.toLowerCase()}@students.internal`;

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email: syntheticEmail,
      password: values.password,
      email_confirm: true,
      user_metadata: {
        first_name: values.firstName,
        middle_name: values.middleName || null,
        last_name: values.lastName,
        phone: values.phone || null,
      },
    });

  if (authError || !authData.user) {
    return {
      success: false,
      error: "Unable to create student account.",
    };
  }

  const authUser = authData.user;

  try {
    const { data: studentRole, error: studentRoleError } = await admin
      .from("roles")
      .select("id")
      .eq("name", "student")
      .single();

    if (studentRoleError || !studentRole) {
      throw new Error("Student role not found.");
    }

    const { error: roleError } = await admin
      .from("user_roles")
      .insert({
        user_id: authUser.id,
        role_id: studentRole.id,
      });

    if (roleError) {
      throw new Error("Unable to assign student role.");
    }

    const { data: student, error: studentError } = await admin
      .from("students")
      .insert({
        profile_id: authUser.id,
        auth_user_id: authUser.id,
        student_id: normalizedStudentId,
        department: values.department,
        course: values.course,
        must_change_password: true,
      })
      .select("id, student_id")
      .single();

    if (studentError || !student) {
      throw new Error("Unable to create student record.");
    }

    return {
      success: true,
      student: {
        id: student.id,
        studentId: student.student_id,
      },
    };
  } catch {
    await admin.auth.admin.deleteUser(authUser.id);

    return {
      success: false,
      error: "Unable to complete student account creation.",
    };
  }
}