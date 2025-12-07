import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { cn } from '@/lib/utils';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <View className="space-y-2">
        {label && (
          <Text className="text-sm font-medium text-foreground">{label}</Text>
        )}
        <TextInput
          ref={ref}
          className={cn(
            'h-12 rounded-lg border border-border bg-background px-4 text-foreground',
            error && 'border-red-500',
            className
          )}
          placeholderTextColor="#64748B"
          {...props}
        />
        {error && <Text className="text-sm text-red-500">{error}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

