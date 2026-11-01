-- 1. Create Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Programs Table
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Extend Students Table with Department, Program, and Year Level
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS year_level TEXT;

-- 4. Create Event Attendance Sheets Table
CREATE TABLE IF NOT EXISTS public.attendance_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    access_code VARCHAR(6) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Function & Trigger to Auto-Generate Unique 6-Digit Code
CREATE OR REPLACE FUNCTION generate_attendance_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code VARCHAR(6);
    done BOOLEAN := FALSE;
BEGIN
    WHILE NOT done LOOP
        new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        IF NOT EXISTS (SELECT 1 FROM public.attendance_sheets WHERE access_code = new_code AND is_active = TRUE) THEN
            done := TRUE;
        END IF;
    END LOOP;
    NEW.access_code := new_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_generate_attendance_code
BEFORE INSERT ON public.attendance_sheets
FOR EACH ROW
WHEN (NEW.access_code IS NULL OR NEW.access_code = '')
EXECUTE FUNCTION generate_attendance_code();

-- 6. Create Event Attendance Logs Table
CREATE TABLE IF NOT EXISTS public.event_attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sheet_id UUID NOT NULL REFERENCES public.attendance_sheets(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    scanned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sheet_id, student_id)
);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance_logs ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies
CREATE POLICY "Allow authenticated full access departments" ON public.departments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access programs" ON public.programs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access sheets" ON public.attendance_sheets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access logs" ON public.event_attendance_logs FOR ALL USING (auth.role() = 'authenticated');