-- Create workout_sessions table
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_exercise_index INT NOT NULL DEFAULT 0,
  current_set INT NOT NULL DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workout_sets table
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number INT NOT NULL,
  reps_completed INT,
  weight_kg DECIMAL(5,2),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_status ON workout_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_workout ON workout_sessions(workout_id, status);
CREATE INDEX IF NOT EXISTS idx_sets_session ON workout_sets(session_id);

-- RLS Policies
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Users can read own sessions" ON workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Sets policies
CREATE POLICY "Users can read own sets" ON workout_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws 
      WHERE ws.id = workout_sets.session_id 
      AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own sets" ON workout_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_sessions ws 
      WHERE ws.id = workout_sets.session_id 
      AND ws.user_id = auth.uid()
    )
  );
