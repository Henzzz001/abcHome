import { getUserRoles } from "./get-user-roles";
import type { Role } from "./roles";

export async function hasRole(role: Role): Promise<boolean> {
  const userRoles = await getUserRoles();

  return userRoles.includes(role);
}