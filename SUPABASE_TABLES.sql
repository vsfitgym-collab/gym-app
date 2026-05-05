-- Tabelas do VSFit Gym

-- 1. Profiles (usuários)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'trainer')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Perfil estendido do usuário (onboarding)
CREATE TABLE IF NOT EXISTS user_profiles_extended (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  objective TEXT,
  age INTEGER,
  height DECIMAL(3,2),
  weight DECIMAL(5,2),
  level TEXT CHECK (level IN ('iniciante', 'intermediario', 'avancado')),
  days_per_week INTEGER,
  training_time INTEGER,
  injuries TEXT,
  preferences TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Exercícios
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  muscle_group TEXT NOT NULL,
  equipment TEXT,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Treinos (criados pelo personal)
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('iniciante', 'intermediario', 'avancado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Exercícios dentro do treino
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL,
  reps INTEGER,
  duration_seconds INTEGER,
  rest_seconds INTEGER NOT NULL DEFAULT 60,
  order_index INTEGER NOT NULL
);

-- 6. Atribuição de treino ao aluno
CREATE TABLE IF NOT EXISTS workout_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 7. Assinaturas/Planos
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT CHECK (plan IN ('trial', 'basico', 'pro', 'premium')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'expired', 'cancelled')) DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  pix_key TEXT,
  pix_code TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Conquistas
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Conquistas dos usuários
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- 11. Chats
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can create chats" ON chats FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view own chats" ON chats FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_participants WHERE chat_id = chats.id AND user_id = auth.uid())
);

-- 12. Participantes do chat
CREATE TABLE IF NOT EXISTS chat_participants (
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (chat_id, user_id)
);

-- 13. Mensagens
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --------------------------------------------------
-- ÍNDICES PARA PERFORMANCE
-- --------------------------------------------------

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_user_profiles_extended_user_id ON user_profiles_extended(user_id);
CREATE INDEX idx_workouts_trainer_id ON workouts(trainer_id);
CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX idx_workout_assignments_user_id ON workout_assignments(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);

-- --------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- --------------------------------------------------

-- Profiles: usuários veem apenas seus próprios dados
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trainers veem todos os alunos
CREATE POLICY "Trainers can view all students" ON profiles FOR SELECT 
  USING (role = 'student' OR auth.uid() = id);

-- User Profiles Extended
ALTER TABLE user_profiles_extended ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own extended profile" ON user_profiles_extended 
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own extended profile" ON user_profiles_extended 
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Trainers can view student profiles" ON user_profiles_extended 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer')
  );

-- Exercises: acesso público para leitura
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view exercises" ON exercises FOR SELECT USING (true);
CREATE POLICY "Trainers can manage exercises" ON exercises FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer'));

-- Workouts: apenas o trainer que criou e alunos com atribuição
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainers can manage own workouts" ON workouts FOR ALL 
  USING (trainer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer'));

-- Workout Exercises
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workout exercises accessible" ON workout_exercises FOR SELECT USING (true);
CREATE POLICY "Trainers can insert workout exercises" ON workout_exercises FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM workouts w 
    JOIN profiles p ON p.id = w.trainer_id 
    WHERE w.id = workout_id AND p.role = 'trainer'));
CREATE POLICY "Trainers can update workout exercises" ON workout_exercises FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM workouts w 
    JOIN profiles p ON p.id = w.trainer_id 
    WHERE w.id = workout_id AND p.role = 'trainer'));
CREATE POLICY "Trainers can delete workout exercises" ON workout_exercises FOR DELETE 
  USING (EXISTS (SELECT 1 FROM workouts w 
    JOIN profiles p ON p.id = w.trainer_id 
    WHERE w.id = workout_id AND p.role = 'trainer'));

-- Workout Assignments: alunos veem seus treinos, trainers veem todos
ALTER TABLE workout_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own assignments" ON workout_assignments 
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Trainers can view all assignments" ON workout_assignments 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer')
  );
CREATE POLICY "Trainers can manage assignments" ON workout_assignments FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer'));

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON subscriptions 
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Trainers can manage subscriptions" ON subscriptions FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer'));

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON payments 
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Trainers can view all payments" ON payments 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer')
  );
CREATE POLICY "Users can create payments" ON payments FOR INSERT 
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Trainers can update payments" ON payments FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer')
  );

-- Achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Trainers can manage achievements" ON achievements FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer'));

-- User Achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON user_achievements 
  FOR SELECT USING (user_id = auth.uid());

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "messages_select" ON messages FOR SELECT USING (true);

-- --------------------------------------------------
-- TRIGGER PARA CRIAR PROFILE AUTOMATICAMENTE
-- --------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  
  INSERT INTO public.user_profiles_extended (user_id, onboarding_completed)
  VALUES (NEW.id, false);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();