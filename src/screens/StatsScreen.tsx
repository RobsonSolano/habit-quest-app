import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, TrendingUp, Award, Calendar, Flame } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { habitService, completionService, statsService, achievementService } from '@/lib/storage';
import { Achievement } from '@/types/database';
import { UserStatsUI, mapStatsToUI } from '@/types/habit';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';

const StatsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; completed: number; total: number }[]>([]);
  const [stats, setStats] = useState<UserStatsUI>({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    totalPoints: 0,
    longestStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      // Load achievements
      const userAchievements = await achievementService.getAll(user.id);
      setAchievements(userAchievements);

      // Load stats
      const userStats = await statsService.get(user.id);
      setStats(mapStatsToUI(userStats));

      // Calculate weekly completion data
      const habits = await habitService.getAll(user.id);
      const completions = await completionService.getLast7Days(user.id);
      
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const weekly = last7Days.map(date => {
        const dayCompletions = completions.filter(
          c => c.completed_date === date && c.completed
        );
        return {
          day: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
          completed: dayCompletions.length,
          total: habits.length,
        };
      });

      setWeeklyData(weekly);
    } catch (error) {
      console.error('Error loading stats:', error);
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

  if (!user) return null;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </SafeAreaView>
    );
  }

  const unlockedCount = achievements.filter(a => a.unlocked_at).length;
  const totalAchievements = achievements.length;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        className="flex-1 px-4 py-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-6">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-12 h-12 bg-card border border-border rounded-lg items-center justify-center"
          >
            <ArrowLeft size={20} color="#F8FAFC" />
          </TouchableOpacity>
          <View>
            <Text className="text-3xl font-bold text-foreground">Estatísticas</Text>
            <Text className="text-muted-foreground">Acompanhe seu progresso</Text>
          </View>
        </View>

        {/* Stats Overview */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          <Card className="flex-1 min-w-[45%]">
            <View className="flex-row items-center gap-2 mb-1">
              <TrendingUp size={16} color="#8B5CF6" />
              <Text className="text-sm font-medium text-primary">Nível</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">{stats.level}</Text>
          </Card>

          <Card className="flex-1 min-w-[45%]">
            <View className="flex-row items-center gap-2 mb-1">
              <Award size={16} color="#F59E0B" />
              <Text className="text-sm font-medium text-accent">Pontos</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">{stats.totalPoints}</Text>
          </Card>

          <Card className="flex-1 min-w-[45%]">
            <View className="flex-row items-center gap-2 mb-1">
              <Flame size={16} color="#EC4899" />
              <Text className="text-sm font-medium text-secondary">Maior Streak</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">{stats.longestStreak}</Text>
          </Card>

          <Card className="flex-1 min-w-[45%]">
            <View className="flex-row items-center gap-2 mb-1">
              <Calendar size={16} color="#8B5CF6" />
              <Text className="text-sm font-medium text-primary">Conquistas</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">
              {unlockedCount}/{totalAchievements}
            </Text>
          </Card>
        </View>

        {/* Weekly Progress */}
        <Card className="mb-6">
          <View className="flex-row items-center gap-2 mb-4">
            <TrendingUp size={20} color="#8B5CF6" />
            <Text className="text-xl font-semibold text-foreground">Últimos 7 dias</Text>
          </View>
          <View className="space-y-3">
            {weeklyData.map((day, index) => {
              const percentage = day.total > 0 ? (day.completed / day.total) * 100 : 0;
              return (
                <View key={index} className="space-y-1">
                  <View className="flex-row justify-between">
                    <Text className="text-sm font-medium text-foreground capitalize">
                      {day.day}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {day.completed}/{day.total}
                    </Text>
                  </View>
                  <Progress value={percentage} className="h-2" />
                </View>
              );
            })}
          </View>
        </Card>

        {/* Achievements */}
        <Card className="mb-6">
          <View className="flex-row items-center gap-2 mb-4">
            <Award size={20} color="#F59E0B" />
            <Text className="text-xl font-semibold text-foreground">Conquistas</Text>
          </View>
          <View className="space-y-3">
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                className={cn(
                  'p-4 rounded-lg border-2',
                  achievement.unlocked_at
                    ? 'bg-accent/20 border-accent'
                    : 'bg-muted/30 border-border opacity-60'
                )}
              >
                <View className="flex-row items-start gap-3">
                  <Text className="text-3xl">{achievement.icon}</Text>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="font-semibold text-foreground">
                        {achievement.title}
                      </Text>
                      {achievement.unlocked_at && (
                        <View className="bg-accent/30 px-2 py-0.5 rounded">
                          <Text className="text-xs text-accent font-medium">
                            Desbloqueada
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm text-muted-foreground">
                      {achievement.description}
                    </Text>
                    {achievement.unlocked_at && (
                      <Text className="text-xs text-muted-foreground mt-2">
                        Desbloqueada em {new Date(achievement.unlocked_at).toLocaleDateString('pt-BR')}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatsScreen;
