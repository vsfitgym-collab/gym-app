-- =============================================
-- MIGRAÇÃO: Novo Sistema de Plan Features
-- Execute este script completo no Supabase
-- =============================================

-- 1. Criar nova tabela com estrutura correta
CREATE TABLE IF NOT EXISTS plan_features (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    feature_key TEXT NOT NULL,
    value_boolean BOOLEAN,
    value_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plan_id, feature_key)
);

-- 2. Limpar dados existentes
DELETE FROM plan_features;

-- 3. Popular dados - TRIAL
INSERT INTO plan_features (id, plan_id, feature_key, value_boolean, value_number) VALUES
('trial-workouts_limit', 'trial', 'workouts_limit', NULL, NULL),
('trial-chat_with_trainer', 'trial', 'chat_with_trainer', true, NULL),
('trial-progress_tracking', 'trial', 'progress_tracking', true, NULL),
('trial-analytics', 'trial', 'analytics', false, NULL),
('trial-achievements', 'trial', 'achievements', false, NULL);

-- 4. Popular dados - BASIC
INSERT INTO plan_features (id, plan_id, feature_key, value_boolean, value_number) VALUES
('basic-workouts_limit', 'basic', 'workouts_limit', NULL, 3),
('basic-chat_with_trainer', 'basic', 'chat_with_trainer', false, NULL),
('basic-progress_tracking', 'basic', 'progress_tracking', true, NULL),
('basic-analytics', 'basic', 'analytics', false, NULL),
('basic-achievements', 'basic', 'achievements', false, NULL);

-- 5. Popular dados - PRO
INSERT INTO plan_features (id, plan_id, feature_key, value_boolean, value_number) VALUES
('pro-workouts_limit', 'pro', 'workouts_limit', NULL, NULL),
('pro-chat_with_trainer', 'pro', 'chat_with_trainer', true, NULL),
('pro-progress_tracking', 'pro', 'progress_tracking', true, NULL),
('pro-analytics', 'pro', 'analytics', true, NULL),
('pro-achievements', 'pro', 'achievements', false, NULL);

-- 6. Popular dados - PREMIUM
INSERT INTO plan_features (id, plan_id, feature_key, value_boolean, value_number) VALUES
('premium-workouts_limit', 'premium', 'workouts_limit', NULL, NULL),
('premium-chat_with_trainer', 'premium', 'chat_with_trainer', true, NULL),
('premium-progress_tracking', 'premium', 'progress_tracking', true, NULL),
('premium-analytics', 'premium', 'analytics', true, NULL),
('premium-achievements', 'premium', 'achievements', true, NULL);

-- 7. Adicionar índice
CREATE INDEX IF NOT EXISTS idx_plan_features_lookup ON plan_features(plan_id, feature_key);

-- 8. Verificar dados
SELECT plan_id, feature_key, value_boolean, value_number FROM plan_features ORDER BY plan_id, feature_key;