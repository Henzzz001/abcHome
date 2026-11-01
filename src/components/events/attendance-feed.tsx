"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type AttendanceLog = {
  id: string;
  scanned_at: string;
  profiles: {
    full_name: string | null;
    student_id: string | null;
    email: string | null;
  } | null;
};

export function AttendanceFeed({
  eventId,
  initialLogs,
  onCountChange,
}: {
  eventId: string;
  initialLogs: AttendanceLog[];
  onCountChange?: (count: number) => void;
}) {
  const [logs, setLogs] = useState<AttendanceLog[]>(initialLogs);
  const supabase = createClient();

  useEffect(() => {
    // Keep local state in sync if initialLogs changes from parent revalidations
    setLogs(initialLogs);
  }, [initialLogs]);

  useEffect(() => {
    // Subscribe to INSERT events on attendance_logs for this specific event
    const channel = supabase
      .channel(`attendance_logs:event_id=eq.${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attendance_logs",
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          const newLogId = payload.new.id;

          // Fetch the profile relation details for the newly inserted record
          const { data: logWithProfile } = await supabase
            .from("attendance_logs")
            .select(`
              id,
              scanned_at,
              profiles:student_id (
                full_name,
                student_id,
                email
              )
            `)
            .eq("id", newLogId)
            .single();

          if (logWithProfile) {
            // Safely cast profile join result
            const rawProfile = logWithProfile.profiles as unknown;
            const profile = Array.isArray(rawProfile)
              ? rawProfile[0]
              : rawProfile;

            const formattedLog: AttendanceLog = {
              id: logWithProfile.id,
              scanned_at: logWithProfile.scanned_at,
              profiles: profile as AttendanceLog["profiles"],
            };

            setLogs((prev) => {
              // Prevent duplicate inserts if state already has it
              if (prev.some((item) => item.id === formattedLog.id)) return prev;
              const nextLogs = [formattedLog, ...prev];
              onCountChange?.(nextLogs.length);
              return nextLogs;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, supabase, onCountChange]);

  return (
    <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-muted/40 font-semibold text-sm flex justify-between items-center">
        <span>Live Attendance Feed</span>
        <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-normal">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live
        </span>
      </div>

      {logs.length > 0 ? (
        <div className="divide-y max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4 flex justify-between items-center text-sm transition-colors hover:bg-muted/20"
            >
              <div>
                <div className="font-semibold">
                  {log.profiles?.full_name || "Student"}
                </div>
                <div className="text-xs font-mono text-gray-500">
                  {log.profiles?.student_id || log.profiles?.email}
                </div>
              </div>
              <div className="text-xs text-gray-400 font-mono">
                {new Date(log.scanned_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500 text-sm">
          No students checked in yet. Start scanning above.
        </div>
      )}
    </div>
  );
}