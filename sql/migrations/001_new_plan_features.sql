-- =============================================
-- MIGRAÇÃO: Novo Sistema de Plan Features
-- Objetivo: Padronizar features (boolean vs limite)
-- Executar ordem: 1
-- =============================================

-- 1. Criar nova tabela com estrutura correta
CREATE TABLE IF NOT EXISTS plan_features_new (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    feature_key TEXT NOT NULL,
    value_boolean BOOLEAN,
    value_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plan_id, feature_key)
);

-- 2. Popular dados migração - TRIAL
INSERT INTO plan_features_new (id, plan_id, feature_key, value_boolean, value_number) VALUES
('trial-workouts_limit', 'trial', 'workouts_limit', NULL, NULL),
('trial-chat_with_trainer', 'trial', 'chat_with_trainer', true, NULL),
('trial-progress_tracking', 'trial', 'progress_tracking', true, NULL),
('trial-analytics', 'trial', 'analytics', false, NULL),
('trial-achievements', 'trial', 'achievements', false, NULL);

-- 3. Popular dados migração - BASIC
INSERT INTO plan_features_new (id, plan_id, feature_key, value_boolean, value_number) VALUES
('basic-workouts_limit', 'basic', 'workouts_limit', NULL, 3),
('basic-chat_with_trainer', 'basic', 'chat_with_trainer', false, NULL),
('basic-progress_tracking', 'basic', 'progress_tracking', true, NULL),
('basic-analytics', 'basic', 'analytics', false, NULL),
('basic-achievements', 'basic', 'achievements', false, NULL);

-- 4. Popular dados migração - PRO
INSERT INTO plan_features_new (id, plan_id, feature_key, value_boolean, value_number) VALUES
('pro-workouts_limit', 'pro', 'workouts_limit', NULL, NULL),
('pro-chat_with_trainer', 'pro', 'chat_with_trainer', true, NULL),
('pro-progress_tracking', 'pro', 'progress_tracking', true, NULL),
('pro-analytics', 'pro', 'analytics', true, NULL),
('pro-achievements', 'pro', 'achievements', false, NULL);

-- 5. Popular dados migração - PREMIUM
INSERT INTO plan_features_new (id, plan_id, feature_key, value_boolean, value_number) VALUES
('premium-workouts_limit', 'premium', 'workouts_limit', NULL, NULL),
('premium-chat_with_trainer', 'premium', 'chat_with_trainer', true, NULL),
('premium-progress_tracking', 'premium', 'progress_tracking', true, NULL),
('premium-analytics', 'premium', 'analytics', true, NULL),
('premium-achievements', 'premium', 'achievements', true, NULL);

-- 6. Substituir tabela antiga
ALTER TABLE plan_features RENAME TO plan_features_old;
ALTER TABLE plan_features_new RENAME TO plan_features;

-- 7. Adicionar índice para Performance
CREATE INDEX IF NOT EXISTS idx_plan_features_lookup 
ON plan_features(plan_id, feature_key);

-- 8. Adicionar constraint Check
ALTER TABLE plan_features ADD CONSTRAINT chk_feature_value_type 
CHECK (
    (value_boolean IS NOT NULL AND value_number IS NULL) OR
    (value_boolean IS NULL AND value_number IS NOT NULL) OR
    (value_boolean IS NULL AND value_number IS NULL)
);

-- 9. Criar view para facilitar consultas
-- Nota: subscriptions usa coluna 'plan', não 'plan_id'
CREATE OR REPLACE VIEW v_user_features AS
SELECT 
    s.user_id,
    s.plan as plan_id,
    pf.feature_key,
    pf.value_boolean,
    pf.value_number,
    CASE 
        WHEN pf.value_number IS NULL AND pf.value_boolean IS NOT NULL THEN pf.value_boolean::boolean
        WHEN pf.value_number IS NOT NULL THEN false
        ELSE false
    END as has_access,
    CASE 
        WHEN pf.value_number IS NOT NULL THEN pf.value_number
        WHEN pf.value_boolean = true THEN NULL
        ELSE 0
    END as limit_value
FROM subscriptions s
JOIN plan_features pf ON pf.plan_id = s.plan
WHERE s.status = 'active';

-- 10. Confirmar migração bem-sucedida
SELECT 'Migração concluída com sucesso!' as status;