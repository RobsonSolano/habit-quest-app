import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { cn } from '@/lib/utils';

interface ButtonProps {
  onPress?: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const Button = ({
  onPress,
  children,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  className,
}: ButtonProps) => {
  const baseStyles = 'rounded-lg items-center justify-center flex-row';
  
  const variantStyles = {
    default: 'bg-card border border-border',
    primary: 'bg-primary',
    outline: 'border-2 border-primary bg-transparent',
    ghost: 'bg-transparent',
  };

  const sizeStyles = {
    default: 'h-12 px-6',
    sm: 'h-10 px-4',
    lg: 'h-14 px-8',
    icon: 'h-12 w-12',
  };

  const textVariantStyles = {
    default: 'text-foreground',
    primary: 'text-white',
    outline: 'text-primary',
    ghost: 'text-foreground',
  };

  const textSizeStyles = {
    default: 'text-base',
    sm: 'text-sm',
    lg: 'text-lg',
    icon: 'text-base',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        (disabled || loading) && 'opacity-50',
        className
      )}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#8B5CF6'} />
      ) : (
        <Text
          className={cn(
            'font-semibold',
            textVariantStyles[variant],
            textSizeStyles[size]
          )}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

