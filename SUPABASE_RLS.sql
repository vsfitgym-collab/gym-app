-- ============================================
-- POLÍTICAS DE ACESSO (RLS) - Execute no Supabase SQL Editor
-- ============================================

-- Habilitar RLS nas tabelas (se não estiver habilitado)
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

-- ============================================
-- WORKOUTS
-- ============================================

-- Todos podem ler workouts
CREATE POLICY "Public can read workouts" ON workouts
  FOR SELECT USING (true);

-- Apenas usuários autenticados podem criar workouts
CREATE POLICY "Authenticated can insert workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Apenas o criador pode atualizar seu workout
CREATE POLICY "Owner can update workouts" ON workouts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Apenas o criador pode deletar
CREATE POLICY "Owner can delete workouts" ON workouts
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- EXERCISES
-- ============================================

CREATE POLICY "Public can read exercises" ON exercises
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert exercises" ON exercises
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owner can update exercises" ON exercises
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owner can delete exercises" ON exercises
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- WORKOUT_PLANS
-- ============================================

CREATE POLICY "Public can read workout_plans" ON workout_plans
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert workout_plans" ON workout_plans
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owner can update workout_plans" ON workout_plans
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owner can delete workout_plans" ON workout_plans
  FOR DELETE USING (auth.uid() IS NOT NULL);