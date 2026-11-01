create or replace function public.create_my_profile(
  p_first_name text,
  p_last_name text,
  p_middle_name text default null,
  p_phone text default null
)
returns public.profiles
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (
    id,
    first_name,
    middle_name,
    last_name,
    phone
  )
  values (
    auth.uid(),
    p_first_name,
    p_middle_name,
    p_last_name,
    p_phone
  )
  returning * into new_profile;

  return new_profile;
end;
$$;

revoke execute on function public.create_my_profile(text, text, text, text)
from public;

grant execute on function public.create_my_profile(text, text, text, text)
to authenticated;