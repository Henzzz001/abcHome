-- Step 1: Create SECURITY DEFINER helper to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
  );
$$;

-- Step 2: Create SECURITY DEFINER helper to fetch current user's school_id
CREATE OR REPLACE FUNCTION public.get_current_user_school_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id
  FROM public.profiles
  WHERE id = auth.uid();
$$;

-- Revoke execution from public, grant to authenticated users only
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_current_user_school_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_user_school_id() TO authenticated;

-- Step 3: Enable RLS on students table (ensuring it is enabled)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing admin student policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Admins can view students in their school" ON public.students;
DROP POLICY IF EXISTS "Admins can insert students in their school" ON public.students;
DROP POLICY IF EXISTS "Admins can update students in their school" ON public.students;
DROP POLICY IF EXISTS "Admins can delete students in their school" ON public.students;

-- Step 5: Admin SELECT policy for students within the same school
CREATE POLICY "Admins can view students in their school"
ON public.students
FOR SELECT
TO authenticated
USING (
  public.is_admin() AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = students.profile_id
      AND p.school_id = public.get_current_user_school_id()
  )
);

-- Step 6: Admin ALL policy for managing students (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage students in their school"
ON public.students
FOR ALL
TO authenticated
USING (
  public.is_admin() AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = students.profile_id
      AND p.school_id = public.get_current_user_school_id()
  )
)
WITH CHECK (
  public.is_admin() AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = students.profile_id
      AND p.school_id = public.get_current_user_school_id()
  )
);