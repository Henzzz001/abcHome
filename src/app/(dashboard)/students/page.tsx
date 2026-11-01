"use client";

import { useState } from "react";
import { encodeStudent } from "@/features/organization/actions";

export default function StudentEncodingPage() {
  const [studentNumber, setStudentNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [yearLevel, setYearLevel] = useState("1st Year");
  const [statusMsg, setStatusMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleEncodeStudent(e: React.FormEvent) {
    e.preventDefault();
    setStatusMsg(null);
    setIsSubmitting(true);

    const schoolId = "00000000-0000-0000-0000-000000000000"; // Replace with context/auth school ID

    const res = await encodeStudent({
      schoolId,
      studentNumber,
      fullName,
      departmentId,
      programId,
      yearLevel,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setStatusMsg({ type: "error", text: res.error || "Failed to encode student." });
    } else {
      setStatusMsg({
        type: "success",
        text: `Student ${res.student.student_number} (${res.student.full_name}) successfully encoded!`,
      });
      // Reset input fields for rapid sequential entry
      setStudentNumber("");
      setFullName("");
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Encoding</h1>
        <p className="text-sm text-gray-500">
          Encode students into the database one-by-one for event attendance verification.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded text-sm ${
            statusMsg.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <form onSubmit={handleEncodeStudent} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Student ID / Barcode Text
            </label>
            <input
              type="text"
              required
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="e.g. ELD19200189"
              className="mt-1 block w-full px-3 py-2 border rounded-md text-sm font-mono focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Juan Cruz"
              className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">Department UUID</label>
              <input
                type="text"
                required
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                placeholder="Department UUID"
                className="mt-1 block w-full px-3 py-2 border rounded-md text-sm font-mono focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Program UUID</label>
              <input
                type="text"
                required
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                placeholder="Program UUID"
                className="mt-1 block w-full px-3 py-2 border rounded-md text-sm font-mono focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Year Level</label>
            <select
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm rounded-md shadow transition-colors"
          >
            {isSubmitting ? "Encoding..." : "Save Student Record"}
          </button>
        </form>
      </div>
    </div>
  );
}