"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface AttendanceRecord {
  id: string;
  created_at: string;
  student_id: string;
  profiles: {
    id: string;
    student_id: string;
    full_name: string;
    department: string;
    course: string;
    year_level: string;
  };
}

export default function LiveAttendanceSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = use(params);
  const [eventTitle, setEventTitle] = useState<string>("Loading Event...");
  const [eventCode, setEventCode] = useState<string>("------");
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchInitialData() {
      const { data: eventData } = await supabase
        .from("events")
        .select("title, code")
        .eq("id", eventId)
        .single();

      if (eventData) {
        setEventTitle(eventData.title);
        if (eventData.code) {
          setEventCode(eventData.code);
        } else {
          const generated = Math.floor(100000 + Math.random() * 900000).toString();
          await supabase.from("events").update({ code: generated }).eq("id", eventId);
          setEventCode(generated);
        }
      }

      const { data: rawLogs, error } = await supabase
        .from("attendance_logs")
        .select("id, created_at, student_id")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching attendance logs:", error.message);
        setLoading(false);
        return;
      }

      if (rawLogs && rawLogs.length > 0) {
        const profileIds = Array.from(new Set(rawLogs.map((l) => l.student_id)));

        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, student_id, full_name, department, course, year_level")
          .in("id", profileIds);

        const profileMap = new Map();
        if (profilesData) {
          profilesData.forEach((p) => profileMap.set(p.id, p));
        }

        const combinedLogs: AttendanceRecord[] = rawLogs.map((log) => ({
          id: log.id,
          created_at: log.created_at,
          student_id: log.student_id,
          profiles: profileMap.get(log.student_id) || {
            id: log.student_id,
            student_id: "N/A",
            full_name: "Unknown Student",
            department: "—",
            course: "—",
            year_level: "—",
          },
        }));

        setLogs(combinedLogs);
      }

      setLoading(false);
    }

    fetchInitialData();

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
          const newLog = payload.new;

          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, student_id, full_name, department, course, year_level")
            .eq("id", newLog.student_id)
            .single();

          const newRecord: AttendanceRecord = {
            id: newLog.id,
            created_at: newLog.created_at,
            student_id: newLog.student_id,
            profiles: profileData || {
              id: newLog.student_id,
              student_id: "N/A",
              full_name: "Unknown Student",
              department: "—",
              course: "—",
              year_level: "—",
            },
          };

          setLogs((prevLogs) => [newRecord, ...prevLogs]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, supabase]);

  const handleCellChange = (
    index: number,
    field: keyof AttendanceRecord["profiles"],
    value: string
  ) => {
    setLogs((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        profiles: {
          ...updated[index].profiles,
          [field]: value,
        },
      };
      return updated;
    });
  };

  const handleCellBlur = async (profileId: string, field: string, value: string) => {
    if (!profileId) return;
    setSavingId(profileId);

    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value })
      .eq("id", profileId);

    if (error) {
      console.error(`Failed to update ${field}:`, error.message);
    }

    setSavingId(null);
  };

  const handleDeleteRow = async (logId: string) => {
    if (!confirm("Are you sure you want to remove this student from the attendance sheet?")) return;

    const { error } = await supabase.from("attendance_logs").delete().eq("id", logId);

    if (!error) {
      setLogs((prev) => prev.filter((item) => item.id !== logId));
    } else {
      console.error("Error deleting log:", error.message);
      alert(`Failed to delete record: ${error.message}`);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (
      log.profiles?.student_id?.toLowerCase().includes(term) ||
      log.profiles?.full_name?.toLowerCase().includes(term) ||
      log.profiles?.department?.toLowerCase().includes(term) ||
      log.profiles?.course?.toLowerCase().includes(term)
    );
  });

  const exportToCSV = () => {
    const headers = ["Student ID,Full Name,Department,Course,Year Level,Time Scanned\n"];
    const rows = filteredLogs.map((log) => {
      const p = log.profiles;
      const time = new Date(log.created_at).toLocaleTimeString();
      return `"${p?.student_id || ""}","${p?.full_name || ""}","${p?.department || ""}","${p?.course || ""}","${p?.year_level || ""}","${time}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows.join("\n"));
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${eventTitle.replace(/\s+/g, "_")}_attendance.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex flex-col bg-emerald-50 border border-emerald-300 rounded-lg px-3 py-1 text-center shadow-xs">
            <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-widest">
              Session Code
            </span>
            <span className="text-lg font-mono font-black text-emerald-800 tracking-wider">
              {eventCode}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{eventTitle}</h1>
            <p className="text-xs text-slate-500">
              Live Attendance Sheet • Enter session code on phones to connect
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>📥 Export CSV</span>
          </button>
          <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
          <Link
            href={`/admin/events/${eventId}/logger`}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-300 transition-colors shadow-xs"
          >
            📱 Attendance Logger
          </Link>
          <Link
            href="/admin"
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors shadow-xs"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white px-6 py-3 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-md border border-emerald-200 font-semibold">
            <span>Total Checked In:</span>
            <span className="text-sm font-extrabold">{filteredLogs.length}</span>
          </div>
          {savingId && (
            <span className="text-xs font-mono text-emerald-600 animate-pulse">
              💾 Saving changes...
            </span>
          )}
        </div>

        <div className="w-full sm:w-80 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by ID, name, or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-xs"
          />
        </div>
      </div>

      <div className="flex-1 w-full bg-white overflow-auto">
        <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
          <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 z-10 select-none">
            <tr>
              <th className="py-3 px-3 border-r border-slate-200 w-12 text-center text-slate-400 bg-slate-100 font-mono">#</th>
              <th className="py-3 px-3 border-r border-slate-200 w-44">Student ID</th>
              <th className="py-3 px-3 border-r border-slate-200">Full Name</th>
              <th className="py-3 px-3 border-r border-slate-200 w-48">Department</th>
              <th className="py-3 px-3 border-r border-slate-200 w-48">Course</th>
              <th className="py-3 px-3 border-r border-slate-200 w-32">Year Level</th>
              <th className="py-3 px-3 border-r border-slate-200 text-right w-36">Time Scanned</th>
              <th className="py-3 px-3 text-center w-16">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-20 text-center text-slate-400 text-sm">
                  Loading editable spreadsheet...
                </td>
              </tr>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log, index) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-2 px-3 border-r border-slate-100 text-center font-mono text-slate-400 bg-slate-50/50">
                    {index + 1}
                  </td>
                  <td className="p-1 border-r border-slate-100">
                    <input
                      type="text"
                      value={log.profiles?.student_id || ""}
                      onChange={(e) => handleCellChange(index, "student_id", e.target.value)}
                      onBlur={(e) => handleCellBlur(log.profiles?.id, "student_id", e.target.value)}
                      className="w-full px-2 py-1.5 font-mono font-bold text-emerald-600 bg-transparent rounded focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none hover:bg-slate-100/80 transition-all"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-100">
                    <input
                      type="text"
                      value={log.profiles?.full_name || ""}
                      onChange={(e) => handleCellChange(index, "full_name", e.target.value)}
                      onBlur={(e) => handleCellBlur(log.profiles?.id, "full_name", e.target.value)}
                      className="w-full px-2 py-1.5 font-bold text-slate-900 bg-transparent rounded focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none hover:bg-slate-100/80 transition-all"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-100">
                    <input
                      type="text"
                      value={log.profiles?.department || ""}
                      onChange={(e) => handleCellChange(index, "department", e.target.value)}
                      onBlur={(e) => handleCellBlur(log.profiles?.id, "department", e.target.value)}
                      className="w-full px-2 py-1.5 text-slate-600 bg-transparent rounded focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none hover:bg-slate-100/80 transition-all"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-100">
                    <input
                      type="text"
                      value={log.profiles?.course || ""}
                      onChange={(e) => handleCellChange(index, "course", e.target.value)}
                      onBlur={(e) => handleCellBlur(log.profiles?.id, "course", e.target.value)}
                      className="w-full px-2 py-1.5 text-slate-600 bg-transparent rounded focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none hover:bg-slate-100/80 transition-all"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-100">
                    <input
                      type="text"
                      value={log.profiles?.year_level || ""}
                      onChange={(e) => handleCellChange(index, "year_level", e.target.value)}
                      onBlur={(e) => handleCellBlur(log.profiles?.id, "year_level", e.target.value)}
                      className="w-full px-2 py-1.5 text-slate-600 bg-transparent rounded focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none hover:bg-slate-100/80 transition-all"
                    />
                  </td>
                  <td className="py-3 px-4 border-r border-slate-100 text-right font-mono text-slate-500 font-semibold select-none">
                    {new Date(log.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => handleDeleteRow(log.id)}
                      title="Delete entry"
                      className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-24 text-center text-slate-400 space-y-2">
                  <div className="text-4xl">📋</div>
                  <div className="font-semibold text-slate-600 text-base">
                    No attendance records yet
                  </div>
                  <p className="text-xs text-slate-400">
                    Scans will automatically appear here in real time.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}