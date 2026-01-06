# 🔔 Edge Function: Send Push Notifications

Esta Edge Function envia push notifications para usuários usando o Expo Push Notification Service.

## 📋 Como Funciona

1. Recebe um `reminderType` (tipo de lembrete) e opcionalmente `userIds` (array de IDs de usuários)
2. Busca os tokens de push dos usuários no banco de dados
3. Envia notificações via Expo Push API

## 🚀 Deploy

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Login
supabase login

# Linkar ao projeto
supabase link --project-ref seu-project-ref

# Deploy da função
supabase functions deploy send-push-notifications
```

## 📝 Tipos de Lembretes Disponíveis

- `streak_18h` - Lembrete às 18h sobre ofensiva
- `streak_21h` - Lembrete às 21h (última chamada)
- `streak_23h` - Lembrete às 23h (última chance)
- `daily` - Lembrete diário de hábitos

## 🔧 Como Usar

### Via HTTP Request

```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/send-push-notifications \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "reminderType": "streak_18h"
  }'
```

### Para usuários específicos

```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/send-push-notifications \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "reminderType": "streak_21h",
    "userIds": ["user-id-1", "user-id-2"]
  }'
```

## ⏰ Configurar Cron Jobs

### Opção 1: Supabase pg_cron (Recomendado)

Execute no SQL Editor do Supabase:

```sql
-- Instalar extensão pg_cron (se ainda não estiver instalada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar lembrete às 18h
SELECT cron.schedule(
  'streak-reminder-18h',
  '0 18 * * *', -- Todo dia às 18:00
  $$
  SELECT
    net.http_post(
      url := 'https://seu-projeto.supabase.co/functions/v1/send-push-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'reminderType', 'streak_18h'
      )
    ) AS request_id;
  $$
);

-- Agendar lembrete às 21h
SELECT cron.schedule(
  'streak-reminder-21h',
  '0 21 * * *', -- Todo dia às 21:00
  $$
  SELECT
    net.http_post(
      url := 'https://seu-projeto.supabase.co/functions/v1/send-push-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'reminderType', 'streak_21h'
      )
    ) AS request_id;
  $$
);

-- Agendar lembrete às 23h
SELECT cron.schedule(
  'streak-reminder-23h',
  '0 23 * * *', -- Todo dia às 23:00
  $$
  SELECT
    net.http_post(
      url := 'https://seu-projeto.supabase.co/functions/v1/send-push-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'reminderType', 'streak_23h'
      )
    ) AS request_id;
  $$
);
```

**⚠️ IMPORTANTE**: Para usar `net.http_post`, você precisa instalar a extensão `pg_net`:

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

E configurar a service role key:

```sql
-- Configurar service role key (substitua pela sua chave)
ALTER DATABASE postgres SET app.settings.service_role_key = 'sua-service-role-key-aqui';
```

### Opção 2: Serviço Externo (Vercel Cron, Railway, etc.)

Crie um endpoint simples que chama a Edge Function:

```typescript
// api/cron/notifications.ts (Vercel)
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const reminderType = req.query.type // 'streak_18h', 'streak_21h', etc.
  
  await fetch('https://seu-projeto.supabase.co/functions/v1/send-push-notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reminderType }),
  })

  res.json({ success: true })
}
```

E configure no `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/notifications?type=streak_18h",
      "schedule": "0 18 * * *"
    },
    {
      "path": "/api/cron/notifications?type=streak_21h",
      "schedule": "0 21 * * *"
    },
    {
      "path": "/api/cron/notifications?type=streak_23h",
      "schedule": "0 23 * * *"
    }
  ]
}
```

## 🧪 Testar Localmente

```bash
# Iniciar Supabase local
supabase start

# Testar a função
curl -X POST http://localhost:54321/functions/v1/send-push-notifications \
  -H "Authorization: Bearer ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"reminderType": "streak_18h"}'
```

## 🔐 Variáveis de Ambiente

A função usa automaticamente:
- `SUPABASE_URL` - URL do projeto (automático)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (automático)

## 📚 Referências

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [pg_cron](https://github.com/citusdata/pg_cron)

