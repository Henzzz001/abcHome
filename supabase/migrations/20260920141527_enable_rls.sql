alter table public.schools enable row level security;

alter table public.profiles enable row level security;

alter table public.roles enable row level security;

alter table public.user_roles enable row level security;


create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
);


create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
)
with check (
  id = (select auth.uid())
);


create policy "Authenticated users can read roles"
on public.roles
for select
to authenticated
using (true);


create policy "Users can read their own roles"
on public.user_roles
for select
to authenticated
using (
  user_id = (select auth.uid())
);


create policy "Users can read their own school"
on public.schools
for select
to authenticated
using (
  id = (
    select school_id
    from public.profiles
    where id = (select auth.uid())
  )
);