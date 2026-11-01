"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function logAttendance(eventId: string, studentIdentifier: string) {
  const supabase = await createClient();

  // Verify the scanner session is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized scanner session." };
  }

  const cleanIdentifier = studentIdentifier.trim();
  if (!cleanIdentifier) {
    return { error: "Student ID is required." };
  }

  // Pure Student ID Lookup (case-insensitive)
  const { data: studentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, student_id")
    .ilike("student_id", cleanIdentifier)
    .limit(1)
    .maybeSingle();

  if (profileError || !studentProfile) {
    return { error: `Student ID "${cleanIdentifier}" not found in records.` };
  }

  // Use Admin Client to insert attendance log and bypass strict table RLS
  const adminSupabase = createAdminClient();

  const { error: logError } = await adminSupabase.from("attendance_logs").insert({
    event_id: eventId,
    student_id: studentProfile.id,
    scanned_by: user.id,
  });

  if (logError) {
    if (logError.code === "23505") {
      return {
        error: `Already Scanned: ${studentProfile.full_name || cleanIdentifier} is already logged for this event.`,
      };
    }
    return { error: logError.message };
  }

  revalidatePath(`/admin/events/${eventId}/scanner`);
  return {
    success: true,
    studentName: studentProfile.full_name || cleanIdentifier,
    studentId: studentProfile.student_id || cleanIdentifier,
  };
}