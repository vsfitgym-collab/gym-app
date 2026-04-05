-- ============================================
-- DROP ALL RLS POLICIES - SIMPLIFIED
-- Only tables that actually exist
-- ============================================

-- Drop policies for profiles
DO $$
DECLARE
    polname TEXT;
BEGIN
    FOR polname IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || polname || ' ON profiles';
    END LOOP;
END $$;

-- Drop policies for workouts
DO $$
DECLARE
    polname TEXT;
BEGIN
    FOR polname IN SELECT policyname FROM pg_policies WHERE tablename = 'workouts' LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || polname || ' ON workouts';
    END LOOP;
END $$;

-- Drop policies for workout_plans
DO $$
DECLARE
    polname TEXT;
BEGIN
    FOR polname IN SELECT policyname FROM pg_policies WHERE tablename = 'workout_plans' LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || polname || ' ON workout_plans';
    END LOOP;
END $$;

-- Drop policies for messages
DO $$
DECLARE
    polname TEXT;
BEGIN
    FOR polname IN SELECT policyname FROM pg_policies WHERE tablename = 'messages' LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || polname || ' ON messages';
    END LOOP;
END $$;

-- Drop policies for exercises
DO $$
DECLARE
    polname TEXT;
BEGIN
    FOR polname IN SELECT policyname FROM pg_policies WHERE tablename = 'exercises' LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || polname || ' ON exercises';
    END LOOP;
END $$;

-- Create open policies for profiles
CREATE POLICY "open_profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "open_profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "open_profiles_update" ON profiles FOR UPDATE USING (true);

-- Create open policies for workouts
CREATE POLICY "open_workouts_select" ON workouts FOR SELECT USING (true);
CREATE POLICY "open_workouts_insert" ON workouts FOR INSERT WITH CHECK (true);
CREATE POLICY "open_workouts_update" ON workouts FOR UPDATE USING (true);
CREATE POLICY "open_workouts_delete" ON workouts FOR DELETE USING (true);

-- Create open policies for workout_plans
CREATE POLICY "open_workout_plans_select" ON workout_plans FOR SELECT USING (true);
CREATE POLICY "open_workout_plans_insert" ON workout_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "open_workout_plans_update" ON workout_plans FOR UPDATE USING (true);
CREATE POLICY "open_workout_plans_delete" ON workout_plans FOR DELETE USING (true);

-- Create open policies for messages
CREATE POLICY "open_messages_select" ON messages FOR SELECT USING (true);
CREATE POLICY "open_messages_insert" ON messages FOR INSERT WITH CHECK (true);

-- Create open policies for exercises
CREATE POLICY "open_exercises_select" ON exercises FOR SELECT USING (true);
CREATE POLICY "open_exercises_insert" ON exercises FOR INSERT WITH CHECK (true);
CREATE POLICY "open_exercises_update" ON exercises FOR UPDATE USING (true);

SELECT 'Policies reset successfully!' as status;
