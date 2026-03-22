-- Run this SQL in your Supabase SQL Editor (supabase.com > SQL Editor)

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  lobby_code TEXT UNIQUE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_lobby_code ON subscriptions(lobby_code);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own subscription
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can do everything (for webhooks)
CREATE POLICY "Service role full access" ON subscriptions
  FOR ALL USING (true);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on changes
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function to create test subscription (for development/testing)
-- Usage: SELECT create_test_subscription('user@email.com');
CREATE OR REPLACE FUNCTION create_test_subscription(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  v_user_id UUID;
  v_lobby_code TEXT;
BEGIN
  -- Get user ID from email
  SELECT id INTO v_user_id FROM auth.users WHERE email = user_email;
  
  IF v_user_id IS NULL THEN
    RETURN 'Error: User not found with email ' || user_email;
  END IF;
  
  -- Generate random lobby code
  v_lobby_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  
  -- Insert or update subscription
  INSERT INTO subscriptions (
    user_id,
    email,
    status,
    lobby_code,
    current_period_start,
    current_period_end
  ) VALUES (
    v_user_id,
    user_email,
    'active',
    v_lobby_code,
    NOW(),
    NOW() + INTERVAL '1 year'
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    status = 'active',
    lobby_code = COALESCE(subscriptions.lobby_code, v_lobby_code),
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 year',
    updated_at = NOW();
  
  RETURN 'Success! Test subscription created for ' || user_email || ' with lobby code: ' || COALESCE((SELECT lobby_code FROM subscriptions WHERE user_id = v_user_id), v_lobby_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
