import React, { useState, useMemo, useCallback } from 'react';
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

export const HabitCard = React.memo(({ habit, onToggle }: HabitCardProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = useCallback(() => {
    // Não permitir desmarcar hábitos já completados
    if (habit.completedToday) {
      return;
    }
    
      setIsAnimating(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // Haptics may not be available
    }
    setTimeout(() => setIsAnimating(false), 500);
    onToggle(habit.id);
  }, [habit.completedToday, habit.id, onToggle]);
  
  // Memoizar classes para evitar recálculo desnecessário
  const cardClassName = useMemo(() => {
    try {
      return cn(
          'mb-3 border-2',
          habit.completedToday
            ? 'bg-primary border-primary'
            : 'bg-card border-border'
      );
    } catch (error) {
      console.warn('[HabitCard] Error processing card className:', error);
      return 'mb-3 border-2 bg-card border-border';
    }
  }, [habit.completedToday]);
  
  const iconClassName = useMemo(() => {
    try {
      return cn(
        'w-12 h-12 rounded-full items-center justify-center',
        habit.completedToday ? 'bg-white/20' : 'bg-muted'
      );
    } catch (error) {
      console.warn('[HabitCard] Error processing icon className:', error);
      return 'w-12 h-12 rounded-full items-center justify-center bg-muted';
    }
  }, [habit.completedToday]);
  
  const nameClassName = useMemo(() => {
    try {
      return cn(
        'font-semibold text-lg',
        habit.completedToday ? 'text-white' : 'text-foreground'
      );
    } catch (error) {
      console.warn('[HabitCard] Error processing name className:', error);
      return 'font-semibold text-lg text-foreground';
    }
  }, [habit.completedToday]);
  
  const streakClassName = useMemo(() => {
    try {
      return cn(
        'text-sm font-medium',
        habit.completedToday
          ? 'text-white/90'
          : 'text-accent'
      );
    } catch (error) {
      console.warn('[HabitCard] Error processing streak className:', error);
      return 'text-sm font-medium text-accent';
    }
  }, [habit.completedToday]);
  
  const pointsClassName = useMemo(() => {
    try {
      return cn(
        'text-sm',
        habit.completedToday ? 'text-white/70' : 'text-muted-foreground'
      );
    } catch (error) {
      console.warn('[HabitCard] Error processing points className:', error);
      return 'text-sm text-muted-foreground';
    }
  }, [habit.completedToday]);
  
  const checkboxClassName = useMemo(() => {
    try {
      return cn(
        'w-10 h-10 rounded-full border-2 items-center justify-center',
        habit.completedToday
          ? 'bg-white border-white'
          : 'border-muted',
        isAnimating && 'scale-110'
      );
    } catch (error) {
      console.warn('[HabitCard] Error processing checkbox className:', error);
      return 'w-10 h-10 rounded-full border-2 items-center justify-center border-muted';
    }
  }, [habit.completedToday, isAnimating]);

  return (
    <TouchableOpacity 
      onPress={handleToggle} 
      activeOpacity={habit.completedToday ? 1 : 0.8}
      disabled={habit.completedToday}
    >
      <Card className={cardClassName}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 gap-3">
            {/* Icon */}
            <View className={iconClassName}>
              <Text className="text-2xl">{habit.icon}</Text>
            </View>

            {/* Info */}
            <View className="flex-1">
              <Text className={nameClassName}>
                {habit.name}
              </Text>
              <View className="flex-row items-center gap-2 mt-1">
                {habit.streak > 0 && (
                  <View className="flex-row items-center gap-1">
                    <Flame
                      size={16}
                      color={habit.completedToday ? '#FFFFFF' : '#F59E0B'}
                    />
                    <Text className={streakClassName}>
                      {habit.streak} dias
                    </Text>
                  </View>
                )}
                <Text className={pointsClassName}>
                  +{habit.points} XP
                </Text>
              </View>
            </View>
          </View>

          {/* Checkbox */}
          <View className={checkboxClassName}>
            {habit.completedToday && (
              <Check size={24} color="#8B5CF6" strokeWidth={3} />
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Comparação customizada para evitar re-renderizações desnecessárias
  return (
    prevProps.habit.id === nextProps.habit.id &&
    prevProps.habit.completedToday === nextProps.habit.completedToday &&
    prevProps.habit.streak === nextProps.habit.streak &&
    prevProps.habit.name === nextProps.habit.name &&
    prevProps.habit.points === nextProps.habit.points &&
    prevProps.habit.icon === nextProps.habit.icon
  );
});

HabitCard.displayName = 'HabitCard';
