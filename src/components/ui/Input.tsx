import React, { useState } from 'react';
import { TextInput, TextInputProps, View, Text, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, className, showPasswordToggle, secureTextEntry, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
      <View className="space-y-2">
        {label && (
          <Text className="text-sm font-medium text-foreground">{label}</Text>
        )}
        <View className="relative">
          <TextInput
            ref={ref}
            className={cn(
              'h-12 rounded-lg border border-border bg-background px-4 text-foreground',
              error && 'border-red-500',
              showPasswordToggle && 'pr-12',
              className
            )}
            placeholderTextColor="#64748B"
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            {...props}
          />
          {showPasswordToggle && (
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute right-3 top-0 bottom-0 justify-center"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isPasswordVisible ? (
                <EyeOff size={20} color="#64748B" />
              ) : (
                <Eye size={20} color="#64748B" />
              )}
            </TouchableOpacity>
          )}
        </View>
        {error && <Text className="text-sm text-red-500">{error}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

