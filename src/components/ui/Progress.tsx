import React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  indicatorClassName?: string;
}

export const Progress = ({ value, className, indicatorClassName }: ProgressProps) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <View className={cn('h-2 w-full bg-muted rounded-full overflow-hidden', className)}>
      <View
        className={cn('h-full bg-primary rounded-full', indicatorClassName)}
        style={{ width: `${clampedValue}%` }}
      />
    </View>
  );
};

