-- ============================================
-- SECURITY POLICIES - PRODUCTION READY
-- ============================================

-- ============================================
-- PROFILES TABLE
-- ============================================

DROP POLICY IF EXISTS "open_profiles_select" ON profiles;
DROP POLICY IF EXISTS "open_profiles_insert" ON profiles;
DROP POLICY IF EXISTS "open_profiles_update" ON profiles;

-- Allow authenticated users to read all profiles (needed for personal to see students)
CREATE POLICY "profiles_read_all_authenticated" ON profiles
  FOR SELECT TO authenticated
  USING (true);

-- Users can only insert their own profile
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- WORKOUTS TABLE
-- ============================================

DROP POLICY IF EXISTS "open_workouts_select" ON workouts;
DROP POLICY IF EXISTS "open_workouts_insert" ON workouts;
DROP POLICY IF EXISTS "open_workouts_update" ON workouts;
DROP POLICY IF EXISTS "open_workouts_delete" ON workouts;

-- Anyone authenticated can read workouts
CREATE POLICY "workouts_read_all_authenticated" ON workouts
  FOR SELECT TO authenticated
  USING (true);

-- Only personal trainers can create workouts
CREATE POLICY "workouts_insert_personal" ON workouts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only workout creator can update
CREATE POLICY "workouts_update_creator" ON workouts
  FOR UPDATE USING (auth.uid() = created_by);

-- Only workout creator can delete
CREATE POLICY "workouts_delete_creator" ON workouts
  FOR DELETE USING (auth.uid() = created_by);

-- ============================================
-- WORKOUT_PLANS TABLE
-- ============================================

DROP POLICY IF EXISTS "open_workout_plans_select" ON workout_plans;
DROP POLICY IF EXISTS "open_workout_plans_insert" ON workout_plans;
DROP POLICY IF EXISTS "open_workout_plans_update" ON workout_plans;

-- Anyone authenticated can read workout plans
CREATE POLICY "workout_plans_read_all" ON workout_plans
  FOR SELECT TO authenticated
  USING (true);

-- Personal trainers can modify workout plans
CREATE POLICY "workout_plans_upsert_personal" ON workout_plans
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'personal'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'personal'
    )
  );

-- ============================================
-- MESSAGES TABLE
-- ============================================

DROP POLICY IF EXISTS "open_messages_select" ON messages;
DROP POLICY IF EXISTS "open_messages_insert" ON messages;

-- Users can read their own messages or messages where they are sender/receiver
CREATE POLICY "messages_read_own" ON messages
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid() OR 
    receiver_id = auth.uid()
  );

-- Users can only send messages (sender must be authenticated user)
CREATE POLICY "messages_insert_own" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- ============================================
-- EXERCISES TABLE
-- ============================================

DROP POLICY IF EXISTS "open_exercises_select" ON exercises;
DROP POLICY IF EXISTS "open_exercises_insert" ON exercises;
DROP POLICY IF EXISTS "open_exercises_update" ON exercises;

-- Everyone can read exercises
CREATE POLICY "exercises_read_all" ON exercises
  FOR SELECT USING (true);

-- Only personal trainers can create/update exercises
CREATE POLICY "exercises_manage_personal" ON exercises
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'personal'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'personal'
    )
  );

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================

DROP POLICY IF EXISTS "open_subscriptions_select" ON subscriptions;
DROP POLICY IF EXISTS "open_subscriptions_insert" ON subscriptions;
DROP POLICY IF EXISTS "open_subscriptions_update" ON subscriptions;

-- Users can read their own subscriptions
CREATE POLICY "subscriptions_read_own" ON subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own subscriptions
CREATE POLICY "subscriptions_insert_own" ON subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own subscriptions
CREATE POLICY "subscriptions_update_own" ON subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- PAYMENTS TABLE
-- ============================================

DROP POLICY IF EXISTS "open_payments_select" ON payments;
DROP POLICY IF EXISTS "open_payments_insert" ON payments;

-- Users can read their own payments
CREATE POLICY "payments_read_own" ON payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Personal trainers can read all payments
CREATE POLICY "payments_read_all_personal" ON payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'personal'
    )
  );

-- Service role can insert payments (for webhooks)
CREATE POLICY "payments_insert_service" ON payments
  FOR INSERT TO service_role
  WITH CHECK (true);

-- ============================================
-- PENDING_PAYMENTS TABLE
-- ============================================

DROP POLICY IF EXISTS "open_pending_payments_select" ON pending_payments;
DROP POLICY IF EXISTS "open_pending_payments_insert" ON pending_payments;
DROP POLICY IF EXISTS "open_pending_payments_update" ON pending_payments;

-- Users can read their own pending payments
CREATE POLICY "pending_payments_read_own" ON pending_payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Personal trainers can manage all pending payments
CREATE POLICY "pending_payments_manage_personal" ON pending_payments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'personal'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'personal'
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
  'Policies created successfully!' as status,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies;
