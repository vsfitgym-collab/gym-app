-- Verificar dados na tabela profiles
SELECT id, name, role, email FROM profiles;

-- Verificar se a coluna email existe
SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';
