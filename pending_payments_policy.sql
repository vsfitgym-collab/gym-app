-- Add pending status to subscriptions
ALTER TABLE subscriptions 
  ALTER COLUMN status TYPE TEXT;

-- Add payment verification fields
ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS payment_pending BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_requested_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Create pending_payments table for personal to manage
CREATE TABLE IF NOT EXISTS pending_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'premium')),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  pix_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pending_payments_user ON pending_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON pending_payments(status);
CREATE INDEX IF NOT EXISTS idx_pending_payments_created ON pending_payments(created_at DESC);

-- RLS Policies
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;

-- Users can read own pending payments
CREATE POLICY "Users can read own pending payments" ON pending_payments
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own pending payments
CREATE POLICY "Users can insert own pending payments" ON pending_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Personal (admins) can see all pending payments
CREATE POLICY "Personal can manage pending payments" ON pending_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'personal'
    )
  );
