"use client";

import { useState } from "react";
import { createDepartment, createProgram } from "@/features/organization/actions";

export default function DepartmentsPage() {
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [progName, setProgName] = useState("");
  const [progCode, setProgCode] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleCreateDept(e: React.FormEvent) {
    e.preventDefault();
    setStatusMsg(null);

    const schoolId = "00000000-0000-0000-0000-000000000000"; 
    const res = await createDepartment(schoolId, deptName, deptCode);

    if (!res.success) {
      setStatusMsg({ type: "error", text: res.error || "Failed to create department." });
    } else {
      setStatusMsg({ type: "success", text: `Department "${res.department.name}" created!` });
      setDeptName("");
      setDeptCode("");
    }
  }

  async function handleCreateProg(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDeptId) return;
    setStatusMsg(null);

    const res = await createProgram(selectedDeptId, progName, progCode);

    if (!res.success) {
      setStatusMsg({ type: "error", text: res.error || "Failed to create program." });
    } else {
      setStatusMsg({ type: "success", text: `Program "${res.program.name}" created!` });
      setProgName("");
      setProgCode("");
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Hierarchy</h1>
        <p className="text-sm text-gray-500">Manage Departments and Programs (Student Council & Society Level)</p>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded text-sm ${statusMsg.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CREATE DEPARTMENT (Student Council) */}
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">1. Add Department</h2>
          <form onSubmit={handleCreateDept} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Department Name</label>
              <input
                type="text"
                required
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                placeholder="e.g. College of Arts and Sciences"
                className="mt-1 block w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Department Code</label>
              <input
                type="text"
                required
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                placeholder="e.g. CAS"
                className="mt-1 block w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <button type="submit" className="w-full py-2 bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700">
              Create Department
            </button>
          </form>
        </div>

        {/* CREATE PROGRAM (Society Level) */}
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">2. Add Program / Course</h2>
          <form onSubmit={handleCreateProg} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Parent Department ID</label>
              <input
                type="text"
                required
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                placeholder="Enter Department UUID"
                className="mt-1 block w-full px-3 py-2 border rounded-md text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Program Name</label>
              <input
                type="text"
                required
                value={progName}
                onChange={(e) => setProgName(e.target.value)}
                placeholder="e.g. Computer Science"
                className="mt-1 block w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Program Code</label>
              <input
                type="text"
                required
                value={progCode}
                onChange={(e) => setProgCode(e.target.value)}
                placeholder="e.g. BSCS"
                className="mt-1 block w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <button type="submit" className="w-full py-2 bg-green-600 text-white font-medium text-sm rounded-md hover:bg-green-700">
              Create Program
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}