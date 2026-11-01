export const roles = {
  admin: "admin",
  teacher: "teacher",
  student: "student",
  parent: "parent",
  staff: "staff",
} as const;

export type Role = (typeof roles)[keyof typeof roles];