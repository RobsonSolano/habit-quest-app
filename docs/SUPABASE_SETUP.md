# 🗄️ Configurar Supabase - Guia Completo

Passo a passo detalhado para configurar o Supabase para o HabitQuest.

---

## 📋 O que é o Supabase?

Supabase é um "Firebase open-source" que oferece:
- **PostgreSQL** - Banco de dados relacional
- **Auth** - Autenticação (email, Google, Apple, etc)
- **Storage** - Armazenamento de arquivos
- **Realtime** - Atualizações em tempo real
- **Edge Functions** - Serverless functions

**Plano gratuito inclui:**
- 500MB de banco de dados
- 1GB de storage
- 50.000 usuários ativos/mês
- Sem limite de requests

---

## 🚀 Passo 1: Criar Conta

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **"Start your project"**
3. Faça login com **GitHub** (recomendado) ou email
4. Aceite os termos

---

## 🆕 Passo 2: Criar Novo Projeto

1. No dashboard, clique em **"New Project"**
2. Selecione sua organização (ou crie uma)
3. Preencha os campos:

| Campo | Valor |
|-------|-------|
| **Name** | `habitquest` (ou outro nome) |
| **Database Password** | Crie uma senha forte (guarde!) |
| **Region** | `South America (São Paulo)` ou mais próxima |
| **Pricing Plan** | Free |

4. Clique em **"Create new project"**
5. **Aguarde ~2 minutos** até o projeto ser provisionado

---

## 🔑 Passo 3: Obter as Chaves de API

Após o projeto ser criado:

1. No menu lateral, vá em **Settings** (ícone de engrenagem)
2. Clique em **API**
3. Você verá duas seções importantes:

### Project URL
```
https://abcdefghijk.supabase.co
```
Copie este valor → será o `EXPO_PUBLIC_SUPABASE_URL`

### Project API Keys

| Chave | Uso |
|-------|-----|
| **anon public** | Usar no app (seguro para expor) |
| **service_role** | ⚠️ NUNCA expor! Só para backend |

Copie a chave **anon public** → será o `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## 📊 Passo 4: Criar as Tabelas (Schema)

### 4.1 Abrir o SQL Editor

1. No menu lateral, clique em **SQL Editor**
2. Clique em **"New query"**

### 4.2 Copiar e Executar o Schema

1. Abra o arquivo `supabase-schema.sql` do projeto
2. **Selecione TODO o conteúdo** (Ctrl+A / Cmd+A)
3. **Copie** (Ctrl+C / Cmd+C)
4. **Cole** no SQL Editor do Supabase (Ctrl+V / Cmd+V)
5. Clique no botão **"Run"** (ou Ctrl+Enter)

### 4.3 Verificar Sucesso

Você deve ver:
```
Success. No rows returned.
```

Isso é **normal** - significa que o schema foi criado!

### 4.4 Conferir as Tabelas

1. No menu lateral, vá em **Table Editor**
2. Você deve ver estas tabelas:
   - `profiles` - Dados dos usuários
   - `habits` - Hábitos
   - `habit_completions` - Histórico de completados
   - `user_stats` - XP, níveis, pontos
   - `achievements` - Conquistas
   - `friendships` - Amizades

---

## 🔐 Passo 5: Verificar Row Level Security (RLS)

O schema já configura RLS, mas vamos conferir:

1. Vá em **Authentication** > **Policies**
2. Ou clique em uma tabela > **Policies** (aba)
3. Cada tabela deve ter políticas como:
   - "Users can view own profile"
   - "Users can update own profile"
   - etc.

**RLS garante que cada usuário só acessa seus próprios dados!**

---

## ✉️ Passo 6: Configurar Email Templates (Opcional)

Para personalizar emails de confirmação:

1. Vá em **Authentication** > **Email Templates**
2. Personalize os templates:
   - **Confirm signup** - Email de confirmação de conta
   - **Reset password** - Recuperação de senha
   - **Magic link** - Login sem senha

### Exemplo de template personalizado:

**Subject:**
```
Bem-vindo ao HabitQuest! 🎯
```

**Body:**
```html
<h2>Olá!</h2>
<p>Obrigado por se cadastrar no HabitQuest!</p>
<p>Clique no link abaixo para confirmar seu email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar Email</a></p>
<p>Bons hábitos! 🔥</p>
```

---

## ⚙️ Passo 7: Configurações de Auth

### 7.1 Confirmar Email (desenvolvimento)

Para **desabilitar** confirmação de email durante desenvolvimento:

1. Vá em **Authentication** > **Providers** > **Email**
2. Desmarque **"Confirm email"**
3. Clique em **Save**

⚠️ **Para produção:** Mantenha habilitado!

### 7.2 Configurar Site URL

1. Vá em **Authentication** > **URL Configuration**
2. Configure:
   - **Site URL**: `habitquest://` (deep link do app)
   - **Redirect URLs**: Adicione URLs de callback

