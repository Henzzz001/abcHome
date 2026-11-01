"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ConnectDevicePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      setError("Please enter a valid 6-digit session code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: event, error: queryError } = await supabase
        .from("events")
        .select("id, title")
        .eq("code", cleanCode)
        .single();

      if (queryError || !event) {
        setError("Invalid session code. Please check with your event admin.");
        setLoading(false);
        return;
      }

      // Redirect directly to the updated /logger route
      router.push(`/admin/events/${event.id}/logger`);
    } catch (err: any) {
      console.error("Connection error:", err);
      setError("An error occurred while connecting.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mb-2 border border-emerald-500/20 text-xl font-bold">
            📶
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Connect Attendance Logger
          </h1>
          <p className="text-xs text-slate-400">
            Enter the 6-digit session code displayed on the main attendance sheet to start logging.
          </p>
        </div>

        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full text-center tracking-[0.5em] font-mono text-3xl font-extrabold py-3 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
          >
            {loading ? "Connecting..." : "Connect to Event"}
          </button>
        </form>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-500 rounded-lg text-red-300 text-xs">
            {error}
          </div>
        )}

        <div className="pt-4 border-t border-slate-900 text-xs">
          <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
            ← Back to Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}