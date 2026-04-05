-- Create workout_presence table
CREATE TABLE IF NOT EXISTS workout_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workout_id, date)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_presence_user_date ON workout_presence(user_id, date);
CREATE INDEX IF NOT EXISTS idx_presence_workout_date ON workout_presence(workout_id, date);

-- RLS Policies
ALTER TABLE workout_presence ENABLE ROW LEVEL SECURITY;

-- Users can read their own presence
CREATE POLICY "Users can read own presence" ON workout_presence
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own presence
CREATE POLICY "Users can insert own presence" ON workout_presence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own presence
CREATE POLICY "Users can delete own presence" ON workout_presence
  FOR DELETE USING (auth.uid() = user_id);
