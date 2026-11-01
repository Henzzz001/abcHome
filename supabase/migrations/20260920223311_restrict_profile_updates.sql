drop policy if exists "Users can update their own profile"
on public.profiles;

drop policy if exists "Users can update their personal profile"
on public.profiles;

create policy "Users can update their personal profile"
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
)
with check (
  id = (select auth.uid())
);

revoke update on public.profiles
from authenticated;

grant update (
  first_name,
  middle_name,
  last_name,
  phone,
  avatar_path
)
on public.profiles
to authenticated;