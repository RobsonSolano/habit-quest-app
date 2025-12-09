import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Flag para verificar se notificações estão disponíveis
let notificationsAvailable = true;

// Configurar como as notificações aparecem (silenciosamente falha no Expo Go)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch {
  notificationsAvailable = false;
}

export const notificationService = {
  // Verificar se notificações estão disponíveis
  isAvailable(): boolean {
    return notificationsAvailable;
  },

  // Registrar para push notifications
  async registerForPushNotifications(): Promise<string | null> {
    if (!notificationsAvailable) {
      console.log('Notifications not available in Expo Go (SDK 53+)');
      return null;
    }

    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    try {
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

        await Notifications.setNotificationChannelAsync('streak', {
          name: 'Alertas de Ofensiva',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#F59E0B',
        });
      }

      // Obter token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      return token.data;
    } catch {
      // Notifications not supported (expected in Expo Go SDK 53+)
      notificationsAvailable = false;
      return null;
    }
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
  async scheduleDailyReminder(hour: number, minute: number): Promise<string | null> {
    if (!notificationsAvailable) return null;
    
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 Hora dos hábitos!',
          body: 'Não esqueça de completar seus hábitos hoje!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          channelId: 'habits',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
      return id;
    } catch (error) {
      console.log('Could not schedule notification:', error);
      return null;
    }
  },

  // ============================================
  // LEMBRETES DE OFENSIVA (STREAK)
  // ============================================

  // Lembrete às 18h - "Não esqueça sua ofensiva!"
  async scheduleStreakReminder18h(): Promise<string | null> {
    if (!notificationsAvailable) return null;
    
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Não esqueça sua ofensiva!',
          body: 'Ainda dá tempo de manter sua sequência hoje. Vamos lá!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          channelId: 'streak',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 18,
          minute: 0,
        },
      });
      return id;
    } catch {
      return null;
    }
  },

  // Lembrete às 21h - "Última chamada!"
  async scheduleStreakReminder21h(): Promise<string | null> {
    if (!notificationsAvailable) return null;
    
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Última chamada para sua ofensiva!',
          body: 'Faltam apenas 3 horas! Complete seus hábitos antes da meia-noite!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          channelId: 'streak',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 21,
          minute: 0,
        },
      });
      return id;
    } catch {
      return null;
    }
  },

  // Lembrete às 23h - "Última chance!"
  async scheduleStreakReminder23h(): Promise<string | null> {
    if (!notificationsAvailable) return null;
    
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 ÚLTIMA CHANCE! Sua ofensiva vai zerar!',
          body: 'Restam menos de 60 minutos! Não perca sua sequência agora!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          channelId: 'streak',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 23,
          minute: 0,
        },
      });
      return id;
    } catch {
      return null;
    }
  },

  // Agendar todos os lembretes de ofensiva
  async scheduleAllStreakReminders(): Promise<void> {
    if (!notificationsAvailable) return;
    
    // Primeiro cancela as existentes para evitar duplicatas
    await this.cancelAllReminders();
    
    await this.scheduleStreakReminder18h();
    await this.scheduleStreakReminder21h();
    await this.scheduleStreakReminder23h();
  },

  // Cancelar lembretes de hoje e re-agendar para amanhã
  async cancelTodayAndRescheduleForTomorrow(): Promise<void> {
    if (!notificationsAvailable) return;
    
    try {
      // Cancela todas as notificações agendadas
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Re-agenda para amanhã (as notificações DAILY vão disparar no próximo horário disponível)
      // Se já passou das 23h, as notificações serão para amanhã automaticamente
      // Se ainda não passou, precisamos agendar manualmente para amanhã
      
      const now = new Date();
      const currentHour = now.getHours();
      
      // Só re-agenda os horários que ainda não passaram para amanhã
      // Os que já passaram serão agendados para o próximo dia automaticamente pelo DAILY
      
      // Agendar todas novamente - o DAILY trigger vai pegar o próximo horário disponível
      await this.scheduleStreakReminder18h();
      await this.scheduleStreakReminder21h();
      await this.scheduleStreakReminder23h();
      
    } catch {
      // Ignore
    }
  },

  // Cancelar todos os lembretes
  async cancelAllReminders(): Promise<void> {
    if (!notificationsAvailable) return;
    
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      // Ignore
    }
  },

  // Cancelar lembrete específico
  async cancelReminder(id: string): Promise<void> {
    if (!notificationsAvailable) return;
    
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // Ignore
    }
  },

  // Obter lembretes agendados
  async getScheduledReminders(): Promise<Notifications.NotificationRequest[]> {
    if (!notificationsAvailable) return [];
    
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch {
      return [];
    }
  },

  // Enviar notificação local imediata
  async sendLocalNotification(title: string, body: string): Promise<void> {
    if (!notificationsAvailable) return;
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null, // Imediato
      });
    } catch {
      // Ignore
    }
  },

  // Notificação de conquista desbloqueada
  async sendAchievementNotification(achievementTitle: string): Promise<void> {
    if (!notificationsAvailable) return;
    await this.sendLocalNotification(
      '🏆 Conquista Desbloqueada!',
      achievementTitle
    );
  },

  // Notificação de level up
  async sendLevelUpNotification(newLevel: number): Promise<void> {
    if (!notificationsAvailable) return;
    await this.sendLocalNotification(
      '🎉 Subiu de Nível!',
      `Parabéns! Você alcançou o nível ${newLevel}!`
    );
  },

  // Notificação de ofensiva batida
  async sendStreakMilestoneNotification(days: number): Promise<void> {
    if (!notificationsAvailable) return;
    
    const milestones: Record<number, string> = {
      7: '🔥 1 semana de ofensiva! Você está on fire!',
      14: '🔥🔥 2 semanas! Nada te para!',
      30: '👑 1 MÊS DE OFENSIVA! Você é incrível!',
      50: '💎 50 dias! Lendário!',
      100: '🏆 100 DIAS! Você é uma máquina!',
      365: '🌟 1 ANO! Você é uma inspiração!',
    };

    const message = milestones[days];
    if (message) {
      await this.sendLocalNotification('Ofensiva Épica!', message);
    }
  },
};

