-- Correção para permitir que o aluno salve/crie a própria ficha técnica.
-- Execute este arquivo uma vez no Supabase SQL Editor.

alter table public.user_profiles_extended enable row level security;

drop policy if exists "Users can view own extended profile" on public.user_profiles_extended;
drop policy if exists "Users can update own extended profile" on public.user_profiles_extended;
drop policy if exists "Users can insert own extended profile" on public.user_profiles_extended;
drop policy if exists "Trainers can view student profiles" on public.user_profiles_extended;

create policy "Users can view own extended profile"
on public.user_profiles_extended
for select
using (user_id = auth.uid());

create policy "Users can insert own extended profile"
on public.user_profiles_extended
for insert
with check (user_id = auth.uid());

create policy "Users can update own extended profile"
on public.user_profiles_extended
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

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
