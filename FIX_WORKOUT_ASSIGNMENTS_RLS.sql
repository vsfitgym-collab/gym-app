-- Script para corrigir políticas RLS de workout_assignments
-- Execute este arquivo no Supabase SQL Editor

-- 1. Habilita RLS na tabela
ALTER TABLE public.workout_assignments ENABLE ROW LEVEL SECURITY;

-- 2. Remove políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Users can view own assignments" ON public.workout_assignments;
DROP POLICY IF EXISTS "Trainers can view all assignments" ON public.workout_assignments;
DROP POLICY IF EXISTS "Trainers can manage assignments" ON public.workout_assignments;
DROP POLICY IF EXISTS "Trainers can insert assignments" ON public.workout_assignments;

-- 3. Cria novas políticas

-- Política: Alunos podem VER seus próprios treinos atribuídos
CREATE POLICY "Users can view own assignments"
ON public.workout_assignments
FOR SELECT
USING (user_id = auth.uid());

-- Política: Trainers podem VER todas as atribuições que fizeram
CREATE POLICY "Trainers can view all assignments"
ON public.workout_assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'trainer'
  )
);

-- Política: Trainers podem CRIAR atribuições
CREATE POLICY "Trainers can insert assignments"
ON public.workout_assignments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'trainer'
  )
);

-- Política: Trainers podem ATUALIZAR atribuições (mudar status)
CREATE POLICY "Trainers can update assignments"
ON public.workout_assignments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'trainer'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'trainer'
  )
);

-- Alunos podem ATUALIZAR o status (marcar como completado)
CREATE POLICY "Users can update own assignment status"
ON public.workout_assignments
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. Verifica se a tabela workouts também tem RLS correto
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can manage own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Anyone can view assigned workouts" ON public.workouts;

-- Trainers podem VER e GERENCIAR seus próprios treinos
CREATE POLICY "Trainers can manage own workouts"
ON public.workouts
FOR ALL
USING (
  trainer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'trainer'
  )
);

-- Alunos podem VER treinos que foram atribuídos a eles
CREATE POLICY "Users can view assigned workouts"
ON public.workouts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workout_assignments
    WHERE workout_assignments.workout_id = workouts.id 
      AND workout_assignments.user_id = auth.uid()
  )
);

-- 5. Verifica workout_exercises também
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view workout exercises" ON public.workout_exercises;

CREATE POLICY "Users can view workout exercises"
ON public.workout_exercises
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workouts w
    JOIN public.workout_assignments wa ON wa.workout_id = w.id
    WHERE w.id = workout_id AND wa.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.workouts w
    JOIN public.profiles p ON p.id = w.trainer_id
    WHERE w.id = workout_id AND p.id = auth.uid() AND p.role = 'trainer'
  )
);

-- 6. Verifica as políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('workout_assignments', 'workouts', 'workout_exercises')
ORDER BY tablename, policyname;
