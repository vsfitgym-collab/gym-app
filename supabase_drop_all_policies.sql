-- ============================================
-- DROP ALL RLS POLICIES - TESTE
-- ============================================

-- Disable RLS on all tables temporarily
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workout_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pending_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workout_presence DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_achievements DISABLE ROW LEVEL SECURITY;

-- Delete all policies
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow all read on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow update on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Personal trainers can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Personal can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Public readable" ON public.profiles;

DROP POLICY IF EXISTS "Anyone reads workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users read own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Allow all read on workouts" ON public.workouts;
DROP POLICY IF EXISTS "Allow insert on workouts" ON public.workouts;
DROP POLICY IF EXISTS "Allow update on workouts" ON public.workouts;
DROP POLICY IF EXISTS "Allow delete on workouts" ON public.workouts;

DROP POLICY IF EXISTS "Anyone reads workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users read workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Allow all read on workout_plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Allow insert on workout_plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Allow update on workout_plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Allow delete on workout_plans" ON public.workout_plans;

DROP POLICY IF EXISTS "Anyone reads messages" ON public.messages;
DROP POLICY IF EXISTS "Users read own messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all read on messages" ON public.messages;
DROP POLICY IF EXISTS "Allow insert on messages" ON public.messages;

DROP POLICY IF EXISTS "Anyone reads exercises" ON public.exercises;
DROP POLICY IF EXISTS "Anyone can read exercises" ON public.exercises;
DROP POLICY IF EXISTS "Allow all read on exercises" ON public.exercises;
DROP POLICY IF EXISTS "Allow insert on exercises" ON public.exercises;
DROP POLICY IF EXISTS "Allow update on exercises" ON public.exercises;
DROP POLICY IF EXISTS "Personal manages exercises" ON public.exercises;

DROP POLICY IF EXISTS "Allow all read on subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow insert on subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow update on subscriptions" ON public.subscriptions;

DROP POLICY IF EXISTS "Allow all read on payments" ON public.payments;
DROP POLICY IF EXISTS "Allow insert on payments" ON public.payments;
DROP POLICY IF EXISTS "Users read own payments" ON public.payments;
DROP POLICY IF EXISTS "Personal reads all payments" ON public.payments;
DROP POLICY IF EXISTS "Service role manages payments" ON public.payments;

DROP POLICY IF EXISTS "Allow all read on pending_payments" ON public.pending_payments;
DROP POLICY IF EXISTS "Allow insert on pending_payments" ON public.pending_payments;
DROP POLICY IF EXISTS "Allow update on pending_payments" ON public.pending_payments;
DROP POLICY IF EXISTS "Users read own pending payments" ON public.pending_payments;
DROP POLICY IF EXISTS "Personal manages pending payments" ON public.pending_payments;

DROP POLICY IF EXISTS "Allow all read on workout_presence" ON public.workout_presence;
DROP POLICY IF EXISTS "Allow insert on workout_presence" ON public.workout_presence;
DROP POLICY IF EXISTS "Users read own presence" ON public.workout_presence;
DROP POLICY IF EXISTS "Personal reads all presence" ON public.workout_presence;
DROP POLICY IF EXISTS "Users insert own presence" ON public.workout_presence;

DROP POLICY IF EXISTS "Allow all read on user_achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Allow insert on user_achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users read own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users insert own achievements" ON public.user_achievements;

-- Enable RLS with open policies for testing
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create open policies (for testing only - allows all operations)
CREATE POLICY "open_profiles_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "open_profiles_insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "open_profiles_update" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "open_workouts_read" ON public.workouts FOR SELECT USING (true);
CREATE POLICY "open_workouts_insert" ON public.workouts FOR INSERT WITH CHECK (true);
CREATE POLICY "open_workouts_update" ON public.workouts FOR UPDATE USING (true);
CREATE POLICY "open_workouts_delete" ON public.workouts FOR DELETE USING (true);

CREATE POLICY "open_workout_plans_read" ON public.workout_plans FOR SELECT USING (true);
CREATE POLICY "open_workout_plans_insert" ON public.workout_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "open_workout_plans_update" ON public.workout_plans FOR UPDATE USING (true);
CREATE POLICY "open_workout_plans_delete" ON public.workout_plans FOR DELETE USING (true);

CREATE POLICY "open_messages_read" ON public.messages FOR SELECT USING (true);
CREATE POLICY "open_messages_insert" ON public.messages FOR INSERT WITH CHECK (true);

CREATE POLICY "open_exercises_read" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "open_exercises_insert" ON public.exercises FOR INSERT WITH CHECK (true);
CREATE POLICY "open_exercises_update" ON public.exercises FOR UPDATE USING (true);

CREATE POLICY "open_subscriptions_read" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "open_subscriptions_insert" ON public.subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "open_subscriptions_update" ON public.subscriptions FOR UPDATE USING (true);

CREATE POLICY "open_payments_read" ON public.payments FOR SELECT USING (true);
CREATE POLICY "open_payments_insert" ON public.payments FOR INSERT WITH CHECK (true);

CREATE POLICY "open_pending_payments_read" ON public.pending_payments FOR SELECT USING (true);
CREATE POLICY "open_pending_payments_insert" ON public.pending_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "open_pending_payments_update" ON public.pending_payments FOR UPDATE USING (true);

CREATE POLICY "open_workout_presence_read" ON public.workout_presence FOR SELECT USING (true);
CREATE POLICY "open_workout_presence_insert" ON public.workout_presence FOR INSERT WITH CHECK (true);

CREATE POLICY "open_user_achievements_read" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "open_user_achievements_insert" ON public.user_achievements FOR INSERT WITH CHECK (true);

SELECT 'RLS desabilitado e políticas abertas para teste!' as status;
