import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = React.forwardRef<View, CardProps>(({ children, className, ...props }, ref) => {
  // Processar className de forma segura
  const processedClassName = React.useMemo(() => {
    try {
      return cn('bg-card rounded-lg border border-border p-4', className);
    } catch (error) {
      // Se houver erro, retornar className padrão
      console.warn('[Card] Error processing className:', error);
      return 'bg-card rounded-lg border border-border p-4';
    }
  }, [className]);

  return (
    <View
      ref={ref}
      className={processedClassName}
      {...props}
    >
      {children}
    </View>
  );
});

Card.displayName = 'Card';

