-- =============================================
-- 1. Adicionar coluna is_default se não existir
-- =============================================
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- =============================================
-- 2. Função RPC para criar workouts padrão
-- =============================================
CREATE OR REPLACE FUNCTION create_default_workouts_for_user(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_workout_id UUID;
  v_exercise_ids UUID[];
  v_default_workouts TEXT[] := ARRAY['Treino A - Superior', 'Treino B - Inferior', 'Treino C - Full Body'];
  v_workout_title TEXT;
BEGIN
  -- Verificar se já existem workouts padrão
  IF NOT EXISTS (SELECT 1 FROM workouts WHERE is_default = true) THEN
    -- Criar workouts padrão
    FOREACH v_workout_title IN ARRAY v_default_workouts LOOP
      INSERT INTO workouts (title, description, duration_minutes, difficulty, is_default)
      VALUES (
        v_workout_title,
        CASE 
          WHEN v_workout_title = 'Treino A - Superior' THEN 'Treino de membros superiores para iniciantes'
          WHEN v_workout_title = 'Treino B - Inferior' THEN 'Treino de membros inferiores para iniciantes'
          ELSE 'Treino completo para iniciantes'
        END,
        CASE WHEN v_workout_title = 'Treino C - Full Body' THEN 50 ELSE 45 END,
        'iniciante',
        true
      )
      RETURNING id INTO v_workout_id;

      -- Pegar exercícios do banco
      SELECT array_agg(id) INTO v_exercise_ids FROM exercises LIMIT 6;

      -- Adicionar exercícios ao workout
      IF array_length(v_exercise_ids, 1) > 0 THEN
        FOR i IN 1..array_length(v_exercise_ids, 1) LOOP
          INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, order_index)
          VALUES (v_workout_id, v_exercise_ids[i], 3, 12, 60, i - 1);
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- Atribuir workouts padrão ao usuário se não existirem
  INSERT INTO workout_assignments (workout_id, user_id, status)
  SELECT w.id, p_user_id, 'pending'
  FROM workouts w
  WHERE w.is_default = true
  AND NOT EXISTS (
    SELECT 1 FROM workout_assignments wa 
    WHERE wa.workout_id = w.id 
    AND wa.user_id = p_user_id
    AND wa.status IN ('pending', 'in_progress')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. Políticas RLS para permitir acesso
-- =============================================

-- Permitir que estudantes vejam workouts padrão
DROP POLICY IF EXISTS "Allow students to read default workouts" ON workouts;
CREATE POLICY "Allow students to read default workouts" ON workouts
FOR SELECT USING (is_default = true);

-- Permitir que estudantes vejam workout exercises de workouts padrão
DROP POLICY IF EXISTS "Allow students to read default workout exercises" ON workout_exercises;
CREATE POLICY "Allow students to read default workout exercises" ON workout_exercises
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM workouts 
    WHERE workouts.id = workout_exercises.workout_id 
    AND workouts.is_default = true
  )
);

-- Permitir que estudantes vejam suas atribuições
DROP POLICY IF EXISTS "Allow students to read their workout assignments" ON workout_assignments;
CREATE POLICY "Allow students to read their workout assignments" ON workout_assignments
FOR SELECT USING (user_id = auth.uid());