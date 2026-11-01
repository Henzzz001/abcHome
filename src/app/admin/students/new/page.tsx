import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { getUserRoles } from "@/lib/auth/get-user-roles";
import { redirect } from "next/navigation";
import { createStudentAccount } from "@/actions/student-actions";
import Link from "next/link";

export default async function NewStudentPage() {
  await requireAuth();
  const roles = await getUserRoles();
  if (!roles.includes("admin")) redirect("/dashboard");

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin" className="hover:underline">← Admin Dashboard</Link>
        <span>/</span>
        <span>Encode Student</span>
      </div>

      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Manual Student Encoding</h1>
        <p className="text-sm text-gray-500 mt-1">
          Register a new student account into the campus system manually.
        </p>
      </div>

      <form action={createStudentAccount as any} className="space-y-4 border p-6 rounded-xl bg-card shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            name="full_name"
            required
            placeholder="e.g. Juan Dela Cruz"
            className="w-full px-3 py-2 border rounded-md text-sm bg-background"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Student ID Number</label>
            <input
              type="text"
              name="student_id"
              required
              placeholder="e.g. 2024-00123"
              className="w-full px-3 py-2 border rounded-md text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Initial Password</label>
            <input
              type="text"
              name="password"
              required
              defaultValue="password123"
              className="w-full px-3 py-2 border rounded-md text-sm bg-background font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <input
              type="text"
              name="department"
              placeholder="e.g. College of Arts & Sciences"
              className="w-full px-3 py-2 border rounded-md text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Course / Program</label>
            <input
              type="text"
              name="course"
              placeholder="e.g. BA Political Science"
              className="w-full px-3 py-2 border rounded-md text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Year Level</label>
            <select
              name="year_level"
              className="w-full px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="5th Year">5th Year</option>
            </select>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-md text-sm hover:opacity-90 transition-opacity"
          >
            Create & Encode Student Account
          </button>
        </div>
      </form>
    </div>
  );
}