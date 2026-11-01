"use server";

import { createClient } from "@/lib/supabase/server";

// 1. Create Event Attendance Sheet & Auto Generate 6-Digit Code
export async function createAttendanceSheet(programId: string, title: string) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("attendance_sheets")
    .insert({
      program_id: programId,
      title,
      created_by: user.user?.id,
    })
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, sheet: data };
}

// 2. Validate 6-Digit Code and Connect Scanner
export async function connectScannerByCode(accessCode: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("attendance_sheets")
    .select(`
      id,
      title,
      access_code,
      program:programs(id, name, department:departments(name))
    `)
    .eq("access_code", accessCode)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return { success: false, error: "Invalid or inactive 6-digit attendance code." };
  }

  return { success: true, sheet: data };
}

// 3. Lookup Student by Barcode String / Student Number
export async function lookupStudentByBarcode(studentNumber: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("students")
    .select(`
      id,
      student_number,
      full_name,
      year_level,
      program:programs(name),
      department:departments(name)
    `)
    .eq("student_number", studentNumber)
    .single();

  if (error || !data) {
    return { success: false, error: "Student not found in database." };
  }

  return { success: true, student: data };
}

// 4. Confirm and Record Attendance ("Proceed" Click)
export async function recordEventAttendance(sheetId: string, studentId: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("event_attendance_logs")
    .insert({
      sheet_id: sheetId,
      student_id: studentId,
      scanned_by: user.user?.id,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") { // Unique constraint violation
      return { success: false, error: "Student is already marked present for this sheet!" };
    }
    return { success: false, error: error.message };
  }

  return { success: true, log: data };
}