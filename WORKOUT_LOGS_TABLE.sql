-- Tabela de logs de treino
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('started', 'completed')) DEFAULT 'started',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_workout_id ON workout_logs(workout_id);
CREATE INDEX idx_workout_logs_status ON workout_logs(status);

-- Row Level Security
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- Política: usuários veem apenas seus próprios logs
CREATE POLICY "Users can view own workout logs" ON workout_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Política: usuários podem inserir seus próprios logs
CREATE POLICY "Users can insert own workout logs" ON workout_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Política: usuários podem atualizar seus próprios logs
CREATE POLICY "Users can update own workout logs" ON workout_logs
  FOR UPDATE
  USING (user_id = auth.uid());