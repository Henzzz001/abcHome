create table public.students (
  id uuid primary key default gen_random_uuid(),

  profile_id uuid not null unique
    references public.profiles(id)
    on delete cascade,

  school_id uuid not null
    references public.schools(id)
    on delete restrict,

  student_id text not null,

  program text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint students_student_id_unique
    unique (school_id, student_id)
);

create index students_school_id_idx
  on public.students(school_id);

create index students_profile_id_idx
  on public.students(profile_id);

create trigger students_set_updated_at
before update on public.students
for each row
execute function public.set_updated_at();