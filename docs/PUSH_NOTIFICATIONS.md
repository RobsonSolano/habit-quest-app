# 🔔 Configurar Push Notifications

Guia para adicionar notificações push para lembretes de hábitos.

---

## 📋 Pré-requisitos

- Conta Expo (gratuita)
- Para iOS: Conta Apple Developer ($99/ano)
- Para Android: Projeto no Firebase (gratuito)

---

## 📦 Passo 1: Instalar Dependências

```bash
npx expo install expo-notifications expo-device expo-constants
```

---

## 💻 Passo 2: Implementar o Serviço

### 2.1 Criar serviço de notificações

Crie `src/lib/notifications.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configurar como as notificações aparecem
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  // Registrar para push notifications
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Verificar/pedir permissão
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted for push notifications');
      return null;
    }

    // Configurar canal para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('habits', {
        name: 'Lembretes de Hábitos',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B5CF6',
      });
    }

    // Obter token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    return token.data;
  },

  // Salvar token no banco
  async savePushToken(userId: string, token: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);

    if (error) {
      console.error('Error saving push token:', error);
    }
  },

  // Agendar lembrete diário
  async scheduleDailyReminder(hour: number, minute: number): Promise<string> {
    // Cancelar lembretes anteriores
    await this.cancelAllReminders();

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎯 Hora dos hábitos!',
        body: 'Não esqueça de completar seus hábitos hoje!',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    return id;
  },

  // Lembrete quando a ofensiva está em risco
  async scheduleStreakReminder(): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Sua ofensiva está em risco!',
        body: 'Complete seus hábitos antes da meia-noite para não perder!',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        hour: 21, // 9 PM
        minute: 0,
        repeats: true,
      },
    });

    return id;
  },

  // Cancelar todos os lembretes
  async cancelAllReminders(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  // Cancelar lembrete específico
  async cancelReminder(id: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(id);
  },

  // Obter lembretes agendados
  async getScheduledReminders(): Promise<Notifications.NotificationRequest[]> {
    return Notifications.getAllScheduledNotificationsAsync();
  },

  // Enviar notificação local imediata
  async sendLocalNotification(title: string, body: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null, // Imediato
    });
  },
};
```

### 2.2 Criar hook para notificações

Crie `src/hooks/useNotifications.ts`:

```typescript
import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '@/lib/notifications';
import { useAuth } from '@/contexts/AuthContext';

export const useNotifications = () => {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Registrar para notificações
    notificationService.registerForPushNotifications().then(token => {
      if (token) {
        setExpoPushToken(token);
        if (user) {
          notificationService.savePushToken(user.id, token);
        }
      }
    });

    // Listener para notificações recebidas
    notificationListener.current = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
      }
    );

    // Listener para interação com notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      response => {
        console.log('Notification response:', response);
        // Navegar para a tela apropriada
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user]);

  return {
    expoPushToken,
    scheduleDailyReminder: notificationService.scheduleDailyReminder,
    scheduleStreakReminder: notificationService.scheduleStreakReminder,
    cancelAllReminders: notificationService.cancelAllReminders,
  };
};
```

### 2.3 Usar no App

No `App.tsx`:

```typescript
import { useNotifications } from '@/hooks/useNotifications';

// Dentro do componente App:
useNotifications();
```

---

## 🔧 Passo 3: Configurar app.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#8B5CF6",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "android": {
      "useNextNotificationsApi": true
    }
  }
}
```

---

## ☁️ Passo 4: Configurar Push Notifications (Produção)

### Para iOS (APNs)

1. No Apple Developer Portal, vá em **Keys** > **+**
2. Marque ✅ **Apple Push Notifications service (APNs)**
3. Baixe o arquivo `.p8`
4. No Expo Dashboard, vá em **Credentials** > **iOS**
5. Configure o APNs Key

### Para Android (FCM)

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Crie ou selecione um projeto
3. Vá em **Project Settings** > **Cloud Messaging**
4. Copie a **Server Key**
5. No Expo Dashboard, vá em **Credentials** > **Android**
6. Adicione a FCM Server Key

---

## 🗄️ Passo 5: Atualizar Schema (para salvar token)

Execute no Supabase SQL Editor:

```sql
-- Adicionar coluna para push token
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Índice para busca
CREATE INDEX IF NOT EXISTS profiles_push_token_idx 
ON public.profiles(push_token) 
WHERE push_token IS NOT NULL;
```

---

## 📱 Passo 6: Criar Tela de Configurações

Crie `src/screens/NotificationSettingsScreen.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNotifications } from '@/hooks/useNotifications';
import { Card } from '@/components/ui/Card';

const NotificationSettingsScreen = () => {
  const { scheduleDailyReminder, scheduleStreakReminder, cancelAllReminders } = useNotifications();
  const [dailyEnabled, setDailyEnabled] = useState(false);
  const [streakEnabled, setStreakEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(9);

  const handleDailyToggle = async (value: boolean) => {
    setDailyEnabled(value);
    if (value) {
      await scheduleDailyReminder(reminderHour, 0);
    } else {
      await cancelAllReminders();
      if (streakEnabled) {
        await scheduleStreakReminder();
      }
    }
  };

  const handleStreakToggle = async (value: boolean) => {
    setStreakEnabled(value);
    if (value) {
      await scheduleStreakReminder();
    }
    // Re-agendar lembretes
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-2xl font-bold text-foreground mb-6">
          Notificações
        </Text>

        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="font-semibold text-foreground">
                Lembrete diário
              </Text>
              <Text className="text-sm text-muted-foreground">
                Receba um lembrete às {reminderHour}h
              </Text>
            </View>
            <Switch
              value={dailyEnabled}
              onValueChange={handleDailyToggle}
              trackColor={{ true: '#8B5CF6' }}
            />
          </View>
        </Card>

        <Card>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="font-semibold text-foreground">
                Alerta de ofensiva
              </Text>
              <Text className="text-sm text-muted-foreground">
                Aviso às 21h se não completou os hábitos
              </Text>
            </View>
            <Switch
              value={streakEnabled}
              onValueChange={handleStreakToggle}
              trackColor={{ true: '#8B5CF6' }}
            />
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
};

export default NotificationSettingsScreen;
```

---

## ✅ Testar

### Local (Expo Go)
```bash
npm start
# Agendar um lembrete e esperar
```

### Produção
Use a [Expo Push Notifications Tool](https://expo.dev/notifications) para enviar notificações de teste.

---

## 🐛 Troubleshooting

### Notificação não aparece
- Verifique se está em dispositivo físico
- Verifique se as permissões foram concedidas
- No Android, verifique o canal de notificação

### Token não gerado
- Certifique-se de que `projectId` está configurado
- Verifique se está usando Expo SDK 48+

---

## 📚 Referências

- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Push Notifications Setup](https://docs.expo.dev/push-notifications/overview/)

