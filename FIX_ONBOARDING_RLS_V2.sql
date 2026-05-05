-- Script completo para correção das políticas RLS na tabela user_profiles_extended
-- Execute este arquivo uma vez no Supabase SQL Editor
-- Isso garante que os usuários possam salvar/atualizar sua ficha técnica no onboarding

-- 1. Habilita RLS na tabela
alter table public.user_profiles_extended enable row level security;

-- 2. Remove todas as políticas antigas para evitar conflitos
drop policy if exists "Users can view own extended profile" on public.user_profiles_extended;
drop policy if exists "Users can insert own extended profile" on public.user_profiles_extended;
drop policy if exists "Users can update own extended profile" on public.user_profiles_extended;
drop policy if exists "Users can delete own extended profile" on public.user_profiles_extended;
drop policy if exists "Trainers can view student profiles" on public.user_profiles_extended;
drop policy if exists "Trainers can view all student profiles" on public.user_profiles_extended;
drop policy if exists "Trainers can update student profiles" on public.user_profiles_extended;
drop policy if exists "Public access to user profiles" on public.user_profiles_extended;

-- 3. Cria novas políticas com melhor cobertura

-- Política: Usuários podem VER seu próprio perfil
create policy "Users can view own extended profile"
on public.user_profiles_extended
for select
using (user_id = auth.uid());

-- Política: Usuários podem INSERIR seu próprio perfil (para onboarding)
create policy "Users can insert own extended profile"
on public.user_profiles_extended
for insert
with check (user_id = auth.uid());

-- Política: Usuários podem ATUALIZAR seu próprio perfil
create policy "Users can update own extended profile"
on public.user_profiles_extended
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Política: Usuários podem DELETAR seu próprio perfil
create policy "Users can delete own extended profile"
on public.user_profiles_extended
for delete
using (user_id = auth.uid());

-- Política: Trainers podem VER perfis de todos os alunos
create policy "Trainers can view student profiles"
on public.user_profiles_extended
for select
using (
  exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'trainer'
  )
);

-- Política: Trainers podem ATUALIZAR perfis de seus alunos
create policy "Trainers can update student profiles"
on public.user_profiles_extended
for update
using (
  exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'trainer'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'trainer'
  )
);

-- 4. Verifica se há trigger para updated_at (opcional mas recomendado)
-- Se a tabela não tiver trigger de updated_at, descomente abaixo:
/*
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_user_profiles_extended_updated_at on public.user_profiles_extended;
create trigger update_user_profiles_extended_updated_at
before update on public.user_profiles_extended
for each row
execute function update_updated_at_column();
*/

-- 5. Verifica as políticas criadas
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public' and tablename = 'user_profiles_extended'
order by policyname;
