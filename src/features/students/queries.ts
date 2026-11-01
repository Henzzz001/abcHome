import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export interface StudentListItem {
  id: string;
  student_id: string;
  department: string;
  course: string;
  must_change_password: boolean;
  created_at: string;
  profile: {
    first_name: string;
    middle_name: string | null;
    last_name: string;
    phone: string | null;
  } | null;
}

export async function getStudentsForAdmin(): Promise<StudentListItem[]> {
  await requireRole("admin");

  const supabase = await createClient();

  // RLS restricts this query to students in the admin's school
  const { data, error } = await supabase
    .from("students")
    .select(`
      id,
      student_id,
      department,
      course,
      must_change_password,
      created_at,
      profile:profiles (
        first_name,
        middle_name,
        last_name,
        phone
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching students:", error);
    throw new Error("Failed to load students list.");
  }

  return (data || []) as unknown as StudentListItem[];
}