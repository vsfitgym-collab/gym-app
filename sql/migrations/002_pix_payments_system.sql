-- =============================================
-- MIGRAÇÃO: Sistema de Pagamento PIX
-- Execute este script completo no Supabase
-- =============================================

-- 1. Criar tabela de pagamentos Pix
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'canceled', 'expired')),
    pix_code TEXT,
    qr_code_data TEXT,
    payment_intent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- 3. Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    auto_renew BOOLEAN DEFAULT false,
    payment_id UUID REFERENCES payments(id)
);

-- 4. Criar índices para subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 5. Habilitar Realtime nas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;

-- 6. Criar função para gerar código Pix falso (para desenvolvimento)
CREATE OR REPLACE FUNCTION generate_pix_code(p_amount NUMERIC, p_plan_name TEXT)
RETURNS TEXT AS $$
DECLARE
    pix_code TEXT;
    amount_str TEXT;
BEGIN
    amount_str := LPAD(FLOOR(p_amount * 100)::TEXT, 10, '0');
    pix_code := '00020126580014BR.GOV.BCB.PIX0126vsfitgym@gmail.com520400005303986540' || amount_str || '5802BR5913VSFIT GYM6009SAO PAULO62070503***6304';
    RETURN pix_code;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Criar função RPC para criar pagamento Pix
CREATE OR REPLACE FUNCTION create_pix_payment(
    p_plan_id TEXT,
    p_user_id UUID,
    p_amount NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    payment_id UUID;
    pix_code TEXT;
    qr_code_data TEXT;
    plan_name TEXT;
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Buscar nome do plano
    SELECT name INTO plan_name FROM plans WHERE id = p_plan_id;
    IF plan_name IS NULL THEN
        plan_name := p_plan_id;
    END IF;

    -- Gerar código Pix
    pix_code := generate_pix_code(p_amount, plan_name);

    -- Calcular data de expiração (24 horas)
    expires_at := NOW() + INTERVAL '24 hours';

    -- Inserir pagamento
    INSERT INTO payments (user_id, plan_id, amount, status, pix_code, qr_code_data, expires_at)
    VALUES (p_user_id, p_plan_id, p_amount, 'pending', pix_code, pix_code, expires_at)
    RETURNING id INTO payment_id;

    -- Retornar dados do pagamento
    RETURN jsonb_build_object(
        'payment_id', payment_id,
        'pix_code', pix_code,
        'qr_code', pix_code,
        'expires_at', expires_at,
        'amount', p_amount,
        'plan_name', plan_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Criar função RPC para confirmar pagamento
CREATE OR REPLACE FUNCTION confirm_payment(
    p_payment_id UUID,
    p_trainer_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_plan_id TEXT;
    v_amount NUMERIC;
    v_status TEXT;
    v_subscription_id UUID;
    v_new_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Buscar pagamento
    SELECT user_id, plan_id, amount, status INTO v_user_id, v_plan_id, v_amount, v_status
    FROM payments WHERE id = p_payment_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Pagamento não encontrado';
    END IF;

    IF v_status != 'pending' THEN
        RAISE EXCEPTION 'Pagamento não está pendente';
    END IF;

    -- Atualizar pagamento para pago
    UPDATE payments 
    SET status = 'paid', 
        paid_at = NOW() 
    WHERE id = p_payment_id;

    -- Calcular data de fim (30 dias)
    v_new_end_date := NOW() + INTERVAL '30 days';

    -- Verificar se existe assinatura ativa
    SELECT id INTO v_subscription_id 
    FROM subscriptions 
    WHERE user_id = v_user_id AND status = 'active';

    IF v_subscription_id IS NOT NULL THEN
        -- Atualizar assinatura existente
        UPDATE subscriptions 
        SET plan = v_plan_id,
            start_date = NOW(),
            end_date = v_new_end_date,
            updated_at = NOW()
        WHERE id = v_subscription_id;
    ELSE
        -- Criar nova assinatura
        INSERT INTO subscriptions (user_id, plan, status, start_date, end_date)
        VALUES (v_user_id, v_plan_id, 'active', NOW(), v_new_end_date)
        RETURNING id INTO v_subscription_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', p_payment_id,
        'subscription_id', v_subscription_id,
        'end_date', v_new_end_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Criar função para verificar assinatura ativa
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    active_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO active_count
    FROM subscriptions
    WHERE user_id = p_user_id 
      AND status = 'active'
      AND (end_date IS NULL OR end_date > NOW());

    RETURN active_count > 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 10. Criar view para buscar dados do pagamento com usuário
CREATE OR REPLACE VIEW payments_with_user AS
SELECT 
    p.id,
    p.user_id,
    p.plan as plan_id,
    p.amount,
    p.status,
    p.pix_code,
    p.qr_code_data,
    p.created_at,
    p.paid_at,
    p.expires_at,
    pr.full_name as user_name,
    pr.email as user_email,
    pl.name as plan_name,
    pl.price
FROM payments p
LEFT JOIN profiles pr ON p.user_id = pr.id
LEFT JOIN plans pl ON p.plan = pl.id;

-- 11. Inserir dados de planos se não existirem
INSERT INTO plans (id, name, price, features, duration_days, is_trial)
VALUES 
    ('trial', 'Trial', 0, '["Acesso total por 7 dias"]', 7, true),
    ('basic', 'Básico', 49.90, '["Acompanhamento de progresso", "3 treinos por semana", "Catálogo de exercícios"]', 30, false),
    ('pro', 'Pro', 89.90, '["Treinos ilimitados", "Chat com personal trainer", "Analytics básico"]', 30, false),
    ('premium', 'Premium', 149.90, '["Tudo do Pro", "Analytics avançado", "Conquistas e premiações"]', 30, false)
ON CONFLICT (id) DO NOTHING;

-- 12. Criar trigger para atualizar updated_at em subscriptions
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscription_timestamp ON subscriptions;
CREATE TRIGGER trigger_update_subscription_timestamp
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_timestamp();