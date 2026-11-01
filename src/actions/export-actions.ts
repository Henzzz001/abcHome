"use server";

import { createClient } from "@/lib/supabase/server";

export async function generateAttendanceCSV(eventId: string) {
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("title")
    .eq("id", eventId)
    .single();

  const { data: logs, error } = await supabase
    .from("attendance_logs")
    .select(`
      scanned_at,
      profiles:student_id (
        full_name,
        student_id,
        email
      )
    `)
    .eq("event_id", eventId)
    .order("scanned_at", { ascending: true });

  if (error || !logs) {
    return { error: "Failed to generate CSV export." };
  }

  // Format into CSV string
  const headers = ["Student Name", "Student ID", "Email", "Scanned At Date", "Scanned At Time"];
  const rows = logs.map((log: any) => {
    const rawProfile = log.profiles as unknown;
    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
    const scanDate = new Date(log.scanned_at);

    return [
      `"${profile?.full_name || "N/A"}"`,
      `"${profile?.student_id || "N/A"}"`,
      `"${profile?.email || "N/A"}"`,
      `"${scanDate.toLocaleDateString()}"`,
      `"${scanDate.toLocaleTimeString()}"`,
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const filename = `${(event?.title || "event").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_attendance.csv`;

  return { success: true, csvContent, filename };
}