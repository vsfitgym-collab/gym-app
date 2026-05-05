-- Correção das policies RLS para salvar exercícios dentro de treinos.
-- Execute este arquivo uma vez no Supabase SQL Editor.

create or replace function public.is_current_user_trainer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'trainer'
  );
$$;

create or replace function public.can_manage_workout(target_workout_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workouts
    where id = target_workout_id
      and trainer_id = auth.uid()
  )
  and public.is_current_user_trainer();
$$;

grant execute on function public.is_current_user_trainer() to authenticated;
grant execute on function public.can_manage_workout(uuid) to authenticated;

alter table public.workout_exercises enable row level security;

drop policy if exists "Workout exercises accessible" on public.workout_exercises;
drop policy if exists "Trainers can insert workout exercises" on public.workout_exercises;
drop policy if exists "Trainers can update workout exercises" on public.workout_exercises;
drop policy if exists "Trainers can delete workout exercises" on public.workout_exercises;

create policy "Workout exercises are readable"
on public.workout_exercises
for select
using (true);

create policy "Trainers can insert exercises in own workouts"
on public.workout_exercises
for insert
with check (public.can_manage_workout(workout_id));

create policy "Trainers can update exercises in own workouts"
on public.workout_exercises
for update
using (public.can_manage_workout(workout_id))
with check (public.can_manage_workout(workout_id));

create policy "Trainers can delete exercises from own workouts"
on public.workout_exercises
for delete
using (public.can_manage_workout(workout_id));
