import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal = ({
  visible,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) => {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="w-full max-w-lg"
        >
          <View
            className={cn(
              'bg-card rounded-lg border border-border p-6 max-h-[80%]',
              className
            )}
          >
            {/* Header */}
            <View className="flex-row items-start justify-between mb-4">
              <View className="flex-1 pr-4">
                {title && (
                  <Text className="text-xl font-bold text-foreground mb-1">
                    {title}
                  </Text>
                )}
                {description && (
                  <Text className="text-sm text-muted-foreground">
                    {description}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={onClose} className="p-1">
                <X size={24} color="#F8FAFC" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              className="max-h-96"
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
};

