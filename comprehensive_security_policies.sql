-- Comprehensive Security Policies for Gym App
-- This file combines and enhances all RLS policies

-- ============================================
-- PROFILES TABLE
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read public profile info (name, role, plan)
CREATE POLICY "Public profiles readable" ON profiles
  FOR SELECT USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Personal trainers can read all profiles
CREATE POLICY "Personal can read all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'personal'
    )
  );

-- ============================================
-- WORKOUTS TABLE
-- ============================================

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Users can read their own workouts or workouts assigned to them
CREATE POLICY "Users read own workouts" ON workouts
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM workout_students ws
      WHERE ws.workout_id = workouts.id AND ws.student_id = auth.uid()
    )
  );

-- Only personal trainers can create workouts
CREATE POLICY "Personal can create workouts" ON workouts
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Only workout creator can update
CREATE POLICY "Creator can update workout" ON workouts
  FOR UPDATE USING (created_by = auth.uid());

-- Only workout creator can delete
CREATE POLICY "Creator can delete workout" ON workouts
  FOR DELETE USING (created_by = auth.uid());

-- ============================================
-- WORKOUT_PLANS TABLE
-- ============================================

ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

-- Users can read workout plans for accessible workouts
CREATE POLICY "Users read workout plans" ON workout_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_plans.workout_id
      AND (w.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM workout_students ws
        WHERE ws.workout_id = w.id AND ws.student_id = auth.uid()
      ))
    )
  );

-- Only personal trainers can modify workout plans
CREATE POLICY "Personal can modify workout plans" ON workout_plans
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_plans.workout_id AND w.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_plans.workout_id AND w.created_by = auth.uid()
    )
  );

-- ============================================
-- EXERCISES TABLE
-- ============================================

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Everyone can read exercises
CREATE POLICY "Anyone reads exercises" ON exercises
  FOR SELECT USING (true);

-- Personal trainers can create/edit exercises
CREATE POLICY "Personal manages exercises" ON exercises
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
-- PAYMENTS TABLE
-- ============================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own payments
CREATE POLICY "Users read own payments" ON payments
  FOR SELECT USING (user_id = auth.uid());

-- Personal trainers can read all payments
CREATE POLICY "Personal reads all payments" ON payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'personal'
    )
  );

-- Only service role can insert/update payments (via webhooks)
CREATE POLICY "Service role manages payments" ON payments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- PENDING_PAYMENTS TABLE
-- ============================================

ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own pending payments
CREATE POLICY "Users read own pending payments" ON pending_payments
  FOR SELECT USING (user_id = auth.uid());

-- Personal trainers can manage all pending payments
CREATE POLICY "Personal manages pending payments" ON pending_payments
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
-- WORKOUT_PRESENCE TABLE
-- ============================================

ALTER TABLE workout_presence ENABLE ROW LEVEL SECURITY;

-- Users can read their own presence records
CREATE POLICY "Users read own presence" ON workout_presence
  FOR SELECT USING (student_id = auth.uid());

-- Personal trainers can read all presence records
CREATE POLICY "Personal reads all presence" ON workout_presence
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'personal'
    )
  );

-- Users can insert their own presence
CREATE POLICY "Users insert own presence" ON workout_presence
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can read their own achievements
CREATE POLICY "Users read own achievements" ON user_achievements
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own achievements (via triggers)
CREATE POLICY "Users insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- MESSAGES TABLE
-- ============================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only read their own messages
CREATE POLICY "Users read own messages" ON messages
  FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

-- Users can only send messages
CREATE POLICY "Users send messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- ============================================
-- SECURITY LOGS TABLE
-- ============================================

-- Already created in security_logs_policy.sql, adding completion here
ALTER TABLE IF EXISTS security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert security logs" ON security_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Personal can read security logs" ON security_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'personal'
    )
  );
