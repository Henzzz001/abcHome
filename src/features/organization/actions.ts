"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- DEPARTMENTS ---
export async function createDepartment(schoolId: string, name: string, code: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("departments")
    .insert({
      school_id: schoolId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
    })
    .select("*")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/departments");
  return { success: true, department: data };
}

export async function getDepartments(schoolId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*, programs(*)")
    .eq("school_id", schoolId)
    .order("name", { ascending: true });

  if (error) return [];
  return data;
}

// --- PROGRAMS ---
export async function createProgram(departmentId: string, name: string, code: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("programs")
    .insert({
      department_id: departmentId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
    })
    .select("*")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/departments");
  return { success: true, program: data };
}

// --- STUDENT ENCODING (ONE-BY-ONE) ---
export async function encodeStudent(studentData: {
  schoolId: string;
  studentNumber: string;
  fullName: string;
  departmentId: string;
  programId: string;
  yearLevel: string;
}) {
  const supabase = await createClient();

  // Clean student number
  const formattedStudentNum = studentData.studentNumber.trim().toUpperCase();

  const { data, error } = await supabase
    .from("students")
    .insert({
      school_id: studentData.schoolId,
      student_number: formattedStudentNum,
      full_name: studentData.fullName.trim(),
      department_id: studentData.departmentId,
      program_id: studentData.programId,
      year_level: studentData.yearLevel,
      must_change_password: true,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Student ID number already exists in database." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/students");
  return { success: true, student: data };
}