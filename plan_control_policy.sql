-- Add plan columns to profiles table (for quick access)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'premium')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS plan_activated_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster plan checks
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_expires ON profiles(plan_expires_at);

-- Function to auto-expire plans (run via cron or trigger)
CREATE OR REPLACE FUNCTION check_plan_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan_expires_at IS NOT NULL AND NEW.plan_expires_at < NOW() THEN
    NEW.plan := 'free';
    NEW.plan_expires_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-expire on read
CREATE TRIGGER trg_check_plan_expiration
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_plan_expiration();

-- Function to upgrade user plan
CREATE OR REPLACE FUNCTION upgrade_user_plan(
  user_id UUID,
  new_plan TEXT,
  duration_days INT DEFAULT 30
)
RETURNS VOID AS $$
DECLARE
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  expires_at := NOW() + (duration_days || ' days')::INTERVAL;
  
  UPDATE profiles SET
    plan = new_plan,
    plan_expires_at = expires_at,
    plan_activated_at = NOW()
  WHERE id = user_id;
  
  -- Also update subscriptions table for consistency
  UPDATE subscriptions SET
    plan = new_plan,
    status = 'active',
    end_date = expires_at,
    updated_at = NOW()
  WHERE user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to downgrade user plan
CREATE OR REPLACE FUNCTION downgrade_user_plan(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET
    plan = 'free',
    plan_expires_at = NULL
  WHERE id = user_id;
  
  UPDATE subscriptions SET
    status = 'expired',
    updated_at = NOW()
  WHERE user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: Users can only read their own plan
CREATE POLICY "Users can read own plan" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- RLS: Only service role or user can update their own plan
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS: Service role can update any profile (for webhooks)
CREATE POLICY "Service role can manage profiles" ON profiles
  FOR ALL USING (true) WITH CHECK (true);
