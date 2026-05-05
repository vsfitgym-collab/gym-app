# 🔧 Correção: Dashboard do Aluno Não Mostra Treinos

## Problema
Após o personal trainer atribuir um treino a um aluno, o dashboard do aluno não mostra:
- ✗ Treinos atribuídos
- ✗ Próximos treinos
- ✗ Dados reais de progresso

## Causa Raiz
1. **Políticas RLS deficientes** nas tabelas `workout_assignments`, `workouts` e `workout_exercises`
2. **Dashboard tentava buscar de tabela inexistente** (`user_stats`)
3. **Relacionamentos entre tabelas não estavam com RLS correto**

## ✅ Correções Aplicadas

### 1. **[DashboardPage.tsx](src/pages/student/DashboardPage.tsx)**
- ✓ Removido fetch de `user_stats` (tabela inexistente)
- ✓ Simplificado para usar apenas dados reais: `workout_assignments`, `workouts`, `exercises`
- ✓ Melhor tratamento de erros com logs informativos
- ✓ Cálculo correto de estatísticas a partir dos dados

### 2. **Script SQL: [FIX_WORKOUT_ASSIGNMENTS_RLS.sql](FIX_WORKOUT_ASSIGNMENTS_RLS.sql)** ⚠️ **CRÍTICO**
Adiciona/corrige políticas RLS para 3 tabelas:
- ✓ `workout_assignments` - Alunos veem seus treinos, trainers veem todos
- ✓ `workouts` - Trainers gerenciam, alunos veem o que foi atribuído
- ✓ `workout_exercises` - Ambos podem visualizar exercícios de treinos permitidos

## 🚀 Próximos Passos

### 1. Aplicar Script SQL
1. Abra [Supabase Dashboard](https://app.supabase.com)
2. SQL Editor → New Query
3. Copie todo o conteúdo de `FIX_WORKOUT_ASSIGNMENTS_RLS.sql`
4. Run (Ctrl+Enter)
5. Verifique se as 9 políticas foram criadas com sucesso

### 2. Testar no App
1. **Trainer**: Crie ou selecione um treino
2. **Trainer**: Atribua aos alunos (StudentsPage)
3. **Aluno**: Faça login
4. **Aluno**: Vá para Dashboard
5. Deverá mostrar:
   - ✓ "Próximo Treino" com nome do treino
   - ✓ "Próximos Treinos" listados
   - ✓ Dados reais de exercícios, duração, dificuldade

## 📊 Validação

Após aplicar as políticas, execute no Supabase SQL Editor:

```sql
-- Verificar políticas de workout_assignments
SELECT policyname FROM pg_policies 
WHERE tablename = 'workout_assignments' 
ORDER BY policyname;
```

Deve retornar:
- Users can view own assignments
- Trainers can view all assignments
- Trainers can insert assignments
- Trainers can update assignments
- Users can update own assignment status

## 🐛 Se o Problema Persistir

Verifique:

1. **Treinos foram criados?**
   ```sql
   SELECT id, title, trainer_id FROM workouts LIMIT 5;
   ```

2. **Atribuições foram criadas?**
   ```sql
   SELECT id, workout_id, user_id, status FROM workout_assignments LIMIT 5;
   ```

3. **Aluno pode acessar seus treinos?**
   Abra DevTools → Console e procure por erros de autenticação

4. **Política RLS retornando dados?**
   ```sql
   -- Como trainer, execute:
   SELECT * FROM workout_assignments WHERE user_id = '<aluno_uuid>' LIMIT 1;
   
   -- Como aluno, execute:
   SELECT * FROM workout_assignments LIMIT 1;
   ```

## 💡 Notas Técnicas

- As políticas RLS são **por operação**: SELECT, INSERT, UPDATE, DELETE
- Cada política precisa de `USING` (para leitura/delete) ou `WITH CHECK` (para escrita)
- `auth.uid()` sempre retorna o ID do usuário autenticado
- Relacionamentos precisam de políticas em cascata para funcionar

## ❓ Dúvidas?

Se tiver dúvidas ou o problema continuar, coloque prints de:
1. Dashboard carregando (com DevTools → Network)
2. Erro no console (se houver)
3. Confirme que os treinos foram atribuídos em "Students" do trainer
