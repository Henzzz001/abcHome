"use client";

import { generateAttendanceCSV } from "@/actions/export-actions";
import { useState } from "react";

export function ExportCSVButton({ eventId }: { eventId: string }) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    const result = await generateAttendanceCSV(eventId);
    setIsExporting(false);

    if (result.error || !result.csvContent) {
      alert("Failed to generate report.");
      return;
    }

    // Trigger browser file download
    const blob = new Blob([result.csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", result.filename || "attendance_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="w-full py-2 px-4 bg-secondary text-secondary-foreground font-medium rounded-md text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 border"
    >
      {isExporting ? "Generating CSV..." : "📥 Export Attendance CSV"}
    </button>
  );
}