import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Calendar, 
  LogOut, 
  Sparkles, 
  Flame,
} from 'lucide-react-native';
import { DeletableHabitCard } from '@/components/habits/DeletableHabitCard';
import { UserProfile } from '@/components/habits/UserProfile';
import { AddHabitModal, AddHabitButton } from '@/components/habits/AddHabitModal';
import { HabitWithCompletion, UserStatsUI, mapStatsToUI } from '@/types/habit';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  habitService, 
  completionService, 
  statsService, 
  achievementService,
  streakService,
  friendService,
} from '@/lib/storage';
import { Card } from '@/components/ui/Card';
import { analytics } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { showToast } from '@/lib/toast';

const IndexScreen = () => {
  const { user, profile, logout } = useAuth();
  const { 
    onHabitCompleted, 
    onHabitUncompleted,
    sendLevelUpNotification,
    sendStreakMilestoneNotification,
  } = useNotifications();
  const [habits, setHabits] = useState<HabitWithCompletion[]>([]);
  const [stats, setStats] = useState<UserStatsUI>({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    totalPoints: 0,
    longestStreak: 0,
  });
  const [currentStreak, setCurrentStreak] = useState(0);
  const [friendCount, setFriendCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) {
      logger.warn('IndexScreen', 'loadData called without user');
      return;
    }

    logger.log('IndexScreen', 'loadData started', { userId: user.id });

    try {
      // Check streak first (this may update it if broken)
      logger.log('IndexScreen', 'Checking streak', { userId: user.id });
      const streakResult = await streakService.check(user.id);
      logger.log('IndexScreen', 'Streak check result', streakResult);
      
      if (streakResult?.streakBroken) {
        logger.warn('IndexScreen', 'Streak broken', { 
          oldStreak: streakResult.oldStreak,
          currentStreak: streakResult.currentStreak 
        });
        showToast('error', '😢 Ofensiva perdida!', `Sua ofensiva de ${streakResult.oldStreak} dias foi zerada`);
      }

      // Load habits
      logger.log('IndexScreen', 'Loading habits', { userId: user.id });
      const userHabits = await habitService.getAll(user.id);
      logger.log('IndexScreen', 'Habits loaded', { count: userHabits.length });
      
      // Load today's completions ONLY
      const today = new Date().toISOString().split('T')[0];
      logger.log('IndexScreen', 'Loading today completions', { date: today });
      const todayCompletions = await completionService.getByDate(user.id, today);
      logger.log('IndexScreen', 'Today completions loaded', { 
        count: todayCompletions.length,
        completed: todayCompletions.filter(c => c.completed).length 
      });
      
      // Map habits with completion status (ONLY for today)
      const habitsWithCompletion: HabitWithCompletion[] = userHabits.map(habit => {
        const todayCompletion = todayCompletions.find(
          c => c.habit_id === habit.id && c.completed_date === today
        );
        const completedToday = todayCompletion?.completed === true;
        
        // Log apenas se houver diferença ou problema
        if (todayCompletion && !completedToday) {
          logger.warn('IndexScreen', 'Completion found but not marked as completed', {
            habitId: habit.id,
            completionId: todayCompletion.id
          });
        }
        
        return {
          ...habit,
          completedToday,
        };
      });
      
      setHabits(habitsWithCompletion);
      logger.log('IndexScreen', 'Habits state updated', { 
        total: habitsWithCompletion.length,
        completed: habitsWithCompletion.filter(h => h.completedToday).length 
      });

      // Load stats
      logger.log('IndexScreen', 'Loading stats', { userId: user.id });
      const userStats = await statsService.get(user.id);
      const streakProfile = await streakService.getProfile(user.id);
      logger.log('IndexScreen', 'Stats loaded', { 
        stats: userStats,
        streakProfile 
      });
      setStats(mapStatsToUI(userStats, streakProfile?.longestStreak || 0));

      // Load streak from profile
      setCurrentStreak(streakProfile?.currentStreak || 0);
      logger.log('IndexScreen', 'Current streak set', { 
        currentStreak: streakProfile?.currentStreak || 0 
      });

      // Load friend count
      const count = await friendService.getFriendCount(user.id);
      setFriendCount(count);
      logger.log('IndexScreen', 'loadData completed successfully');
    } catch (error) {
      logger.error('IndexScreen', 'Error loading data', error);
      console.error('Error loading data:', error);
      showToast('error', 'Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleHabit = async (habitId: string) => {
    if (!user) {
      logger.warn('IndexScreen', 'handleToggleHabit called without user');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const habit = habits.find(h => h.id === habitId);
    if (!habit) {
      logger.warn('IndexScreen', 'Habit not found', { habitId });
      return;
    }

    // Não permitir desmarcar hábitos já completados
    if (habit.completedToday) {
      logger.log('IndexScreen', 'Attempted to uncomplete habit, blocked', { 
        habitId, 
        habitName: habit.name 
      });
      return;
    }

    logger.log('IndexScreen', 'Toggling habit', { 
      habitId, 
      habitName: habit.name,
      currentStatus: habit.completedToday,
      newStatus: true,
      date: today
    });

    const newCompleted = true; // Sempre true, não permitimos desmarcar
    
    // Optimistic update - usar setTimeout para garantir que está fora do ciclo de renderização atual
    setTimeout(() => {
      setHabits(prev => prev.map(h => 
        h.id === habitId ? { ...h, completedToday: newCompleted } : h
      ));
    }, 0);

    try {
      // Toggle completion in database
      logger.log('IndexScreen', 'Saving completion to database', {
        userId: user.id,
        habitId,
        date: today,
        completed: newCompleted
      });
      await completionService.toggle(user.id, habitId, today, newCompleted);
      logger.log('IndexScreen', 'Completion saved successfully');

      // Track habit completed
      logger.log('IndexScreen', 'Tracking habit completed', {
        habitName: habit.name,
        points: habit.points,
        streak: habit.streak + 1
      });
      analytics.trackHabitCompleted({
        name: habit.name,
        points: habit.points,
        streak: habit.streak + 1,
      });
      
      // Add XP
      logger.log('IndexScreen', 'Adding XP', { 
        userId: user.id, 
        points: habit.points 
      });
      const result = await statsService.addXP(user.id, habit.points);
      logger.log('IndexScreen', 'XP added result', result);
      
      if (result) {
        if (result.levelUp) {
          logger.log('IndexScreen', 'Level up!', { newLevel: result.newLevel });
          analytics.trackLevelUp(result.newLevel);
          showToast('success', '🎉 Subiu de nível!', `Você alcançou o nível ${result.newLevel}!`);
          // Enviar notificação de level up
          sendLevelUpNotification(result.newLevel);
        } else {
          showToast('success', `✨ +${habit.points} XP`, `${habit.name} concluído!`);
        }
      }

      // Update streak
      const newStreak = habit.streak + 1;
      logger.log('IndexScreen', 'Updating habit streak', { 
        habitId, 
        oldStreak: habit.streak, 
        newStreak 
      });
      await habitService.updateStreak(habitId, newStreak);

      // Update local state - usar setTimeout para garantir que está fora do ciclo de renderização atual
      setTimeout(() => {
        setHabits(prev => prev.map(h => 
          h.id === habitId ? { ...h, streak: newStreak, completedToday: true } : h
        ));
      }, 0);

      // Check if all habits completed today
      logger.log('IndexScreen', 'Checking if all habits completed today');
      const allCompleted = await completionService.checkAllCompletedToday(user.id);
      logger.log('IndexScreen', 'All completed check result', { allCompleted });
      
      if (allCompleted) {
        logger.log('IndexScreen', 'All habits completed!');
        analytics.trackAllHabitsCompleted();
        // Cancelar lembretes de ofensiva (já completou tudo!)
        onHabitCompleted();
      }
      
      // SEMPRE verificar e atualizar ofensiva quando um hábito é completado
      logger.log('IndexScreen', 'Checking and updating streak after habit completion');
      const streakResult = await streakService.check(user.id);
      logger.log('IndexScreen', 'Streak check after completion', streakResult);
      
      if (streakResult) {
        setCurrentStreak(streakResult.currentStreak);
        logger.log('IndexScreen', 'Current streak updated', { 
          currentStreak: streakResult.currentStreak 
        });
        
        if (streakResult.currentStreak > 0 && !streakResult.streakBroken) {
          showToast('success', '🔥 Ofensiva atualizada!', `${streakResult.currentStreak} dias seguidos!`);
          
          // Enviar notificação de marco de ofensiva (7, 14, 30, 50, 100, 365 dias)
          sendStreakMilestoneNotification(streakResult.currentStreak);
        }
      }

      // Check achievements
      logger.log('IndexScreen', 'Checking achievements');
      const updatedStats = await statsService.get(user.id);
      const updatedHabits = await habitService.getAll(user.id);
      if (updatedStats) {
        const unlockedAchievements = await achievementService.checkAndUnlock(
          user.id,
          updatedStats,
          updatedHabits,
          friendCount
        );
        logger.log('IndexScreen', 'Achievements checked', { 
          unlocked: unlockedAchievements.length 
        });
        
          // Espaçar os toasts
          unlockedAchievements.forEach((achievement, index) => {
            showToast('success', '🏆 Conquista desbloqueada!', achievement.title, 200 + (index * 300));
          });
      }

      // Reload stats
      logger.log('IndexScreen', 'Reloading stats after completion');
      const refreshedStats = await statsService.get(user.id);
      const refreshedStreakProfile = await streakService.getProfile(user.id);
      setStats(mapStatsToUI(refreshedStats, refreshedStreakProfile?.longestStreak || 0));
      logger.log('IndexScreen', 'Stats reloaded', { 
        stats: refreshedStats,
        streakProfile: refreshedStreakProfile 
      });

      logger.log('IndexScreen', 'handleToggleHabit completed successfully');

    } catch (error) {
      logger.error('IndexScreen', 'Error toggling habit', error);
      console.error('Error toggling habit:', error);
      // Revert optimistic update - usar setTimeout
      setTimeout(() => {
        setHabits(prev => prev.map(h => 
          h.id === habitId ? { ...h, completedToday: false } : h
        ));
      }, 0);
      showToast('error', 'Erro', 'Não foi possível atualizar o hábito');
    }
  };

  const handleAddHabit = async (newHabit: {
    name: string;
    icon: string;
    frequency: 'daily' | 'weekly';
    points: number;
  }) => {
    if (!user) return;

    try {
      const created = await habitService.create(user.id, newHabit);
      
      if (created) {
        analytics.trackHabitCreated({
          name: newHabit.name,
          frequency: newHabit.frequency,
          points: newHabit.points,
        });
        setHabits(prev => [...prev, { ...created, completedToday: false }]);
        showToast('success', 'Hábito criado!', `${newHabit.name} foi adicionado.`);
      }
    } catch (error) {
      console.error('Error adding habit:', error);
      showToast('error', 'Erro', 'Não foi possível criar o hábito');
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!user) return;

    try {
      logger.log('IndexScreen', 'Deleting habit', { habitId });
      const success = await habitService.delete(habitId);
      
      if (success) {
        // Remover do estado local
        setHabits(prev => prev.filter(h => h.id !== habitId));
        showToast('success', 'Hábito deletado', 'O hábito foi removido com sucesso');
        logger.log('IndexScreen', 'Habit deleted successfully', { habitId });
        
        // Recarregar dados para atualizar stats
        await loadData();
      } else {
        showToast('error', 'Erro', 'Não foi possível deletar o hábito');
      }
    } catch (error) {
      logger.error('IndexScreen', 'Error deleting habit', error);
      showToast('error', 'Erro', 'Não foi possível deletar o hábito');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!user) return null;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </SafeAreaView>
    );
  }

  const today = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const completedCount = habits.filter(h => h.completedToday).length;
  const totalCount = habits.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-4 py-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <View className="flex-row">
                <Text className="text-4xl font-bold text-white">Habit</Text>
                <Text className="text-4xl font-bold text-emerald-400">Quest</Text>
              </View>
              <View className="flex-row items-center gap-2 mt-1">
                <Calendar size={16} color="#64748B" />
                <Text className="text-muted-foreground text-sm">{today}</Text>
              </View>
            </View>
              <TouchableOpacity
                onPress={handleLogout}
                className="w-12 h-12 bg-card border border-border rounded-lg items-center justify-center"
              >
                <LogOut size={20} color="#F8FAFC" />
              </TouchableOpacity>
          </View>

          <Text className="text-sm text-muted-foreground">
            Olá, <Text className="font-semibold text-foreground">{profile?.name || user.email}</Text>! 👋
          </Text>
        </View>

        {/* Streak Card */}
        <Card className="mb-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/50">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-14 h-14 rounded-full bg-orange-500/20 items-center justify-center">
                <Flame size={28} color="#F59E0B" />
              </View>
              <View>
                <Text className="text-sm text-muted-foreground">Ofensiva Atual</Text>
                <Text className="text-3xl font-bold text-accent">{currentStreak} dias</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-xs text-muted-foreground">
                {completedCount === totalCount && totalCount > 0 
                  ? '✅ Hoje completo!' 
                  : `${totalCount - completedCount} restantes`}
              </Text>
            </View>
          </View>
        </Card>

        {/* User Stats */}
        <View className="mb-6">
          <UserProfile stats={stats} />
        </View>

        {/* Daily Progress */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Sparkles size={20} color="#8B5CF6" />
              <Text className="text-xl font-semibold text-foreground">
                Hábitos de Hoje
              </Text>
            </View>
            <Text className="text-sm font-medium text-muted-foreground">
              {completedCount} de {totalCount} ({completionPercentage}%)
            </Text>
          </View>

          <AddHabitButton onPress={() => setModalVisible(true)} />
        </View>

        {/* Habits List */}
        <View className="mb-6">
          {habits.length === 0 ? (
            <View className="bg-card rounded-lg border border-border p-12 items-center">
              <Text className="text-muted-foreground mb-2 text-center">
                Nenhum hábito cadastrado ainda.
              </Text>
              <Text className="text-sm text-muted-foreground text-center">
                Clique em "Novo Hábito" para começar!
              </Text>
            </View>
          ) : (
            habits.map((habit) => (
              <DeletableHabitCard 
                key={habit.id} 
                habit={habit} 
                onToggle={handleToggleHabit}
                onDelete={handleDeleteHabit}
              />
            ))
          )}
        </View>

        {/* Perfect Day Message */}
        {completedCount === totalCount && totalCount > 0 && (
          <View className="bg-accent/20 border-2 border-accent rounded-lg p-6 items-center mb-6">
            <Text className="text-4xl mb-2">🏆</Text>
            <Text className="text-xl font-bold text-foreground mb-1">
              Dia Perfeito!
            </Text>
            <Text className="text-muted-foreground text-center">
              Você completou todos os seus hábitos hoje. Continue assim! 🌟
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Habit Modal */}
      <AddHabitModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddHabit}
      />
    </SafeAreaView>
  );
};

export default IndexScreen;
