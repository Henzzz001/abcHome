import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { getUserRoles } from "@/lib/auth/get-user-roles";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboardPage() {
  await requireAuth();
  const roles = await getUserRoles();

  if (!roles.includes("admin")) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Fetch Key Metrics
  const [
    { count: orgCount },
    { count: eventCount },
    { count: userCount },
    { count: attendanceCount },
  ] = await Promise.all([
    supabase.from("organizations").select("*", { count: "exact", head: true }).eq("is_archived", false),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("attendance_logs").select("*", { count: "exact", head: true }),
  ]);

  // Fetch Recent Events with Organization info & Attendance Count
  const { data: recentEvents } = await supabase
    .from("events")
    .select(`
      id,
      title,
      event_date,
      location,
      organizations (
        name,
        code
      ),
      attendance_logs (count)
    `)
    .order("event_date", { ascending: false })
    .limit(5);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header & Primary Portal Shortcuts */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
            <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary font-mono font-bold rounded">
              ROOT CONTROL
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Central hub for campus event operations, student provisioning, and attendance telemetry.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/students/new"
            className="px-4 py-2 bg-emerald-600 text-white font-medium text-sm rounded-lg shadow hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
          >
            <span>+ Encode Student</span>
          </Link>
          <Link
            href="/admin/events"
            className="px-4 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-lg shadow hover:opacity-90 transition-opacity"
          >
            Manage Events
          </Link>
          <Link
            href="/admin/organizations"
            className="px-4 py-2 bg-secondary text-secondary-foreground font-medium text-sm rounded-lg border hover:bg-muted transition-colors"
          >
            Organizations
          </Link>
        </div>
      </div>

      {/* 2. Primary Navigation Cards (Quick Shortcuts) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/students/new"
          className="p-5 border rounded-xl bg-card hover:border-emerald-500 hover:shadow-md transition-all group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">👤</span>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
              Open Portal →
            </span>
          </div>
          <h3 className="font-bold text-lg">Student Encoding</h3>
          <p className="text-xs text-gray-500">
            Manually register new student accounts using their Student ID.
          </p>
        </Link>

        <Link
          href="/admin/events"
          className="p-5 border rounded-xl bg-card hover:border-primary hover:shadow-md transition-all group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">📅</span>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
              View All →
            </span>
          </div>
          <h3 className="font-bold text-lg">Campus Events</h3>
          <p className="text-xs text-gray-500">
            Create events, launch logger tools, and view live attendance feeds.
          </p>
        </Link>

        <Link
          href="/admin/organizations"
          className="p-5 border rounded-xl bg-card hover:border-primary hover:shadow-md transition-all group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🏛️</span>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
              Directory →
            </span>
          </div>
          <h3 className="font-bold text-lg">Organizations</h3>
          <p className="text-xs text-gray-500">
            Manage student councils, societies, and officer permissions.
          </p>
        </Link>
      </div>

      {/* 3. System Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 border rounded-xl bg-card space-y-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Orgs</span>
          <div className="text-2xl font-black">{orgCount || 0}</div>
        </div>

        <div className="p-5 border rounded-xl bg-card space-y-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Events Created</span>
          <div className="text-2xl font-black">{eventCount || 0}</div>
        </div>

        <div className="p-5 border rounded-xl bg-card space-y-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Encoded Profiles</span>
          <div className="text-2xl font-black">{userCount || 0}</div>
        </div>

        <div className="p-5 border rounded-xl bg-card space-y-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Check-Ins</span>
          <div className="text-2xl font-black text-emerald-600">{attendanceCount || 0}</div>
        </div>
      </div>

      {/* 4. Active Events & Quick Logger Access */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Recent Campus Events & Telemetry</h2>
            <p className="text-xs text-gray-500">Quickly launch loggers or jump to live attendance sheets.</p>
          </div>
          <Link href="/admin/events" className="text-xs font-semibold text-primary hover:underline">
            Manage All Events →
          </Link>
        </div>

        <div className="border rounded-xl bg-card shadow-sm divide-y overflow-hidden">
          {recentEvents && recentEvents.length > 0 ? (
            recentEvents.map((event: any) => {
              const rawOrg = event.organizations as unknown;
              const org = Array.isArray(rawOrg) ? rawOrg[0] : rawOrg;
              const scannedCount = event.attendance_logs?.[0]?.count || 0;

              return (
                <div
                  key={event.id}
                  className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 bg-secondary font-mono font-bold rounded">
                        {org?.code || "ORG"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(event.event_date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="font-bold text-base">{event.title}</div>
                    <div className="text-xs text-gray-400">📍 {event.location || "Campus Venue"}</div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right pr-2">
                      <div className="text-base font-extrabold text-emerald-600">{scannedCount}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">Attended</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/events/${event.id}/attendance-sheet`}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold text-xs rounded-md border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                      >
                        <span>🔴 Live Sheet</span>
                      </Link>
                      <Link
                        href={`/admin/events/${event.id}/logger`}
                        className="px-3 py-1.5 bg-primary text-primary-foreground font-semibold text-xs rounded-md hover:opacity-90 transition-opacity"
                      >
                        Logger
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">
              No events found. Create an event in Event Operations to start tracking attendance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}