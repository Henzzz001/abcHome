import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getUserRoles } from "@/lib/auth/get-user-roles";
import { LogoutButton } from "@/features/auth/logout-button";

export default async function DashboardPage() {
  const user = await requireAuth();
  const userRoles = await getUserRoles();

  if (userRoles.includes("admin")) {
    redirect("/admin");
  }

  if (userRoles.includes("teacher")) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold">
          Teacher Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Signed in as {user.email}
        </p>

        <div className="mt-6">
          <LogoutButton />
        </div>
      </main>
    );
  }

  if (userRoles.includes("student")) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold">
          Student Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Signed in as {user.email}
        </p>

        <div className="mt-6">
          <LogoutButton />
        </div>
      </main>
    );
  }

  if (userRoles.includes("parent")) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold">
          Parent Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Signed in as {user.email}
        </p>

        <div className="mt-6">
          <LogoutButton />
        </div>
      </main>
    );
  }

  if (userRoles.includes("staff")) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold">
          Staff Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Signed in as {user.email}
        </p>

        <div className="mt-6">
          <LogoutButton />
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">
        Account Setup Required
      </h1>

      <p className="mt-2 text-gray-600">
        Your account does not have an assigned role.
      </p>

      <div className="mt-6">
        <LogoutButton />
      </div>
    </main>
  );
}