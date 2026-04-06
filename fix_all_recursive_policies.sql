-- ============================================
-- FIX: Remove ALL policies that reference profiles table
-- ============================================

-- Drop all problematic policies
DROP POLICY IF EXISTS "workout_plans_upsert_personal" ON workout_plans;
DROP POLICY IF EXISTS "exercises_manage_personal" ON exercises;
DROP POLICY IF EXISTS "personal can manage pending payments" ON pending_payments;
DROP POLICY IF EXISTS "pending_payments_manage_personal" ON pending_payments;
DROP POLICY IF EXISTS "payments_read_all_personal" ON payments;
DROP POLICY IF EXISTS "workout_presence_read_all_personal" ON workout_presence;

-- Recreate with simple policies (NO reference to profiles table)
CREATE POLICY "workout_plans_all" ON workout_plans
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "exercises_all" ON exercises
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "pending_payments_all" ON pending_payments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "payments_select_all" ON payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "workout_presence_select_all" ON workout_presence
  FOR SELECT TO authenticated USING (true);

-- Verify - should show ZERO policies referencing profiles
SELECT tablename, policyname 
FROM pg_policies 
WHERE (qual LIKE '%profiles%' OR with_check::text LIKE '%profiles%') 
AND schemaname = 'public';
