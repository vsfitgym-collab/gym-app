-- Add workout_type and assigned_to columns to workouts
ALTER TABLE public.workouts 
  ADD COLUMN IF NOT EXISTS workout_type TEXT NOT NULL DEFAULT 'custom'
    CHECK (workout_type IN ('free', 'custom'));

ALTER TABLE public.workouts 
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- All existing workouts become custom
UPDATE public.workouts SET workout_type = 'custom' WHERE workout_type IS NULL;
