-- Ficha técnica do aluno (obrigatória para planos pagos)
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  idade INTEGER NOT NULL,
  altura NUMERIC(5,2) NOT NULL,
  peso NUMERIC(5,2) NOT NULL,
  objetivo TEXT NOT NULL,
  nivel_experiencia TEXT NOT NULL CHECK (nivel_experiencia IN ('iniciante','intermediario','avancado')),
  lesoes TEXT DEFAULT '',
  limitacoes TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'awaiting_program' CHECK (status IN ('awaiting_program','program_assigned','active')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_profiles_select_own" ON public.student_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "student_profiles_insert_own" ON public.student_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "student_profiles_update_own" ON public.student_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "student_profiles_select_personal" ON public.student_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'personal')
  );

CREATE POLICY "student_profiles_update_personal" ON public.student_profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'personal')
  );
