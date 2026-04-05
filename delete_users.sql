-- ============================================
-- DELETAR USUARIOS DA TABELA AUTH
-- ============================================

-- Ver usuarios existentes
SELECT id, email, created_at FROM auth.users;

-- Deletar todos os usuarios (cuidado!)
DELETE FROM auth.users;

-- Ou deletar um usuario específico (substitua o email)
-- DELETE FROM auth.users WHERE email = 'seu@email.com';
