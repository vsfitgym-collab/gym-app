-- Schedule for FREE workouts (maps workout to day of week)
CREATE TABLE IF NOT EXISTS public.free_workout_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  -- 0=DOM, 1=SEG, 2=TER, 3=QUA, 4=QUI, 5=SEX, 6=SAB
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(day_of_week)
);

ALTER TABLE public.free_workout_schedule ENABLE ROW LEVEL SECURITY;

-- Everyone can read the free schedule
CREATE POLICY "free_schedule_select_all" ON public.free_workout_schedule
  FOR SELECT USING (true);

-- Only personal can manage the schedule
CREATE POLICY "free_schedule_insert_personal" ON public.free_workout_schedule
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'personal')
  );

CREATE POLICY "free_schedule_update_personal" ON public.free_workout_schedule
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'personal')
  );

CREATE POLICY "free_schedule_delete_personal" ON public.free_workout_schedule
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'personal')
  );
