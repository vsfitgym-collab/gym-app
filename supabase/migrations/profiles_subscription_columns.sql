-- Garantir colunas necessárias em profiles para controle de assinatura
-- Executar todas as colunas de uma vez

-- 1. subscription_status
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free'
CHECK (subscription_status IN ('free', 'active', 'past_due', 'canceled', 'incomplete', 'trialing'));

-- 2. plan
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free'
CHECK (plan IN ('free', 'basic', 'pro', 'premium'));

-- 3. plan_expires_at
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE;

-- 4. trial_ends_at  
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- 5. is_trial_active
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_trial_active BOOLEAN DEFAULT false;

-- 6. stripe_customer_id
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 7. stripe_subscription_id
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 8. grace_period_until
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS grace_period_until TIMESTAMP WITH TIME ZONE;

-- Set default values para registros existentes (opcional)
UPDATE profiles 
SET subscription_status = 'free',
    plan = COALESCE(plan, 'free')
WHERE subscription_status IS NULL;

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;