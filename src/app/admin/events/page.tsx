import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { getUserRoles } from "@/lib/auth/get-user-roles";
import { CreateEventForm } from "@/components/events/create-event-form";
import Link from "next/link";

export default async function EventsManagementPage() {
  const user = await requireAuth();
  const roles = await getUserRoles();
  const isAdmin = roles.includes("admin");

  const supabase = await createClient();

  // 1. Fetch available organizations: Super Admins see ALL orgs; Officers see assigned orgs
  let availableOrgs: any[] = [];

  if (isAdmin) {
    // Super Admin gets access to every single active organization
    const { data: allOrgs } = await supabase
      .from("organizations")
      .select("id, name, code")
      .eq("is_archived", false)
      .order("name");
    availableOrgs = allOrgs || [];
  } else {
    // Regular officers only see their mapped organizations
    const { data: officerOrgs } = await supabase
      .from("organization_officers")
      .select(`
        organization_id,
        organizations (
          id,
          name,
          code,
          is_archived
        )
      `)
      .eq("user_id", user.id);

    availableOrgs =
      officerOrgs
        ?.map((item: any) => {
          const rawOrg = item.organizations as unknown;
          return Array.isArray(rawOrg) ? rawOrg[0] : rawOrg;
        })
        .filter((org: any) => org && !org.is_archived) || [];
  }

  // 2. Fetch published events with attendance counts
  const { data: events } = await supabase
    .from("events")
    .select(`
      id,
      title,
      location,
      event_date,
      created_at,
      organizations (
        name,
        code
      ),
      attendance_logs (count)
    `)
    .order("event_date", { ascending: false });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Operations</h1>
          <p className="text-sm text-gray-500">
            Publish campus events, manage schedules, and track real-time headcount.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Event Creation Form */}
        <div className="p-6 border rounded-xl bg-card shadow-sm h-fit">
          <h2 className="text-xl font-semibold mb-4">Publish New Event</h2>

          {availableOrgs.length > 0 ? (
            <CreateEventForm availableOrgs={availableOrgs} />
          ) : (
            <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg text-amber-800 text-sm">
              You are not assigned as an officer or administrator for any active organization.
            </div>
          )}
        </div>

        {/* Published Events Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">
            Active & Upcoming Events ({events?.length || 0})
          </h2>

          <div className="space-y-4">
            {events && events.length > 0 ? (
              events.map((event: any) => {
                const attendeeCount = event.attendance_logs?.[0]?.count || 0;
                const rawOrg = event.organizations as unknown;
                const org = Array.isArray(rawOrg)
                  ? rawOrg[0]
                  : (rawOrg as { name?: string; code?: string } | null);

                return (
                  <div
                    key={event.id}
                    className="p-5 border rounded-xl bg-card shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary font-mono font-semibold rounded">
                          {org?.code || "ORG"}
                        </span>
                        <h3 className="font-bold text-lg mt-1">{event.title}</h3>
                      </div>
                      <Link
                        href={`/admin/events/${event.id}/scanner`}
                        className="px-3 py-1.5 bg-green-600 text-white font-semibold text-xs rounded-md hover:bg-green-700 transition-colors"
                      >
                        Open Scanner UI
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-2 border-t">
                      <div>
                        <span className="font-medium text-foreground">Venue:</span>{" "}
                        {event.location || "TBA"}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Date:</span>{" "}
                        {new Date(event.event_date).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          Attendance Headcount:
                        </span>{" "}
                        <span className="font-bold text-green-600">
                          {attendeeCount} Logged
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center border border-dashed rounded-xl text-gray-500">
                No events published yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}