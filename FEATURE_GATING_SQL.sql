-- =====================================================
-- SISTEMA DE FEATURE GATING - VSFIT GYM
-- =====================================================

-- 1. TABELA DE PLANOS
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY CHECK (id IN ('trial', 'basic', 'pro', 'premium')),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  interval TEXT NOT NULL DEFAULT 'monthly',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE FEATURES POR PLANO (antes de plans, pois tem FK)
CREATE TABLE IF NOT EXISTS plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  limit_value INTEGER,
  UNIQUE(plan_id, feature_key)
);

-- 3. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id ON plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_status ON subscriptions(user_id, status);

-- =====================================================
-- SEED DATA: PLANOS
-- =====================================================

INSERT INTO plans (id, name, price, interval, description) VALUES
  ('trial', 'Trial', 0, 'monthly', 'Período de teste gratuito por 7 dias'),
  ('basic', 'Básico', 49.90, 'monthly', 'Plano básico com funcionalidades essenciais'),
  ('pro', 'Pro', 89.90, 'monthly', 'Plano profissional com recursos completos'),
  ('premium', 'Premium', 149.90, 'monthly', 'Plano completo com tudo liberado')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SEED DATA: FEATURES POR PLANO
-- =====================================================

-- TRIAL: acesso total por 7 dias
INSERT INTO plan_features (plan_id, feature_key, enabled, limit_value) VALUES
  ('trial', 'workouts_unlimited', true, NULL),
  ('trial', 'analytics', true, NULL),
  ('trial', 'chat_with_trainer', true, NULL),
  ('trial', 'progress_tracking', true, NULL),
  ('trial', 'achievements', true, NULL),
  ('trial', 'custom_workout_request', true, NULL),
  ('trial', 'workouts_limit', true, 3)
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- BASIC: apenas progress_tracking
INSERT INTO plan_features (plan_id, feature_key, enabled, limit_value) VALUES
  ('basic', 'workouts_unlimited', false, NULL),
  ('basic', 'analytics', false, NULL),
  ('basic', 'chat_with_trainer', false, NULL),
  ('basic', 'progress_tracking', true, NULL),
  ('basic', 'achievements', false, NULL),
  ('basic', 'custom_workout_request', false, NULL),
  ('basic', 'workouts_limit', true, 3)
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- PRO: workouts + progress + chat
INSERT INTO plan_features (plan_id, feature_key, enabled, limit_value) VALUES
  ('pro', 'workouts_unlimited', true, NULL),
  ('pro', 'analytics', false, NULL),
  ('pro', 'chat_with_trainer', true, NULL),
  ('pro', 'progress_tracking', true, NULL),
  ('pro', 'achievements', true, NULL),
  ('pro', 'custom_workout_request', true, NULL),
  ('pro', 'workouts_limit', true, NULL)
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- PREMIUM: tudo liberado
INSERT INTO plan_features (plan_id, feature_key, enabled, limit_value) VALUES
  ('premium', 'workouts_unlimited', true, NULL),
  ('premium', 'analytics', true, NULL),
  ('premium', 'chat_with_trainer', true, NULL),
  ('premium', 'progress_tracking', true, NULL),
  ('premium', 'achievements', true, NULL),
  ('premium', 'custom_workout_request', true, NULL),
  ('premium', 'workouts_limit', true, NULL)
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view plans" ON plans FOR SELECT USING (true);

ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view plan features" ON plan_features FOR SELECT USING (true);
CREATE POLICY "Trainers can manage plan features" ON plan_features FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer'));

-- Atualizar subscriptions para usar plan_id como text
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check 
  CHECK (plan IN ('trial', 'basic', 'pro', 'premium'));

-- Renomear coluna para plan_id para consistência
ALTER TABLE subscriptions RENAME COLUMN plan TO plan_id;

-- =====================================================
-- FUNÇÕES CORE DO SISTEMA
-- =====================================================

-- Função para verificar acesso a feature
CREATE OR REPLACE FUNCTION public.has_feature_access(
  p_user_id UUID,
  p_feature_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_plan_feature RECORD;
  v_has_access BOOLEAN := false;
BEGIN
  -- Buscar subscription ativa do usuário
  SELECT s.plan_id, s.status, s.end_date
  INTO v_subscription
  FROM subscriptions s
  WHERE s.user_id = p_user_id 
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- Se não encontrou subscription ativa, nega acesso
  IF v_subscription IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar se a subscription não expirou
  IF v_subscription.end_date IS NOT NULL AND v_subscription.end_date < NOW() THEN
    RETURN false;
  END IF;

  -- Buscar feature do plano
  SELECT pf.enabled, pf.limit_value
  INTO v_plan_feature
  FROM plan_features pf
  WHERE pf.plan_id = v_subscription.plan_id
    AND pf.feature_key = p_feature_key;

  -- Se feature não existe, retorna false
  IF v_plan_feature IS NULL THEN
    RETURN false;
  END IF;

  RETURN v_plan_feature.enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter limite de workouts
CREATE OR REPLACE FUNCTION public.get_workouts_limit(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_limit INTEGER;
  v_subscription RECORD;
  v_feature RECORD;
BEGIN
  SELECT s.plan_id INTO v_subscription
  FROM subscriptions s
  WHERE s.user_id = p_user_id 
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_subscription IS NULL THEN
    RETURN 0;
  END IF;

  SELECT pf.limit_value INTO v_feature
  FROM plan_features pf
  WHERE pf.plan_id = v_subscription.plan_id
    AND pf.feature_key = 'workouts_limit'
    AND pf.enabled = true;

  RETURN COALESCE(v_feature.limit_value, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter todas as features do usuário
CREATE OR REPLACE FUNCTION public.get_user_features(p_user_id UUID)
RETURNS TABLE(feature_key TEXT, enabled BOOLEAN, limit_value INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pf.feature_key,
    pf.enabled,
    pf.limit_value
  FROM plan_features pf
  INNER JOIN subscriptions s ON s.plan_id = pf.plan_id
  WHERE s.user_id = p_user_id 
    AND s.status = 'active'
    AND (s.end_date IS NULL OR s.end_date > NOW())
  ORDER BY pf.feature_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- JOB DE EXPIRAÇÃO AUTOMÁTICA
-- =====================================================

CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS VOID AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND end_date IS NOT NULL
    AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Agendar execução diária (via cron externo ou manualmente)
-- SELECT cron.schedule('expire-subscriptions', '0 0 * * *', 'SELECT expire_subscriptions()');

-- =====================================================
-- ATUALIZAR TRIGGER PARA CRIAR TRIAL AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  
  -- Criar perfil estendido
  INSERT INTO public.user_profiles_extended (user_id, onboarding_completed)
  VALUES (NEW.id, false);
  
  -- Criar subscription trial automaticamente (7 dias)
  INSERT INTO public.subscriptions (user_id, plan_id, status, start_date, end_date)
  VALUES (
    NEW.id,
    'trial',
    'active',
    NOW(),
    NOW() + INTERVAL '7 days'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_feature_access(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_workouts_limit(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_features(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_subscriptions() TO authenticated;