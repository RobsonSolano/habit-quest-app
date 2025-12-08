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
import { HabitCard } from '@/components/habits/HabitCard';
import { UserProfile } from '@/components/habits/UserProfile';
import { AddHabitModal, AddHabitButton } from '@/components/habits/AddHabitModal';
import { HabitWithCompletion, UserStatsUI, mapStatsToUI } from '@/types/habit';
import { useAuth } from '@/contexts/AuthContext';
import { 
  habitService, 
  completionService, 
  statsService, 
  achievementService,
  streakService,
  friendService,
} from '@/lib/storage';
import Toast from 'react-native-toast-message';
import { Card } from '@/components/ui/Card';

const IndexScreen = () => {
  const { user, profile, logout } = useAuth();
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
    if (!user) return;

    try {
      // Check streak first (this may update it if broken)
      const streakResult = await streakService.check(user.id);
      
      if (streakResult?.streakBroken) {
        Toast.show({
          type: 'error',
          text1: '😢 Ofensiva perdida!',
          text2: `Sua ofensiva de ${streakResult.oldStreak} dias foi zerada`,
        });
      }

      // Load habits
      const userHabits = await habitService.getAll(user.id);
      
      // Load today's completions
      const today = new Date().toISOString().split('T')[0];
      const todayCompletions = await completionService.getByDate(user.id, today);
      
      // Map habits with completion status
      const habitsWithCompletion: HabitWithCompletion[] = userHabits.map(habit => ({
        ...habit,
        completedToday: todayCompletions.some(
          c => c.habit_id === habit.id && c.completed
        ),
      }));
      
      setHabits(habitsWithCompletion);

      // Load stats
      const userStats = await statsService.get(user.id);
      setStats(mapStatsToUI(userStats));

      // Load streak from profile
      const streakProfile = await streakService.getProfile(user.id);
      setCurrentStreak(streakProfile?.currentStreak || 0);

      // Load friend count
      const count = await friendService.getFriendCount(user.id);
      setFriendCount(count);
    } catch (error) {
      console.error('Error loading data:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar os dados',
      });
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
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const newCompleted = !habit.completedToday;
    
    // Optimistic update
    setHabits(prev => prev.map(h => 
      h.id === habitId ? { ...h, completedToday: newCompleted } : h
    ));

    try {
      // Toggle completion in database
      await completionService.toggle(user.id, habitId, today, newCompleted);

      if (newCompleted) {
        // Add XP
        const result = await statsService.addXP(user.id, habit.points);
        
        if (result) {
          if (result.levelUp) {
            Toast.show({
              type: 'success',
              text1: '🎉 Subiu de nível!',
              text2: `Você alcançou o nível ${result.newLevel}!`,
            });
          } else {
            Toast.show({
              type: 'success',
              text1: `✨ +${habit.points} XP`,
              text2: `${habit.name} concluído!`,
            });
          }
        }

        // Update streak
        const newStreak = habit.streak + 1;
        await habitService.updateStreak(habitId, newStreak);

        // Update local state
        setHabits(prev => prev.map(h => 
          h.id === habitId ? { ...h, streak: newStreak, completedToday: true } : h
        ));

        // Check if all habits completed today
        const allCompleted = await completionService.checkAllCompletedToday(user.id);
        if (allCompleted) {
          // Update streak in profile
          const streakResult = await streakService.check(user.id);
          if (streakResult) {
            setCurrentStreak(streakResult.currentStreak);
            
            if (streakResult.currentStreak > 0 && !streakResult.streakBroken) {
              Toast.show({
                type: 'success',
                text1: '🔥 Ofensiva atualizada!',
                text2: `${streakResult.currentStreak} dias seguidos!`,
              });
            }
          }
        }

        // Check achievements
        const updatedStats = await statsService.get(user.id);
        const updatedHabits = await habitService.getAll(user.id);
        if (updatedStats) {
          const unlockedAchievements = await achievementService.checkAndUnlock(
            user.id,
            updatedStats,
            updatedHabits,
            friendCount
          );
          
          for (const achievement of unlockedAchievements) {
            Toast.show({
              type: 'success',
              text1: `🏆 Conquista desbloqueada!`,
              text2: achievement.title,
            });
          }
        }
      } else {
        // Remove XP
        await statsService.removeXP(user.id, habit.points);

        // Update streak
        const newStreak = Math.max(0, habit.streak - 1);
        await habitService.updateStreak(habitId, newStreak);

        setHabits(prev => prev.map(h => 
          h.id === habitId ? { ...h, streak: newStreak, completedToday: false } : h
        ));
      }

      // Reload stats
      const refreshedStats = await statsService.get(user.id);
      setStats(mapStatsToUI(refreshedStats));

    } catch (error) {
      console.error('Error toggling habit:', error);
      // Revert optimistic update
      setHabits(prev => prev.map(h => 
        h.id === habitId ? { ...h, completedToday: !newCompleted } : h
      ));
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível atualizar o hábito',
      });
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
        setHabits(prev => [...prev, { ...created, completedToday: false }]);
        Toast.show({
          type: 'success',
          text1: 'Hábito criado!',
          text2: `${newHabit.name} foi adicionado.`,
        });
      }
    } catch (error) {
      console.error('Error adding habit:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível criar o hábito',
      });
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
              <HabitCard key={habit.id} habit={habit} onToggle={handleToggleHabit} />
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