---

## 📱 Passo 8: Criar o arquivo .env no Projeto

Na raiz do projeto React Native, crie o arquivo `.env`:

```bash
# No terminal
touch .env
```

Adicione o conteúdo:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Substitua pelos valores que você copiou no Passo 3!**

---

## ✅ Passo 9: Testar a Conexão

### 9.1 Rodar o App

```bash
npm start
```

### 9.2 Criar uma Conta

1. Na tela de login, clique em "Cadastrar"
2. Preencha nome, email e senha
3. Clique em "Criar Conta"

### 9.3 Verificar no Supabase

1. Vá em **Table Editor** > **profiles**
2. Você deve ver o usuário criado!
3. Verifique também:
   - **user_stats** - Deve ter stats iniciais
   - **achievements** - Deve ter conquistas padrão
   - **habits** - Deve ter 3 hábitos padrão

---

## 🔍 Passo 10: Monitorar o Banco

### Logs de Requisições

1. Vá em **Logs** > **API**
2. Veja todas as requisições feitas ao Supabase

### Logs de Auth

1. Vá em **Logs** > **Auth**
2. Veja logins, signups, erros de autenticação

### Database Backups

1. Vá em **Settings** > **Database**
2. Configure backups automáticos (no plano pago)

---

## 🐛 Troubleshooting

### Erro: "relation does not exist"

**Causa:** Schema não foi executado corretamente.

**Solução:**
1. Vá em SQL Editor
2. Execute o schema novamente
3. Se der erro, verifique se já existe e delete:
```sql
DROP TABLE IF EXISTS public.profiles CASCADE;
-- Repita para outras tabelas
```

### Erro: "permission denied for table"

**Causa:** RLS bloqueando acesso.

**Solução:**
1. Verifique se as policies existem
2. Verifique se o usuário está autenticado
3. Teste desabilitando RLS temporariamente:
```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

### Erro: "Invalid API key"

**Causa:** Chave incorreta no .env.

**Solução:**
1. Copie novamente do Supabase Dashboard
2. Verifique se não há espaços extras
3. Reinicie o app: `npm start --clear`

### Erro: "JWT expired"

**Causa:** Sessão expirada.

**Solução:** O app deve renovar automaticamente. Se persistir:
1. Faça logout
2. Faça login novamente

### Dados não aparecem

**Causa:** RLS ou filtros incorretos.

**Solução:**
1. Verifique no Supabase se os dados existem
2. Verifique as policies RLS
3. Teste a query no SQL Editor:
```sql
SELECT * FROM profiles WHERE id = 'USER_ID';
```

---

## 📊 Queries Úteis

### Ver todos os usuários
```sql
SELECT * FROM profiles ORDER BY created_at DESC;
```

### Ver hábitos de um usuário
```sql
SELECT * FROM habits WHERE user_id = 'UUID_DO_USUARIO';
```

### Ver completados hoje
```sql
SELECT * FROM habit_completions 
WHERE completed_date = CURRENT_DATE;
```

### Ver ranking de ofensiva
```sql
SELECT name, username, current_streak 
FROM profiles 
WHERE is_public = true
ORDER BY current_streak DESC 
LIMIT 10;
```

### Resetar dados de um usuário (CUIDADO!)
```sql
-- Deletar completados
DELETE FROM habit_completions WHERE user_id = 'UUID';

-- Resetar stats
UPDATE user_stats 
SET level = 1, xp = 0, total_points = 0, total_habits_completed = 0
WHERE user_id = 'UUID';

-- Resetar ofensiva
UPDATE profiles 
SET current_streak = 0, last_activity_date = NULL
WHERE id = 'UUID';
```

---

## 🔄 Atualizando o Schema

Se precisar adicionar novas colunas/tabelas:

1. Crie um novo arquivo SQL com as alterações
2. Execute no SQL Editor
3. Atualize os tipos em `src/types/database.ts`

### Exemplo: Adicionar coluna
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';
```

---

## 📚 Referências

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

## 🆘 Suporte

- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

---

**Pronto! Seu Supabase está configurado! 🎉**

