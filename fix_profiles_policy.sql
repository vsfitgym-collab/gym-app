-- ============================================
-- CONSOLIDATED PROFILES POLICY
-- ============================================

-- First, drop any existing conflicting policies
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own plan" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;

-- ============================================
-- BASIC POLICIES (from profiles_policy.sql)
-- ============================================

-- Anyone can read public profile info (for displaying user names, etc.)
CREATE POLICY "Public profiles readable" ON profiles
  FOR SELECT USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- PLAN-SPECIFIC POLICIES
-- ============================================

-- Personal trainers can read ALL profiles (to manage students)
CREATE POLICY "Personal trainers can read all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'personal'
    )
  );

-- Personal trainers can update any profile
CREATE POLICY "Personal can update any profile" ON profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'personal'
    )
  );

-- Service role can do anything (for Edge Functions/webhooks)
CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
