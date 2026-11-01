import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { getUserRoles } from "@/lib/auth/get-user-roles";
import { redirect } from "next/navigation";
import { createOrganization } from "@/actions/organization-actions";

export default async function OrganizationsAdminPage() {
  await requireAuth();
  const roles = await getUserRoles();

  if (!roles.includes("admin")) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: organizations } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Directory</h1>
          <p className="text-sm text-gray-500">
            Dynamically register and manage campus councils, SSG, SSC, and departmental societies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Form */}
        <div className="p-6 border rounded-xl bg-card shadow-sm h-fit">
          <h2 className="text-xl font-semibold mb-4">Register New Organization</h2>
          <form action={createOrganization} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Organization Name</label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Political Science Society"
                className="w-full px-3 py-2 border rounded-md text-sm bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Short Code / Acronym</label>
              <input
                type="text"
                name="code"
                required
                placeholder="e.g. POLSCI"
                className="w-full px-3 py-2 border rounded-md text-sm bg-background uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Brief summary of organizational scope..."
                className="w-full px-3 py-2 border rounded-md text-sm bg-background"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-primary text-primary-foreground font-medium rounded-md text-sm hover:opacity-90 transition-opacity"
            >
              Add Organization
            </button>
          </form>
        </div>

        {/* Existing Organizations List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Active Organizations ({organizations?.length || 0})</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organizations && organizations.length > 0 ? (
              organizations.map((org) => (
                <div key={org.id} className="p-5 border rounded-xl bg-card shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg">{org.name}</h3>
                    <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground font-mono font-semibold rounded">
                      {org.code}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {org.description || "No description provided."}
                  </p>
                  <div className="pt-2 text-xs text-gray-400">
                    Created: {new Date(org.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-8 text-center border border-dashed rounded-xl text-gray-500">
                No organizations registered yet. Use the form to add the first one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}