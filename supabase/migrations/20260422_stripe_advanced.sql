-- ============================================================
-- ADVANCED STRIPE TABLE UPDATES
-- ============================================================

DO $$
BEGIN
    -- last_stripe_event_ts for event ordering
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'last_stripe_event_ts'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_stripe_event_ts BIGINT DEFAULT 0;
    END IF;

    -- subscription_status tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE profiles ADD COLUMN subscription_status TEXT 
            CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing'));
    END IF;

    -- grace_period_until for past_due
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'grace_period_until'
    ) THEN
        ALTER TABLE profiles ADD COLUMN grace_period_until TIMESTAMPTZ;
    END IF;
END;
$$;

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_relationships_personal ON user_relationships(personal_id);
CREATE INDEX IF NOT EXISTS idx_relationships_student ON user_relationships(student_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_events(type);

-- ============================================================
-- USER EVENTS TABLE (for retention tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_events_user ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created ON user_events(created_at DESC);

ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ue_select" ON user_events;
CREATE POLICY "ue_select" ON user_events FOR SELECT 
    USING (user_id = auth.uid());

-- ============================================================
-- TRACKING FUNCTIONS
-- ============================================================

-- Log user event
CREATE OR REPLACE FUNCTION log_user_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO user_events (user_id, event_type, metadata)
    VALUES (p_user_id, p_event_type, p_metadata);
END;
$$;

-- Get user event count by type
CREATE OR REPLACE FUNCTION get_user_event_count(
    p_user_id UUID,
    p_event_type TEXT,
    p_days INTEGER DEFAULT 30
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INT
        FROM user_events
        WHERE user_id = p_user_id
          AND event_type = p_event_type
          AND created_at > NOW() - (p_days || ' days')::INTERVAL
    );
END;
$$;

-- Get conversion funnel
CREATE OR REPLACE FUNCTION get_conversion_funnel(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    metric TEXT,
    count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 'total_users'::TEXT, COUNT(*)::INT FROM profiles WHERE created_at > NOW() - (p_days || ' days')::INTERVAL
    UNION ALL
    SELECT 'trial_started'::TEXT, COUNT(*)::INT FROM user_events WHERE event_type = 'trial_started' AND created_at > NOW() - (p_days || ' days')::INTERVAL
    UNION ALL
    SELECT 'trial_expired'::TEXT, COUNT(*)::INT FROM user_events WHERE event_type = 'trial_expired' AND created_at > NOW() - (p_days || ' days')::INTERVAL
    UNION ALL
    SELECT 'payment_success'::TEXT, COUNT(*)::INT FROM user_events WHERE event_type = 'payment_success' AND created_at > NOW() - (p_days || ' days')::INTERVAL
    UNION ALL
    SELECT 'subscription_canceled'::TEXT, COUNT(*)::INT FROM user_events WHERE event_type = 'subscription_canceled' AND created_at > NOW() - (p_days || ' days')::INTERVAL
    UNION ALL
    SELECT 'active_subscribers'::TEXT, COUNT(*)::INT FROM profiles WHERE (plan IS NOT NULL AND plan != 'free') AND (plan_expires_at IS NULL OR plan_expires_at > NOW());
END;
$$;

-- ============================================================
-- METRICS FOR DASHBOARD
-- ============================================================

CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS TABLE (
    total_users INT,
    trial_users INT,
    active_subscribers INT,
    canceled_count INT,
    conversion_rate DECIMAL,
    mrr DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total INT;
    v_trial INT;
    v_active INT;
    v_canceled INT;
    v_mrr DECIMAL := 0;
    v_conversion DECIMAL;
BEGIN
    -- Total users
    SELECT COUNT(*) INTO v_total FROM profiles;

    -- Trial users
    SELECT COUNT(*) INTO v_trial 
    FROM profiles 
    WHERE is_trial_active = true 
      AND trial_ends_at > NOW();

    -- Active subscribers
    SELECT COUNT(*) INTO v_active
    FROM profiles 
    WHERE plan IS NOT NULL 
      AND plan != 'free' 
      AND (plan_expires_at IS NULL OR plan_expires_at > NOW());

    -- Canceled (last 30 days)
    SELECT COUNT(*) INTO v_canceled
    FROM user_events 
    WHERE event_type = 'subscription_canceled'
      AND created_at > NOW() - '30 days'::INTERVAL;

    -- Calculate MRR
    v_mrr := (
        (SELECT COALESCE(COUNT(*), 0) FROM profiles WHERE plan = 'basic') * 29.9 +
        (SELECT COALESCE(COUNT(*), 0) FROM profiles WHERE plan = 'pro') * 49.9 +
        (SELECT COALESCE(COUNT(*), 0) FROM profiles WHERE plan = 'premium') * 79.9
    );

    -- Conversion rate
    IF v_total > 0 THEN
        v_conversion := (v_active::DECIMAL / v_total::DECIMAL) * 100;
    ELSE
        v_conversion := 0;
    END IF;

    RETURN QUERY SELECT v_total, v_trial, v_active, v_canceled, v_conversion, v_mrr;
END;
$$;

-- ============================================================
-- GRACE PERIOD CHECK
-- ============================================================

CREATE OR REPLACE FUNCTION is_subscription_active_with_grace(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile profiles%ROWTYPE;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;

    IF v_profile IS NULL THEN
        RETURN false;
    END IF;

    -- Trial is always active
    IF v_profile.is_trial_active = true AND v_profile.trial_ends_at > v_now THEN
        RETURN true;
    END IF;

    -- Check grace period
    IF v_profile.subscription_status = 'past_due' 
       AND v_profile.grace_period_until IS NOT NULL 
       AND v_profile.grace_period_until > v_now THEN
        RETURN true;
    END IF;

    -- Active subscription
    IF v_profile.plan IS NOT NULL 
       AND v_profile.plan != 'free'
       AND v_profile.plan_expires_at > v_now THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

-- ============================================================
-- FINAL VERIFICATION
-- ============================================================

SELECT 
    'Metrics check:' AS info;
SELECT * FROM get_dashboard_metrics();

SELECT 
    'Funnel check:' AS info;
SELECT * FROM get_conversion_funnel(30);