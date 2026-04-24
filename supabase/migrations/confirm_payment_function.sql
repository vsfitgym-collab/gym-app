-- Função segura para confirmar pagamento PIX
-- Apenas personal/admin pode confirmar pagamento de alunos

create or replace function confirm_payment(
  p_target_user_id uuid,
  p_plan_type text
)
returns void
language plpgsql
security definer
as $$
declare
  v_end_date timestamp with time zone;
begin
  -- Validar plano
  if p_plan_type not in ('basic', 'pro', 'premium') then
    raise exception 'Plano inválido. Use: basic, pro ou premium';
  end if;

  -- Validar se quem está chamando é personal ou admin
  if not exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('personal', 'admin')
  ) then
    raise exception 'Apenas personal ou admin pode confirmar pagamentos';
  end if;

  -- Calcular data de expiração (30 dias)
  v_end_date := now() + interval '30 days';

  -- Atualizar plano do aluno no profile
  update profiles
  set
    plan = p_plan_type,
    subscription_status = 'active',
    plan_expires_at = v_end_date,
    is_trial_active = false,
    updated_at = now()
  where id = p_target_user_id;

  if not found then
    raise exception 'Usuário não encontrado';
  end if;

  -- Upsert subscriptions
  insert into subscriptions (user_id, plan, status, start_date, end_date)
  values (p_target_user_id, p_plan_type, 'active', now(), v_end_date)
  on conflict (user_id) do update
    set plan = p_plan_type,
        status = 'active',
        start_date = now(),
        end_date = v_end_date,
        updated_at = now();

end;
$$;

-- Grant execute to authenticated
grant execute on function confirm_payment to authenticated;