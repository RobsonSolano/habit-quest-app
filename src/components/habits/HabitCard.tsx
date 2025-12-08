import React, { useState } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Check, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/ui/Card';
import { HabitWithCompletion } from '@/types/habit';
import { cn } from '@/lib/utils';

interface HabitCardProps {
  habit: HabitWithCompletion;
  onToggle: (id: string) => void;
}

export const HabitCard = ({ habit, onToggle }: HabitCardProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    if (!habit.completedToday) {
      setIsAnimating(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        // Haptics may not be available
      }
      setTimeout(() => setIsAnimating(false), 500);
    }
    onToggle(habit.id);
  };

  return (
    <TouchableOpacity onPress={handleToggle} activeOpacity={0.8}>
      <Card
        className={cn(
          'mb-3 border-2',
          habit.completedToday
            ? 'bg-primary border-primary'
            : 'bg-card border-border'
        )}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 gap-3">
            {/* Icon */}
            <View
              className={cn(
                'w-12 h-12 rounded-full items-center justify-center',
                habit.completedToday ? 'bg-white/20' : 'bg-muted'
              )}
            >
              <Text className="text-2xl">{habit.icon}</Text>
            </View>

            {/* Info */}
            <View className="flex-1">
              <Text
                className={cn(
                  'font-semibold text-lg',
                  habit.completedToday ? 'text-white' : 'text-foreground'
                )}
              >
                {habit.name}
              </Text>
              <View className="flex-row items-center gap-2 mt-1">
                {habit.streak > 0 && (
                  <View className="flex-row items-center gap-1">
                    <Flame
                      size={16}
                      color={habit.completedToday ? '#FFFFFF' : '#F59E0B'}
                    />
                    <Text
                      className={cn(
                        'text-sm font-medium',
                        habit.completedToday
                          ? 'text-white/90'
                          : 'text-accent'
                      )}
                    >
                      {habit.streak} dias
                    </Text>
                  </View>
                )}
                <Text
                  className={cn(
                    'text-sm',
                    habit.completedToday ? 'text-white/70' : 'text-muted-foreground'
                  )}
                >
                  +{habit.points} XP
                </Text>
              </View>
            </View>
          </View>

          {/* Checkbox */}
          <View
            className={cn(
              'w-10 h-10 rounded-full border-2 items-center justify-center',
              habit.completedToday
                ? 'bg-white border-white'
                : 'border-muted',
              isAnimating && 'scale-110'
            )}
          >
            {habit.completedToday && (
              <Check size={24} color="#8B5CF6" strokeWidth={3} />
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};
