-- ============================================================
-- STRIPE EVENTS TABLE (para idempotência)
-- ============================================================

CREATE TABLE IF NOT EXISTS stripe_events (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    customer_id TEXT,
    subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_created ON stripe_events(created_at DESC);

-- ============================================================
-- ADD COLUMNS TO PROFILES (se não existirem)
-- ============================================================

DO $$
BEGIN
    -- stripe_customer_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
    END IF;

    -- stripe_subscription_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN stripe_subscription_id TEXT;
    END IF;

    -- plan (garantir que existe)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'plan'
    ) THEN
        ALTER TABLE profiles ADD COLUMN plan TEXT;
    END IF;

    -- plan_expires_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'plan_expires_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN plan_expires_at TIMESTAMPTZ;
    END IF;

    -- is_trial_active (garantir que existe)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_trial_active'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_trial_active BOOLEAN DEFAULT false;
    END IF;

    -- trial_ends_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'trial_ends_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN trial_ends_at TIMESTAMPTZ;
    END IF;
END;
$$;

-- ============================================================
-- USER RELATIONSHIPS TABLE (Personal-Aluno)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_id UUID NOT NULL,
    student_id UUID NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ,
    UNIQUE(personal_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_ur_personal ON user_relationships(personal_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_ur_student ON user_relationships(student_id) WHERE status = 'active';

-- Habilitar RLS
ALTER TABLE user_relationships ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "ur_select" ON user_relationships;
CREATE POLICY "ur_select" ON user_relationships FOR SELECT 
    USING (personal_id = auth.uid() OR student_id = auth.uid());

DROP POLICY IF EXISTS "ur_insert" ON user_relationships;
CREATE POLICY "ur_insert" ON user_relationships FOR INSERT 
    WITH CHECK (personal_id = auth.uid());

DROP POLICY IF EXISTS "ur_update" ON user_relationships;
CREATE POLICY "ur_update" ON user_relationships FOR UPDATE 
    USING (personal_id = auth.uid());

-- ============================================================
-- SUBSCRIPTIONS TABLE (histórico)
-- ============================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plan TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'canceled', 'expired', 'trialing')),
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    external_subscription_id TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subs_select" ON subscriptions;
CREATE POLICY "subs_select" ON subscriptions FOR SELECT 
    USING (user_id = auth.uid());

-- ============================================================
-- FUNÇÃO: GET PERSONAL STUDENTS
-- ============================================================

CREATE OR REPLACE FUNCTION get_personal_students(p_personal_id UUID)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    student_email TEXT,
    plan TEXT,
    plan_expires_at TIMESTAMPTZ,
    is_active BOOLEAN,
    status TEXT,
    assigned_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY SELECT 
        ur.student_id,
        p.name AS student_name,
        p.email AS student_email,
        p.plan,
        p.plan_expires_at,
        CASE 
            WHEN p.is_trial_active = true AND p.trial_ends_at > NOW() THEN true
            WHEN p.plan_expires_at IS NOT NULL AND p.plan_expires_at > NOW() THEN true
            ELSE false
        END AS is_active,
        CASE 
            WHEN p.is_trial_active = true AND p.trial_ends_at > NOW() THEN 'trial'
            WHEN p.plan IS NOT NULL AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW()) THEN 'active'
            WHEN p.plan_expires_at IS NOT NULL AND p.plan_expires_at <= NOW() THEN 'expired'
            ELSE 'free'
        END AS status,
        ur.assigned_at
    FROM user_relationships ur
    JOIN profiles p ON p.id = ur.student_id
    WHERE ur.personal_id = p_personal_id
      AND ur.status = 'active'
    ORDER BY ur.assigned_at DESC;
END;
$$;

-- ============================================================
-- FUNÇÃO: SYNC SUBSCRIPTION (FALLBACK)
-- ============================================================

CREATE OR REPLACE FUNCTION sync_user_subscription(p_user_id UUID)
RETURNS TABLE (
    success BOOLEAN,
    plan TEXT,
    status TEXT,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile profiles%ROWTYPE;
    v_stripe_cust_id TEXT;
    v_subscription JSONB;
    v_plan TEXT;
    v_expires TIMESTAMPTZ;
    v_status TEXT;
BEGIN
    -- Get profile
    SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
    
    IF v_profile IS NULL THEN
        RETURN QUERY SELECT false, NULL, 'not_found', NULL;
        RETURN;
    END IF;
    
    v_stripe_cust_id := v_profile.stripe_customer_id;
    
    IF v_stripe_cust_id IS NULL THEN
        RETURN QUERY SELECT false, NULL, 'no_customer', NULL;
        RETURN;
    END IF;
    
    -- Try to get subscription from Stripe via API call
    -- This would be done via RPC in production
    -- For now, just return current state
    
    v_plan := v_profile.plan;
    v_expires := v_profile.plan_expires_at;
    
    -- Determine status
    IF v_profile.is_trial_active = true AND v_profile.trial_ends_at > NOW() THEN
        v_status := 'trial';
    ELSIF v_plan IS NOT NULL AND v_expires IS NOT NULL AND v_expires > NOW() THEN
        v_status := 'active';
    ELSIF v_plan IS NOT NULL AND v_expires IS NOT NULL AND v_expires <= NOW() THEN
        v_status := 'expired';
    ELSE
        v_status := 'free';
    END IF;
    
    RETURN QUERY SELECT true, v_plan, v_status, v_expires;
END;
$$;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

SELECT 
    'Tables check:' AS info;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'user_relationships', 'subscriptions', 'stripe_events')
ORDER BY tablename;