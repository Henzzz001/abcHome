// src/lib/auth/get-user-roles.ts
import { createClient } from "@/lib/supabase/server";

export async function getUserRoles(): Promise<string[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: userRoles } = await supabase
    .from("user_roles")
    .select(`
      roles (
        name
      )
    `)
    .eq("user_id", user.id);

  if (!userRoles) return [];

  return userRoles
    .map((ur: any) => {
      const rawRole = ur.roles as unknown;
      const roleObj = Array.isArray(rawRole) ? rawRole[0] : rawRole;
      return roleObj?.name;
    })
    .filter(Boolean);
}

export async function isSuperAdmin(): Promise<boolean> {
  const roles = await getUserRoles();
  return roles.includes("admin") || roles.includes("super_admin");
}