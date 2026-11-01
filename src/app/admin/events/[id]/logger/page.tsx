"use client";

import { useState, useRef, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AttendanceLoggerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = use(params);
  const [manualInput, setManualInput] = useState("");
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
    studentName?: string;
  }>({ type: null, message: "" });
  const [loading, setLoading] = useState(false);

  const manualInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Focus input field automatically on mount
  useEffect(() => {
    manualInputRef.current?.focus();
  }, []);

  const processCheckIn = async (studentIdCode: string) => {
    const cleanCode = studentIdCode.trim();
    if (!cleanCode) return;

    setLastScanned(cleanCode);
    setStatus({ type: "info", message: `Checking ID: ${cleanCode}...` });

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, student_id")
        .eq("student_id", cleanCode)
        .single();

      if (profileError || !profile) {
        setStatus({
          type: "error",
          message: `Unrecognized Student ID: "${cleanCode}"`,
        });
        return;
      }

      const { data: existingLog } = await supabase
        .from("attendance_logs")
        .select("id")
        .eq("event_id", eventId)
        .eq("student_id", profile.id)
        .single();

      if (existingLog) {
        setStatus({
          type: "error",
          message: `${profile.full_name} is ALREADY logged for this event!`,
          studentName: profile.full_name,
        });
        return;
      }

      const { error: insertError } = await supabase
        .from("attendance_logs")
        .insert([{ event_id: eventId, student_id: profile.id }]);

      if (insertError) throw insertError;

      setStatus({
        type: "success",
        message: `Check-in successful!`,
        studentName: profile.full_name,
      });
    } catch (err: any) {
      console.error("Check-in error:", err);
      setStatus({
        type: "error",
        message: err.message || "Failed to record attendance.",
      });
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    setLoading(true);
    await processCheckIn(manualInput);
    setManualInput("");
    setLoading(false);
    setTimeout(() => manualInputRef.current?.focus(), 50);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 px-6 py-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Manual Attendance Logger</h1>
            <p className="text-xs text-slate-500">Desktop Check-In Console</p>
          </div>
        </div>
        <Link
          href={`/admin/events/${eventId}/attendance-sheet`}
          className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-lg border border-emerald-200 transition-colors shadow-xs flex items-center gap-2"
        >
          <span>📊</span>
          <span>View Live Attendance Sheet</span>
        </Link>
      </header>

      {/* Main Console Container */}
      <main className="flex-1 w-full max-w-2xl mx-auto p-6 md:p-12 flex flex-col justify-center">
        <div className="space-y-6">
          <form onSubmit={handleManualSubmit} className="space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Enter Student ID Number
              </label>
              <input
                ref={manualInputRef}
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g. 2024-00123"
                disabled={loading}
                className="w-full px-5 py-4 text-2xl font-mono font-bold text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all placeholder:font-normal placeholder:text-slate-400 shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !manualInput.trim()}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-[0.99]"
            >
              {loading ? "Processing..." : "Log Attendance (Enter ↵)"}
            </button>
          </form>

          {/* Status Display */}
          {status.type && (
            <div
              className={`p-5 rounded-2xl border text-sm flex flex-col gap-1 shadow-xs ${
                status.type === "success"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : status.type === "error"
                  ? "bg-red-50 border-red-300 text-red-900"
                  : "bg-blue-50 border-blue-300 text-blue-900"
              }`}
            >
              <div className="font-bold flex items-center gap-2 text-base">
                <span>{status.type === "success" ? "✅" : status.type === "error" ? "⚠️" : "ℹ️"}</span>
                <span>{status.message}</span>
              </div>
              {status.studentName && (
                <div className="text-xs font-semibold opacity-90 pl-7">
                  Student: {status.studentName}
                </div>
              )}
            </div>
          )}

          {lastScanned && (
            <div className="text-center text-xs text-slate-400 font-mono pt-2">
              Last Processed Code: <span className="text-slate-800 font-bold">{lastScanned}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}