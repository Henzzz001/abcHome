alter table public.students enable row level security;

create policy "Students can read their own student record"
on public.students
for select
to authenticated
using (
  profile_id = (select auth.uid())
);

create policy "Admins can read students in their school"
on public.students
for select
to authenticated
using (
  school_id = (
    select p.school_id
    from public.profiles p
    join public.user_roles ur
      on ur.user_id = p.id
    join public.roles r
      on r.id = ur.role_id
    where p.id = (select auth.uid())
      and r.name = 'admin'
  )
);