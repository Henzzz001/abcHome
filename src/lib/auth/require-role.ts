import { redirect } from "next/navigation";
import { requireAuth } from "./require-auth";
import { getUserRoles } from "./get-user-roles";
import type { Role } from "./roles";

export async function requireRole(role: Role) {
  await requireAuth();

  const userRoles = await getUserRoles();

  if (!userRoles.includes(role)) {
    redirect("/dashboard");
  }
}