# 🔧 Correção: Problema de Onboarding (Ficha Técnica)

## Problema

Quando o aluno finaliza a ficha técnica no onboarding, a tela carrega, carrega e volta para a tela de login.

## Causa Raiz

1. **Políticas RLS não configuradas** - Supabase está bloqueando o INSERT/UPDATE na tabela `user_profiles_extended`
2. **Fluxo de erro inadequado** - O código tentava fazer UPDATE primeiro, depois INSERT, causando problemas
3. **Logout acidental** - Após salvar, o `fetchUser()` podia estar desconectando o usuário

## ✅ Correções Aplicadas

### 1. **Melhorias no TypeScript** (OnboardingPage.tsx e authStore.ts)

- ✓ Refatorou o fluxo de salvamento para verificar se existe registro antes
- ✓ Melhorou tratamento de erros com mensagens mais claras
- ✓ Removeu `fetchUser()` que causava logout acidental
- ✓ Adicionou delay antes de navegar para dashboard
- ✓ authStore agora não desconecta por erro de perfil estendido

### 2. **Script SQL Melhorado** (FIX_ONBOARDING_RLS_V2.sql)

- ✓ Políticas RLS completas e testadas
- ✓ Suporta INSERT (necessário para onboarding)
- ✓ Suporta UPDATE (necessário para edições futuras)
- ✓ Suporta DELETE (para segurança)
- ✓ Permite trainers visualizarem perfis de alunos

## 📋 Como Corrigir

### Passo 1: Aplicar Script SQL no Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Vá para **SQL Editor**
3. Clique em **New Query**
4. Copie o conteúdo de **FIX_ONBOARDING_RLS_V2.sql**
5. Cole no editor
6. Clique em **Run** (ou Ctrl+Enter)
7. Aguarde completar

### Passo 2: Testar

1. Faça logout
2. Crie uma nova conta (Register)
3. Complete o onboarding
4. Verifique se vai para o dashboard sem voltar ao login

## 🐛 Se o Problema Ainda Existir

Verifique:

1. **Tabela `user_profiles_extended` existe?**

   ```sql
   select * from user_profiles_extended limit 1;
   ```

   Se der erro "relation does not exist", crie a tabela (execute SUPABASE_TABLES.sql)

2. **RLS foi ativado?**

   ```sql
   select relrowsecurity from pg_class where relname = 'user_profiles_extended';
   ```

   Deve retornar `true`

3. **Políticas foram criadas?**

   ```sql
   select policyname from pg_policies where tablename = 'user_profiles_extended';
   ```

   Deve listar as políticas que criamos

4. **O usuário está autenticado?**
   Abra DevTools (F12) > Console e verifique se há erros de autenticação

## 📊 Checklist de Validação

- [ ] Script SQL foi executado com sucesso
- [ ] Políticas aparecem em `pg_policies`
- [ ] Novo aluno consegue fazer onboarding sem volta ao login
- [ ] Dados aparecem na tabela `user_profiles_extended`
- [ ] Trainer consegue visualizar perfil do aluno

## 💡 Notas Técnicas

- A tabela `user_profiles_extended` deve ter uma coluna `user_id` que referencia `auth.users.id`
- RLS (Row Level Security) é ativado por política, não por padrão
- Cada operação (SELECT, INSERT, UPDATE, DELETE) precisa de sua própria política
- `auth.uid()` retorna o ID do usuário autenticado no Supabase

## ❓ Dúvidas?

Se o problema persistir, colete:

1. Print da tela com o erro
2. Abra DevTools (F12) > Console
3. Tente novamente e copie a mensagem de erro
4. Verifique os logs do Supabase em Dashboard > Edge Functions > Logs
