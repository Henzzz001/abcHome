import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { getUserRoles } from "@/lib/auth/get-user-roles";
import { redirect, notFound } from "next/navigation";
import { assignOfficer } from "@/actions/officer-actions";

export default async function OrganizationOfficersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const roles = await getUserRoles();

  if (!roles.includes("admin")) {
    redirect("/dashboard");
  }

  const { id: organizationId } = await params;
  const supabase = await createClient();

  // Fetch Organization Details
  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .single();

  if (!organization) {
    notFound();
  }

  // Fetch Assigned Officers
  const { data: officers } = await supabase
    .from("organization_officers")
    .select(`
      id,
      position,
      created_at,
      profiles:user_id (
        id,
        email,
        full_name,
        student_id
      )
    `)
    .eq("organization_id", organizationId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="border-b pb-4 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
            <span className="text-xs px-2.5 py-1 bg-secondary font-mono font-bold rounded">
              {organization.code}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Officer Delegation & Management Portal
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Assign Officer Form */}
        <div className="p-6 border rounded-xl bg-card shadow-sm h-fit">
          <h2 className="text-xl font-semibold mb-4">Assign New Officer</h2>
          <form action={assignOfficer as any} className="space-y-4">
            <input type="hidden" name="organization_id" value={organizationId} />

            <div>
              <label className="block text-sm font-medium mb-1">Student ID / Number</label>
              <input
                type="text"
                name="student_id"
                required
                placeholder="e.g. 2024-00123"
                className="w-full px-3 py-2 border rounded-md text-sm bg-background"
              />
              <p className="text-xs text-gray-400 mt-1">
                Enter the exact Student ID without domain suffix.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Position / Title</label>
              <input
                type="text"
                name="position"
                placeholder="e.g. Vice President, Event Head, Director"
                className="w-full px-3 py-2 border rounded-md text-sm bg-background"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-primary text-primary-foreground font-medium rounded-md text-sm hover:opacity-90 transition-opacity"
            >
              Assign Officer Role
            </button>
          </form>
        </div>

        {/* Officers Roster */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">
            Assigned Officers ({officers?.length || 0})
          </h2>

          <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
            {officers && officers.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 font-medium">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Position</th>
                    <th className="p-4">Assigned On</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {officers.map((officer: any) => (
                    <tr key={officer.id} className="hover:bg-muted/30">
                      <td className="p-4 font-medium">
                        {officer.profiles?.full_name || "N/A"}
                        <div className="text-xs text-gray-500 font-mono">
                          {officer.profiles?.student_id || officer.profiles?.email}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-primary/10 text-primary font-semibold text-xs rounded">
                          {officer.position}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {new Date(officer.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No officers designated for this organization yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}