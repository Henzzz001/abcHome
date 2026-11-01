"use client";

import { useState, useRef, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ManualAttendanceLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = use(params);
  const [studentIdInput, setStudentIdInput] = useState("");
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
    studentName?: string;
  }>({ type: null, message: "" });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Auto-focus input on mount for rapid keyboard entry / USB scanners
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = studentIdInput.trim();
    if (!cleanId) return;

    setLoading(true);
    setStatus({ type: "info", message: "Searching student record..." });

    try {
      // 1. Find profile by Student ID string
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, student_id")
        .eq("student_id", cleanId)
        .single();

      if (profileError || !profile) {
        setStatus({
          type: "error",
          message: `No student found with ID: "${cleanId}"`,
        });
        setStudentIdInput("");
        setLoading(false);
        inputRef.current?.focus();
        return;
      }

      // 2. Check if already checked in for this event
      const { data: existingLog } = await supabase
        .from("attendance_logs")
        .select("id")
        .eq("event_id", eventId)
        .eq("student_id", profile.id)
        .single();

      if (existingLog) {
        setStatus({
          type: "error",
          message: `${profile.full_name} is already logged for this event!`,
          studentName: profile.full_name,
        });
        setStudentIdInput("");
        setLoading(false);
        inputRef.current?.focus();
        return;
      }

      // 3. Insert new attendance log
      const { error: insertError } = await supabase
        .from("attendance_logs")
        .insert([{ event_id: eventId, student_id: profile.id }]);

      if (insertError) {
        throw insertError;
      }

      setStatus({
        type: "success",
        message: `Check-in successful!`,
        studentName: profile.full_name,
      });
      setStudentIdInput("");
    } catch (err: any) {
      console.error("Manual check-in error:", err);
      setStatus({
        type: "error",
        message: err.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
      // Keep input focused for continuous typing
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg border border-slate-200 p-8 space-y-6">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">💻</span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Laptop Manual Check-In
            </h1>
          </div>
          <Link
            href={`/admin/events/${eventId}/attendance`}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 transition-colors"
          >
            📊 View Live Sheet
          </Link>
        </div>

        {/* Input Form */}
        <form onSubmit={handleManualCheckIn} className="space-y-4">
          <div>
            <label
              htmlFor="studentId"
              className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2"
            >
              Enter Student ID Number
            </label>
            <input
              ref={inputRef}
              id="studentId"
              type="text"
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
              placeholder="e.g. 2024-00123"
              disabled={loading}
              className="w-full px-4 py-3 text-lg font-mono font-bold text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner placeholder:font-normal placeholder:text-slate-400 placeholder:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !studentIdInput.trim()}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            {loading ? "Processing..." : "Log Attendance (Enter ↵)"}
          </button>
        </form>

        {/* Status Alert Display */}
        {status.type && (
          <div
            className={`p-4 rounded-lg border text-sm flex flex-col gap-1 ${
              status.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : status.type === "error"
                ? "bg-red-50 border-red-300 text-red-900"
                : "bg-blue-50 border-blue-300 text-blue-900"
            }`}
          >
            <div className="font-bold flex items-center gap-2">
              <span>{status.type === "success" ? "✅" : status.type === "error" ? "⚠️" : "ℹ️"}</span>
              <span>{status.message}</span>
            </div>
            {status.studentName && (
              <div className="text-xs font-semibold opacity-80 pl-6">
                Student: {status.studentName}
              </div>
            )}
          </div>
        )}

        <div className="text-center text-xs text-slate-400 font-mono">
          Tip: You can plug in a USB barcode gun to this laptop—it acts just like keyboard input!
        </div>
      </div>
    </div>
  );
}