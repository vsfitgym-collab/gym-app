-- ============================================
-- LIMPEZA TOTAL COM CASCADE
-- ============================================

-- Dropar todas as políticas primeiro
DROP POLICY IF EXISTS "Public can read workouts" ON workouts;
DROP POLICY IF EXISTS "Public can read exercises" ON exercises;
DROP POLICY IF EXISTS "Public can read workout_plans" ON workout_plans;
DROP POLICY IF EXISTS "Public can read workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "Public can read profiles" ON profiles;
DROP POLICY IF EXISTS "Public can read plans" ON plans;
DROP POLICY IF EXISTS "Public can read subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Public can read evolution" ON evolution;
DROP POLICY IF EXISTS "Public can read messages" ON messages;
DROP POLICY IF EXISTS "Public can read gym_plans" ON gym_plans;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Authenticated can insert workouts" ON workouts;
DROP POLICY IF EXISTS "Authenticated can insert exercises" ON exercises;
DROP POLICY IF EXISTS "Authenticated can insert workout_plans" ON workout_plans;
DROP POLICY IF EXISTS "Authenticated can insert workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "Authenticated can insert profiles" ON profiles;

DROP POLICY IF EXISTS "Personals can view student evolution" ON evolution;
DROP POLICY IF EXISTS "Students can view plans from their personal" ON plans;
DROP POLICY IF EXISTS "Personals can manage subscriptions for their students" ON subscriptions;

-- Dropar tabelas com CASCADE
DROP TABLE IF EXISTS workout_logs CASCADE;
DROP TABLE IF EXISTS workout_plans CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS gym_plans CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS evolution CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- CRIAÇÃO DE TABELAS
-- ============================================

-- 1. PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT CHECK (role IN ('aluno', 'personal')) DEFAULT 'aluno',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WORKOUTS
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EXERCISES
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WORKOUT_PLANS
CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  sets INTEGER DEFAULT 3,
  reps TEXT,
  rest_seconds INTEGER DEFAULT 60,
  order_index INTEGER DEFAULT 0
);

-- 5. WORKOUT_LOGS
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  workout_id UUID REFERENCES workouts(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 6. MESSAGES
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POLÍTICAS RLS
-- ============================================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- WORKOUTS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read workouts" ON workouts FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert workouts" ON workouts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- EXERCISES
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read exercises" ON exercises FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert exercises" ON exercises FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- WORKOUT_PLANS
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read workout_plans" ON workout_plans FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert workout_plans" ON workout_plans FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- WORKOUT_LOGS
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read workout_logs" ON workout_logs FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert workout_logs" ON workout_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- MESSAGES
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Users can read own messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Authenticated can insert messages" ON messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

SELECT 'Banco.resetado!' AS status;