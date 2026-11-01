"use client";

import { logAttendance } from "@/actions/attendance-actions";
import { useRef, useState, useEffect } from "react";

export function AttendanceScanner({ eventId }: { eventId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanInput, setScanInput] = useState("");
  const [lastScan, setLastScan] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Keep focus on the input field for continuous scanning
  useEffect(() => {
    inputRef.current?.focus();
  }, [lastScan]);

  async function handleScanSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scanInput.trim() || isProcessing) return;

    setIsProcessing(true);
    const result = await logAttendance(eventId, scanInput);
    setIsProcessing(false);

    if (result.error) {
      setLastScan({ status: "error", message: result.error });
    } else if (result.success) {
      setLastScan({
        status: "success",
        message: `LOGGED: ${result.studentName} (${result.studentId})`,
      });
    }

    setScanInput("");
  }

  return (
    <div className="space-y-6">
      {/* Scanner Input Card */}
      <div className="p-6 border rounded-xl bg-card shadow-sm space-y-4">
        <form onSubmit={handleScanSubmit} className="space-y-3">
          <label className="block text-sm font-semibold">
            Scan QR Code or Input Student ID
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Click here or scan barcode/QR..."
              disabled={isProcessing}
              className="flex-1 px-4 py-3 border-2 border-primary/50 rounded-lg text-lg font-mono bg-background focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {isProcessing ? "Logging..." : "Log Attendance"}
            </button>
          </div>
        </form>

        {/* Scan Result Feedback Banner */}
        {lastScan && (
          <div
            className={`p-4 rounded-lg font-medium text-sm flex items-center justify-between border ${
              lastScan.status === "success"
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <span>{lastScan.message}</span>
            <span className="text-xs opacity-75">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}