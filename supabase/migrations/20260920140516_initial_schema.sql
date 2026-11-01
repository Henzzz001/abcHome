create table public.schools (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  code text unique,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  school_id uuid references public.schools(id) on delete set null,

  first_name text not null,
  middle_name text,
  last_name text not null,

  phone text,
  avatar_path text,

  status text not null default 'active',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_status_check
    check (status in ('active', 'inactive', 'archived'))
);


create table public.roles (
  id uuid primary key default gen_random_uuid(),

  name text not null unique,
  description text,

  created_at timestamptz not null default now()
);


create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,

  created_at timestamptz not null default now(),

  primary key (user_id, role_id)
);


insert into public.roles (name, description)
values
  ('admin', 'School administrator'),
  ('teacher', 'Teacher'),
  ('student', 'Student'),
  ('parent', 'Parent or guardian'),
  ('staff', 'School staff member');


create index profiles_school_id_idx
  on public.profiles(school_id);


create index user_roles_role_id_idx
  on public.user_roles(role_id);


create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


create trigger schools_set_updated_at
before update on public.schools
for each row
execute function public.set_updated_at();


create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();