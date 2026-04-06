-- ============================================
-- RECREATE SECURE POLICIES (NO RECURSION)
-- ============================================

-- Step 1: Create a SECURITY DEFINER function to check role
-- This function bypasses RLS and won't cause recursion
CREATE OR REPLACE FUNCTION is_personal_trainer(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role = 'personal' FROM profiles WHERE id = user_id;
$$;

-- Step 2: Drop the open policies
DROP POLICY IF EXISTS "workout_plans_all" ON workout_plans;
DROP POLICY IF EXISTS "exercises_all" ON exercises;
DROP POLICY IF EXISTS "pending_payments_all" ON pending_payments;
DROP POLICY IF EXISTS "payments_select_all" ON payments;
DROP POLICY IF EXISTS "workout_presence_select_all" ON workout_presence;

-- Step 3: Recreate with proper role checks using the function
-- WORKOUT PLANS: Personal can manage, everyone can read
CREATE POLICY "workout_plans_read" ON workout_plans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "workout_plans_manage_personal" ON workout_plans
  FOR ALL TO authenticated
  USING (is_personal_trainer(auth.uid()))
  WITH CHECK (is_personal_trainer(auth.uid()));

-- EXERCISES: Personal can manage, everyone can read
CREATE POLICY "exercises_read" ON exercises
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "exercises_manage_personal" ON exercises
  FOR ALL TO authenticated
  USING (is_personal_trainer(auth.uid()))
  WITH CHECK (is_personal_trainer(auth.uid()));

-- PENDING PAYMENTS: Personal can manage, users see own
CREATE POLICY "pending_payments_read_own" ON pending_payments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "pending_payments_manage_personal" ON pending_payments
  FOR ALL TO authenticated
  USING (is_personal_trainer(auth.uid()))
  WITH CHECK (is_personal_trainer(auth.uid()));

-- PAYMENTS: Personal can read all, users see own
CREATE POLICY "payments_read_own" ON payments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "payments_read_personal" ON payments
  FOR SELECT TO authenticated USING (is_personal_trainer(auth.uid()));

-- WORKOUT PRESENCE: Personal can read all
CREATE POLICY "workout_presence_read_own" ON workout_presence
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "workout_presence_read_personal" ON workout_presence
  FOR SELECT TO authenticated USING (is_personal_trainer(auth.uid()));

-- Step 4: Verify policies
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE schemaname = 'public' ORDER BY tablename;
