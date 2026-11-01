create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    first_name,
    middle_name,
    last_name,
    phone
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    new.raw_user_meta_data ->> 'middle_name',
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.raw_user_meta_data ->> 'phone'
  );

  return new;
end;
$$;

revoke execute on function public.handle_new_user()
from public;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();