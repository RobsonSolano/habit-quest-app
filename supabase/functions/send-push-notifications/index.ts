// @ts-ignore - Deno types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - ESM types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Declaração global do Deno para TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send'

interface PushNotificationPayload {
  title: string
  body: string
  data?: Record<string, any>
  sound?: string
  priority?: 'default' | 'normal' | 'high'
  channelId?: string
}

interface ExpoPushMessage {
  to: string
  sound: string
  title: string
  body: string
  data?: Record<string, any>
  priority?: 'default' | 'normal' | 'high'
  channelId?: string
}

interface Profile {
  id: string
  push_token: string | null
}

serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse do body
    const { reminderType, userIds } = await req.json()

    // Tipos de lembretes disponíveis
    const reminderTypes: Record<string, PushNotificationPayload> = {
      'streak_18h': {
        title: '🔥 Não esqueça sua ofensiva!',
        body: 'Ainda dá tempo de manter sua sequência hoje. Vamos lá!',
        sound: 'default',
        priority: 'high',
        channelId: 'streak',
      },
      'streak_21h': {
        title: '⚠️ Última chamada para sua ofensiva!',
        body: 'Faltam apenas 3 horas! Complete seus hábitos antes da meia-noite!',
        sound: 'default',
        priority: 'high',
        channelId: 'streak',
      },
      'streak_23h': {
        title: '🚨 ÚLTIMA CHANCE! Sua ofensiva vai zerar!',
        body: 'Restam menos de 60 minutos! Não perca sua sequência agora!',
        sound: 'default',
        priority: 'high',
        channelId: 'streak',
      },
      'daily': {
        title: '🎯 Hora dos hábitos!',
        body: 'Não esqueça de completar seus hábitos hoje!',
        sound: 'default',
        priority: 'high',
        channelId: 'habits',
      },
    }

    const notification = reminderTypes[reminderType]
    if (!notification) {
      return new Response(
        JSON.stringify({ error: `Invalid reminderType: ${reminderType}` }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Buscar tokens de push dos usuários
    let query = supabase
      .from('profiles')
      .select('id, push_token')
      .not('push_token', 'is', null)

    // Se userIds for fornecido, filtrar por esses usuários
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      query = query.in('id', userIds)
    }

    const { data: profiles, error: queryError } = await query

    if (queryError) {
      console.error('Error fetching push tokens:', queryError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens', details: queryError.message }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users with push tokens found',
          sent: 0 
        }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Preparar mensagens para o Expo Push API
    const messages: ExpoPushMessage[] = (profiles as Profile[])
      .filter((profile: Profile) => profile.push_token !== null && profile.push_token !== undefined)
      .map((profile: Profile) => ({
        to: profile.push_token!, // Non-null assertion já que filtramos acima
        sound: notification.sound || 'default',
        title: notification.title,
        body: notification.body,
        data: {
          ...notification.data,
          userId: profile.id,
          reminderType,
        },
        priority: notification.priority || 'high',
        channelId: notification.channelId,
      }))

    // Enviar notificações via Expo Push API
    const response = await fetch(EXPO_PUSH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Expo Push API error:', result)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send push notifications', 
          details: result 
        }),
        { 
          status: response.status,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Expo retorna um array com status de cada notificação
    const successCount = Array.isArray(result.data) 
      ? result.data.filter((r: any) => r.status === 'ok').length 
      : 0

    return new Response(
      JSON.stringify({ 
        success: true,
        sent: successCount,
        total: messages.length,
        reminderType,
        details: result,
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

