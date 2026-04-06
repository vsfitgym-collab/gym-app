-- ============================================
-- FIX: INFINITE RECURSION ON PROFILES POLICY
-- ============================================
-- O problema: políticas que fazem SELECT na tabela profiles
-- dentro de EXISTS causam recursão infinita

-- Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Public profiles readable" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Personal trainers can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Personal can update any profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_read_all_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "open_profiles_select" ON profiles;
DROP POLICY IF EXISTS "open_profiles_insert" ON profiles;
DROP POLICY IF EXISTS "open_profiles_update" ON profiles;
DROP POLICY IF EXISTS "open_profiles_read" ON profiles;
DROP POLICY IF EXISTS "Allow all read on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow insert on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow update on profiles" ON profiles;

-- ============================================
-- SOLUTION: Use simple policies without self-reference
-- ============================================

-- POLICY 1: Anyone can read profiles (no recursion)
CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT USING (true);

-- POLICY 2: Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- POLICY 3: Users can update their own profile OR if they are personal trainer
-- Usa uma função segura que não causa recursão
CREATE OR REPLACE FUNCTION is_personal_trainer(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'personal'
  );
$$;

-- POLICY 4: Update - own profile or personal trainer
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (
    auth.uid() = id 
    OR is_personal_trainer(auth.uid())
  );

-- POLICY 5: Delete - only personal trainer
CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE USING (
    is_personal_trainer(auth.uid())
  );
