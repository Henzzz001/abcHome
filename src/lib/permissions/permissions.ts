export const permissions = {
  users: {
    view: "users.view",
    create: "users.create",
    update: "users.update",
    delete: "users.delete",
    assignRoles: "users.assign_roles",
  },

  students: {
    view: "students.view",
    create: "students.create",
    update: "students.update",
    delete: "students.delete",
  },

  teachers: {
    view: "teachers.view",
    create: "teachers.create",
    update: "teachers.update",
    delete: "teachers.delete",
  },

  attendance: {
    view: "attendance.view",
    create: "attendance.create",
    update: "attendance.update",
  },

  announcements: {
    view: "announcements.view",
    create: "announcements.create",
    update: "announcements.update",
    delete: "announcements.delete",
  },
} as const;