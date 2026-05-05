-- Policies necessárias para telas reais de aluno/personal.
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

create or replace function public.is_chat_participant(target_chat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_participants
    where chat_id = target_chat_id
      and user_id = auth.uid()
  );
$$;

grant execute on function public.is_chat_participant(uuid) to authenticated;

-- Workouts: personal gerencia os próprios treinos; aluno lê treinos atribuídos.
alter table public.workouts enable row level security;

drop policy if exists "Trainers can manage own workouts" on public.workouts;
drop policy if exists "Students can view assigned workouts" on public.workouts;

create policy "Trainers can manage own workouts"
on public.workouts
for all
using (trainer_id = auth.uid() and public.is_current_user_trainer())
with check (trainer_id = auth.uid() and public.is_current_user_trainer());

create policy "Students can view assigned workouts"
on public.workouts
for select
using (
  exists (
    select 1
    from public.workout_assignments wa
    where wa.workout_id = workouts.id
      and wa.user_id = auth.uid()
  )
);

-- Exercícios do treino: personal altera os próprios; alunos leem os exercícios dos treinos atribuídos.
alter table public.workout_exercises enable row level security;

drop policy if exists "Workout exercises accessible" on public.workout_exercises;
drop policy if exists "Workout exercises are readable" on public.workout_exercises;
drop policy if exists "Trainers can insert workout exercises" on public.workout_exercises;
drop policy if exists "Trainers can update workout exercises" on public.workout_exercises;
drop policy if exists "Trainers can delete workout exercises" on public.workout_exercises;
drop policy if exists "Trainers can insert exercises in own workouts" on public.workout_exercises;
drop policy if exists "Trainers can update exercises in own workouts" on public.workout_exercises;
drop policy if exists "Trainers can delete exercises from own workouts" on public.workout_exercises;
drop policy if exists "Students can view exercises from assigned workouts" on public.workout_exercises;

create policy "Students can view exercises from assigned workouts"
on public.workout_exercises
for select
using (
  public.can_manage_workout(workout_id)
  or exists (
    select 1
    from public.workout_assignments wa
    where wa.workout_id = workout_exercises.workout_id
      and wa.user_id = auth.uid()
  )
);

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

-- Atribuições: aluno vê e atualiza a própria atribuição; personal gerencia atribuições.
alter table public.workout_assignments enable row level security;

drop policy if exists "Users can view own assignments" on public.workout_assignments;
drop policy if exists "Trainers can view all assignments" on public.workout_assignments;
drop policy if exists "Trainers can manage assignments" on public.workout_assignments;
drop policy if exists "Users can update own assignments" on public.workout_assignments;

create policy "Users can view own assignments"
on public.workout_assignments
for select
using (user_id = auth.uid() or public.is_current_user_trainer());

create policy "Users can update own assignments"
on public.workout_assignments
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Trainers can manage assignments"
on public.workout_assignments
for all
using (public.is_current_user_trainer())
with check (public.is_current_user_trainer());

-- Gamificação: aluno grava seus stats; personal lê stats dos alunos.
alter table public.user_stats enable row level security;

drop policy if exists "Users can view own stats" on public.user_stats;
drop policy if exists "Users can insert own stats" on public.user_stats;
drop policy if exists "Users can update own stats" on public.user_stats;
drop policy if exists "Trainers can view user stats" on public.user_stats;

create policy "Users can view own stats"
on public.user_stats
for select
using (user_id = auth.uid() or public.is_current_user_trainer());

create policy "Users can insert own stats"
on public.user_stats
for insert
with check (user_id = auth.uid());

create policy "Users can update own stats"
on public.user_stats
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Conquistas do aluno: aluno grava a própria evolução; personal lê.
alter table public.user_achievements enable row level security;

drop policy if exists "Users can view own achievements" on public.user_achievements;
drop policy if exists "Users can insert own achievements" on public.user_achievements;
drop policy if exists "Users can update own achievements" on public.user_achievements;

create policy "Users can view own achievements"
on public.user_achievements
for select
using (user_id = auth.uid() or public.is_current_user_trainer());

create policy "Users can insert own achievements"
on public.user_achievements
for insert
with check (user_id = auth.uid());

create policy "Users can update own achievements"
on public.user_achievements
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Chat: participantes veem a conversa e enviam mensagens.
alter table public.chats enable row level security;
alter table public.chat_participants enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Participants can view chats" on public.chats;
drop policy if exists "Authenticated users can create chats" on public.chats;
drop policy if exists "Participants can view chat participants" on public.chat_participants;
drop policy if exists "Authenticated users can create chat participants" on public.chat_participants;
drop policy if exists "Participants can view messages" on public.messages;
drop policy if exists "Participants can send messages" on public.messages;

create policy "Participants can view chats"
on public.chats
for select
using (public.is_chat_participant(id));

create policy "Authenticated users can create chats"
on public.chats
for insert
with check (auth.uid() is not null);

create policy "Participants can view chat participants"
on public.chat_participants
for select
using (user_id = auth.uid() or public.is_chat_participant(chat_id));

create policy "Authenticated users can create chat participants"
on public.chat_participants
for insert
with check (auth.uid() is not null);

create policy "Participants can view messages"
on public.messages
for select
using (public.is_chat_participant(chat_id));

create policy "Participants can send messages"
on public.messages
for insert
with check (
  sender_id = auth.uid()
  and public.is_chat_participant(chat_id)
);
