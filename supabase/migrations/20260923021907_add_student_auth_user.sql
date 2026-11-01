alter table public.students
add column auth_user_id uuid;

alter table public.students
add constraint students_auth_user_id_fkey
foreign key (auth_user_id)
references auth.users(id)
on delete cascade;

create unique index students_auth_user_id_unique_idx
on public.students(auth_user_id)
where auth_user_id is not null;