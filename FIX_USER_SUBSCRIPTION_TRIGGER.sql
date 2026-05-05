-- =====================================================
-- FIX: handle_new_user_subscription() - Usando plan_id (UUID)
-- =====================================================
DO $$
BEGIN
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN OTHERS THEN NULL;
END $$;

-- =====================================================
-- UPDATE trigger function - USA plan_id (UUID)
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_uuid UUID;
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'student'));
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    INSERT INTO public.user_profiles_extended (user_id, onboarding_completed)
    VALUES (NEW.id, false);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- Get trial plan UUID
  BEGIN
    SELECT id INTO v_plan_uuid FROM plans WHERE is_trial = true LIMIT 1;
  EXCEPTION WHEN OTHERS THEN v_plan_uuid := NULL;
  END;

  -- Create subscription using plan_id (UUID)
  BEGIN
    IF v_plan_uuid IS NOT NULL THEN
      INSERT INTO public.subscriptions (user_id, plan_id, status, start_date, end_date)
      VALUES (NEW.id, v_plan_uuid, 'active', NOW(), NOW() + INTERVAL '7 days');
    ELSE
      -- Fallback: try plan column
      INSERT INTO public.subscriptions (user_id, plan, status, start_date, end_date)
      VALUES (NEW.id, 'trial', 'active', NOW(), NOW() + INTERVAL '7 days');
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS policies
-- =====================================================
DROP POLICY IF EXISTS "allow_insert_subscription" ON subscriptions;
CREATE POLICY "allow_insert_subscription" ON subscriptions FOR INSERT WITH CHECK (true);

GRANT INSERT ON subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- =====================================================
-- BACKFILL existing users
-- =====================================================
DO $$
DECLARE
  v_plan_uuid UUID;
BEGIN
  SELECT id INTO v_plan_uuid FROM plans WHERE is_trial = true LIMIT 1;
  
  IF v_plan_uuid IS NOT NULL THEN
    INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date)
    SELECT p.id, v_plan_uuid, 'active', NOW(), NOW() + INTERVAL '7 days'
    FROM profiles p
    WHERE NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = p.id)
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO subscriptions (user_id, plan, status, start_date, end_date)
    SELECT p.id, 'trial', 'active', NOW(), NOW() + INTERVAL '7 days'
    FROM profiles p
    WHERE NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = p.id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;