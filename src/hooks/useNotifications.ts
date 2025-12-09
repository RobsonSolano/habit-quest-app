import { useEffect, useRef, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '@/lib/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { completionService } from '@/lib/storage';

export const useNotifications = () => {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [streakRemindersEnabled, setStreakRemindersEnabled] = useState(true);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Verificar se todos os hábitos foram completados hoje
  const checkIfAllCompletedToday = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    try {
      return await completionService.checkAllCompletedToday(user.id);
    } catch {
      return false;
    }
  }, [user]);

  // Configurar lembretes baseado no status de completude
  const setupStreakReminders = useCallback(async () => {
    if (!notificationService.isAvailable()) return;
    
    if (!streakRemindersEnabled) {
      await notificationService.cancelAllReminders();
      return;
    }

    const allCompleted = await checkIfAllCompletedToday();
    
    if (allCompleted) {
      // Já completou tudo hoje - não precisa de lembretes hoje
      // Mas mantém agendado para o dia seguinte (DAILY trigger cuida disso)
      // Não fazemos nada aqui - as notificações já estão agendadas como DAILY
    } else {
      // Não completou ainda - garante que os lembretes estão agendados
      const scheduled = await notificationService.getScheduledReminders();
      if (scheduled.length === 0) {
        // Nenhum lembrete agendado, agenda agora
        await notificationService.scheduleAllStreakReminders();
      }
    }
  }, [streakRemindersEnabled, checkIfAllCompletedToday]);

  useEffect(() => {
    // Registrar para notificações (silenciosamente falha no Expo Go)
    notificationService.registerForPushNotifications().then(token => {
      if (token) {
        setExpoPushToken(token);
        if (user) {
          notificationService.savePushToken(user.id, token);
        }
      }
    }).catch(() => {
      // Notifications not available
    });

    // Configurar lembretes de ofensiva
    if (user) {
      setupStreakReminders().catch(() => {});
    }

    // Listeners (podem falhar no Expo Go)
    try {
      notificationListener.current = Notifications.addNotificationReceivedListener(
        notification => {
          console.log('Notification received:', notification);
        }
      );

      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        response => {
          console.log('Notification response:', response);
        }
      );
    } catch {
      // Notifications not available in Expo Go
    }

    return () => {
      try {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [user, setupStreakReminders]);

  // Atualizar lembretes quando hábito for completado
  const onHabitCompleted = useCallback(async () => {
    // Não cancela as notificações - elas são DAILY e vão continuar para os próximos dias
    // O usuário vai receber lembretes amanhã normalmente
    // Se quiser cancelar só as de hoje, seria muito complexo (precisaria calcular horários)
    
    // Apenas log para debug
    console.log('All habits completed today!');
  }, []);

  // Atualizar lembretes quando hábito for desmarcado
  const onHabitUncompleted = useCallback(async () => {
    if (streakRemindersEnabled) {
      // Garante que os lembretes estão agendados
      const scheduled = await notificationService.getScheduledReminders();
      if (scheduled.length === 0) {
        await notificationService.scheduleAllStreakReminders();
      }
    }
  }, [streakRemindersEnabled]);

  return {
    expoPushToken,
    streakRemindersEnabled,
    setStreakRemindersEnabled,
    onHabitCompleted,
    onHabitUncompleted,
    scheduleDailyReminder: notificationService.scheduleDailyReminder,
    scheduleAllStreakReminders: notificationService.scheduleAllStreakReminders,
    cancelAllReminders: notificationService.cancelAllReminders,
    sendAchievementNotification: notificationService.sendAchievementNotification,
    sendLevelUpNotification: notificationService.sendLevelUpNotification,
    sendStreakMilestoneNotification: notificationService.sendStreakMilestoneNotification,
  };
};

