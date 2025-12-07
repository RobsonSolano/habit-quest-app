import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className, ...props }: CardProps) => {
  return (
    <View
      className={cn('bg-card rounded-lg border border-border p-4', className)}
      {...props}
    >
      {children}
    </View>
  );
};

