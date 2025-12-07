import React from 'react';
import { View, Text } from 'react-native';
import { Trophy, TrendingUp } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { UserStatsUI } from '@/types/habit';

interface UserProfileProps {
  stats: UserStatsUI;
}

export const UserProfile = ({ stats }: UserProfileProps) => {
  const progressPercentage = (stats.xp / stats.xpToNextLevel) * 100;

  return (
    <Card>
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-2xl font-bold text-foreground">
            Nível {stats.level}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {stats.xp} / {stats.xpToNextLevel} XP
          </Text>
        </View>

        <View className="flex-row gap-4">
          <View className="items-center">
            <View className="flex-row items-center gap-1">
              <Trophy size={20} color="#F59E0B" />
              <Text className="text-xl font-bold text-accent">
                {stats.totalPoints}
              </Text>
            </View>
            <Text className="text-xs text-muted-foreground">Pontos</Text>
          </View>

          <View className="items-center">
            <View className="flex-row items-center gap-1">
              <TrendingUp size={20} color="#EC4899" />
              <Text className="text-xl font-bold text-secondary">
                {stats.longestStreak}
              </Text>
            </View>
            <Text className="text-xs text-muted-foreground">Maior Streak</Text>
          </View>
        </View>
      </View>

      <View className="space-y-2">
        <Progress value={progressPercentage} className="h-3" />
        <Text className="text-xs text-muted-foreground text-right">
          {stats.xpToNextLevel - stats.xp} XP para o próximo nível
        </Text>
      </View>
    </Card>
  );
};
