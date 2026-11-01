"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface AttendanceRecord {
  id: string;
  created_at: string;
  profiles: {
    student_id: string;
    full_name: string;
    department: string;
    course: string;
    year_level: string;
  };
}

export default function LiveAttendanceSheetClient({
  eventId,
  eventTitle,
  initialLogs,
}: {
  eventId: string;
  eventTitle: string;
  initialLogs: AttendanceRecord[];
}) {
  const [logs, setLogs] = useState<AttendanceRecord[]>(initialLogs);
  const supabase = createClient();

  useEffect(() => {
    // Listen for new attendance logs in real time
    const channel = supabase
      .channel(`public:attendance_logs:event_id=eq.${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attendance_logs",
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          // Fetch student details for newly inserted row
          const { data: newProfile } = await supabase
            .from("profiles")
            .select("student_id, full_name, department, course, year_level")
            .eq("id", payload.new.student_id)
            .single();

          if (newProfile) {
            const newRecord: AttendanceRecord = {
              id: payload.new.id,
              created_at: payload.new.created_at,
              profiles: newProfile,
            };
            setLogs((prevLogs) => [newRecord, ...prevLogs]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, supabase]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider">
              LIVE ATTENDANCE FEED
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-1">{eventTitle}</h1>
          <p className="text-sm text-gray-500">
            Real-time telemetry of checked-in students via QR / Student ID scanner.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/admin/events/${eventId}/scanner`}
            className="px-4 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-md shadow hover:opacity-90 transition-opacity"
          >
            Open Scanner View
          </Link>
          <Link
            href="/admin"
            className="px-4 py-2 bg-secondary text-secondary-foreground font-medium text-sm rounded-md border hover:bg-muted transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 border rounded-xl bg-card shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase">Total Checked In</div>
            <div className="text-2xl font-extrabold text-emerald-600">{logs.length}</div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-lg font-bold text-lg">
            👥
          </div>
        </div>
      </div>

      {/* Realtime Attendance Table */}
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/50 text-xs font-semibold text-gray-500 uppercase">
                <th className="p-4">Student ID</th>
                <th className="p-4">Full Name</th>
                <th className="p-4">Department</th>
                <th className="p-4">Course</th>
                <th className="p-4">Year Level</th>
                <th className="p-4 text-right">Time Scanned</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono font-medium text-primary">
                      {log.profiles?.student_id || "N/A"}
                    </td>
                    <td className="p-4 font-semibold">
                      {log.profiles?.full_name || "Unknown Student"}
                    </td>
                    <td className="p-4 text-gray-600">{log.profiles?.department || "—"}</td>
                    <td className="p-4 text-gray-600">{log.profiles?.course || "—"}</td>
                    <td className="p-4 text-gray-600">{log.profiles?.year_level || "—"}</td>
                    <td className="p-4 text-right font-mono text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 space-y-2">
                    <div className="text-3xl">📭</div>
                    <div className="font-medium">No attendance logs yet for this event.</div>
                    <p className="text-xs text-gray-400">
                      Scans will appear here instantly in real time as students check in.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}