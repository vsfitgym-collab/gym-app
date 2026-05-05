-- =============================================
-- MIGRAÇÃO: Treinos Padrão Automáticos
-- =============================================

-- 1. Adicionar coluna is_default na workouts
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- 2. Criar 3 treinos padrão se não existirem (verifica por título)
INSERT INTO workouts (id, trainer_id, title, description, duration_minutes, difficulty, is_default)
SELECT gen_random_uuid(), 'system', 'Treino A - Superior', 'Treino de membros superiores para iniciantes', 45, 'iniciante', true
WHERE NOT EXISTS (SELECT 1 FROM workouts WHERE title = 'Treino A - Superior' AND is_default = true);

INSERT INTO workouts (id, trainer_id, title, description, duration_minutes, difficulty, is_default)
SELECT gen_random_uuid(), 'system', 'Treino B - Inferior', 'Treino de membros inferiores para iniciantes', 45, 'iniciante', true
WHERE NOT EXISTS (SELECT 1 FROM workouts WHERE title = 'Treino B - Inferior' AND is_default = true);

INSERT INTO workouts (id, trainer_id, title, description, duration_minutes, difficulty, is_default)
SELECT gen_random_uuid(), 'system', 'Treino C - Full Body', 'Treino completo para iniciantes', 50, 'iniciante', true
WHERE NOT EXISTS (SELECT 1 FROM workouts WHERE title = 'Treino C - Full Body' AND is_default = true);

-- 3. Criar função para atribuir treinos padrão automaticamente
CREATE OR REPLACE FUNCTION assign_default_workouts()
RETURNS TRIGGER AS $$
DECLARE
    default_workout RECORD;
BEGIN
    -- Verificar se é um novo aluno (role = student)
    IF NEW.role = 'student' THEN
        -- Atribuir os 3 treinos padrão
        FOR default_workout IN SELECT id FROM workouts WHERE is_default = true LOOP
            INSERT INTO workout_assignments (workout_id, user_id, assigned_by, status)
            VALUES (default_workout.id, NEW.id, 'system', 'pending');
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger
DROP TRIGGER IF EXISTS trigger_assign_default_workouts ON profiles;
CREATE TRIGGER trigger_assign_default_workouts
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION assign_default_workouts();

-- 5. Atribuir treinos padrão para alunos existentes (sem treinos)
INSERT INTO workout_assignments (workout_id, user_id, assigned_by, status)
SELECT w.id, p.id, 'system', 'pending'
FROM workouts w
CROSS JOIN profiles p
WHERE w.is_default = true
AND p.role = 'student'
AND NOT EXISTS (
    SELECT 1 FROM workout_assignments wa 
    WHERE wa.user_id = p.id AND wa.workout_id = w.id
);