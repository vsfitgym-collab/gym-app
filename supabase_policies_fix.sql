-- ============================================
-- SECURITY POLICIES FIX
-- Permite leitura pública de todos os dados necessários
-- ============================================

-- Tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public readable" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Allow all read on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow insert on profiles" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NOT NULL);
CREATE POLICY "Allow update on profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Tabela workouts
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads workouts" ON public.workouts;

CREATE POLICY "Allow all read on workouts" ON public.workouts FOR SELECT USING (true);
CREATE POLICY "Allow insert on workouts" ON public.workouts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on workouts" ON public.workouts FOR UPDATE USING (true);
CREATE POLICY "Allow delete on workouts" ON public.workouts FOR DELETE USING (true);

-- Tabela workout_plans
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads workout plans" ON public.workout_plans;

CREATE POLICY "Allow all read on workout_plans" ON public.workout_plans FOR SELECT USING (true);
CREATE POLICY "Allow insert on workout_plans" ON public.workout_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on workout_plans" ON public.workout_plans FOR UPDATE USING (true);
CREATE POLICY "Allow delete on workout_plans" ON public.workout_plans FOR DELETE USING (true);

-- Tabela messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads messages" ON public.messages;

CREATE POLICY "Allow all read on messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow insert on messages" ON public.messages FOR INSERT WITH CHECK (true);

-- Tabela exercises
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads exercises" ON public.exercises;

CREATE POLICY "Allow all read on exercises" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Allow insert on exercises" ON public.exercises FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on exercises" ON public.exercises FOR UPDATE USING (true);

-- Tabela subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read on subscriptions" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "Allow insert on subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on subscriptions" ON public.subscriptions FOR UPDATE USING (true);

-- Tabela payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read on payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Allow insert on payments" ON public.payments FOR INSERT WITH CHECK (true);

-- Tabela pending_payments
ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read on pending_payments" ON public.pending_payments FOR SELECT USING (true);
CREATE POLICY "Allow insert on pending_payments" ON public.pending_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on pending_payments" ON public.pending_payments FOR UPDATE USING (true);

-- Tabela workout_presence
ALTER TABLE public.workout_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read on workout_presence" ON public.workout_presence FOR SELECT USING (true);
CREATE POLICY "Allow insert on workout_presence" ON public.workout_presence FOR INSERT WITH CHECK (true);

-- Tabela user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read on user_achievements" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "Allow insert on user_achievements" ON public.user_achievements FOR INSERT WITH CHECK (true);

-- auth.users - garantir que pode ler dados do usuário logado
DROP POLICY IF EXISTS "Allow users to read own auth data" ON auth.users;

CREATE POLICY "Allow authenticated users to read own data" ON auth.users
  FOR SELECT USING (auth.uid() = id);
