-- Recriar tabelas de gamificação (Drop e Recreate)

DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS user_stats;
DROP TABLE IF EXISTS achievements;

-- achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  type TEXT NOT NULL DEFAULT 'workouts_completed',
  target_value INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, achievement_id)
);

-- user_stats
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  total_workouts INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policies
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
CREATE POLICY "Users can view own stats" ON user_stats FOR SELECT USING (user_id = auth.uid());

-- Conquistas padrão
INSERT INTO achievements (name, description, icon, type, target_value, xp_reward) VALUES
('Primeiro Passo', 'Complete seu primeiro treino', 'zap', 'workouts_completed', 1, 50),
('Consistente', 'Complete 7 treinos', 'flame', 'workouts_completed', 7, 100),
('Dedicado', 'Complete 20 treinos', 'trophy', 'workouts_completed', 20, 200),
('Atleta', 'Complete 50 treinos', 'medal', 'workouts_completed', 50, 500),
('Lendário', 'Complete 100 treinos', 'crown', 'workouts_completed', 100, 1000),
('Streak Semanal', 'Treine 7 dias seguidos', 'calendar', 'streak_days', 7, 150),
('Streak Mensal', 'Treine 30 dias seguidos', 'flame', 'streak_days', 30, 500),
('Maratonista', 'Treine por 1000 minutos', 'clock', 'total_time', 1000, 200);