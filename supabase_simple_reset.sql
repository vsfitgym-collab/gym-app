-- ============================================
-- SIMPLE DROP ALL POLICIES
-- ============================================

-- Drop all policies individually with quoted names
DROP POLICY IF EXISTS "Allow all read on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow insert on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow update on profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles readable" ON profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Personal trainers can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Personal can update any profile" ON profiles;

DROP POLICY IF EXISTS "Allow all read on workouts" ON workouts;
DROP POLICY IF EXISTS "Allow insert on workouts" ON workouts;
DROP POLICY IF EXISTS "Allow update on workouts" ON workouts;
DROP POLICY IF EXISTS "Allow delete on workouts" ON workouts;
DROP POLICY IF EXISTS "Anyone reads workouts" ON workouts;
DROP POLICY IF EXISTS "Users read own workouts" ON workouts;

DROP POLICY IF EXISTS "Allow all read on workout_plans" ON workout_plans;
DROP POLICY IF EXISTS "Allow insert on workout_plans" ON workout_plans;
DROP POLICY IF EXISTS "Allow update on workout_plans" ON workout_plans;
DROP POLICY IF EXISTS "Allow delete on workout_plans" ON workout_plans;
DROP POLICY IF EXISTS "Anyone reads workout plans" ON workout_plans;
DROP POLICY IF EXISTS "Users read workout plans" ON workout_plans;

DROP POLICY IF EXISTS "Allow all read on messages" ON messages;
DROP POLICY IF EXISTS "Allow insert on messages" ON messages;
DROP POLICY IF EXISTS "Anyone reads messages" ON messages;
DROP POLICY IF EXISTS "Users read own messages" ON messages;

DROP POLICY IF EXISTS "Allow all read on exercises" ON exercises;
DROP POLICY IF EXISTS "Allow insert on exercises" ON exercises;
DROP POLICY IF EXISTS "Allow update on exercises" ON exercises;
DROP POLICY IF EXISTS "Anyone reads exercises" ON exercises;
DROP POLICY IF EXISTS "Anyone can read exercises" ON exercises;

-- Create fresh open policies
CREATE POLICY "open_profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "open_profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "open_profiles_update" ON profiles FOR UPDATE USING (true);

CREATE POLICY "open_workouts_select" ON workouts FOR SELECT USING (true);
CREATE POLICY "open_workouts_insert" ON workouts FOR INSERT WITH CHECK (true);
CREATE POLICY "open_workouts_update" ON workouts FOR UPDATE USING (true);
CREATE POLICY "open_workouts_delete" ON workouts FOR DELETE USING (true);

CREATE POLICY "open_workout_plans_select" ON workout_plans FOR SELECT USING (true);
CREATE POLICY "open_workout_plans_insert" ON workout_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "open_workout_plans_update" ON workout_plans FOR UPDATE USING (true);

CREATE POLICY "open_messages_select" ON messages FOR SELECT USING (true);
CREATE POLICY "open_messages_insert" ON messages FOR INSERT WITH CHECK (true);

CREATE POLICY "open_exercises_select" ON exercises FOR SELECT USING (true);
CREATE POLICY "open_exercises_insert" ON exercises FOR INSERT WITH CHECK (true);
CREATE POLICY "open_exercises_update" ON exercises FOR UPDATE USING (true);

SELECT 'Done!' as status;
