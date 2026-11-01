-- Remove the old RLS policy that depends on school_id
drop policy if exists "Admins can read students in their school"
on public.students;

-- Remove the old school relationship
alter table public.students
drop constraint if exists students_school_id_fkey;

alter table public.students
drop column if exists school_id;

-- Replace the generic program field
alter table public.students
drop column if exists program;

alter table public.students
add column department text not null default '';

alter table public.students
add column course text not null default '';

-- Student IDs are globally unique now that school_id is removed
alter table public.students
drop constraint if exists students_student_id_unique;

alter table public.students
add constraint students_student_id_unique
unique (student_id);