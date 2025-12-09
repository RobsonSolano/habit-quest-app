import React, { useState, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Animated, Pressable } from 'react-native';
import { Trash2, AlertTriangle } from 'lucide-react-native';
import { HabitCard } from './HabitCard';
import { HabitWithCompletion } from '@/types/habit';
import * as Haptics from 'expo-haptics';

interface DeletableHabitCardProps {
  habit: HabitWithCompletion;
  onToggle: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

export const DeletableHabitCard = ({ habit, onToggle, onDelete }: DeletableHabitCardProps) => {
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const deleteButtonOpacity = useRef(new Animated.Value(0)).current;
  const deleteButtonScale = useRef(new Animated.Value(0.8)).current;

  const handleLongPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowDeleteButton(true);
      Animated.parallel([
        Animated.spring(deleteButtonOpacity, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(deleteButtonScale, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.warn('[DeletableHabitCard] Error in longPress:', error);
      setShowDeleteButton(true);
    }
  };

  const handlePressOut = () => {
    // Não fazer nada - manter o botão visível até clicar
  };

  const handleDeletePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setShowConfirmModal(true);
    } catch (error) {
      console.warn('[DeletableHabitCard] Error in delete press:', error);
      setShowConfirmModal(true);
    }
  };

  const handleCancelDelete = () => {
    try {
      setShowConfirmModal(false);
      setShowDeleteButton(false);
      Animated.parallel([
        Animated.timing(deleteButtonOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(deleteButtonScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.warn('[DeletableHabitCard] Error canceling delete:', error);
      setShowDeleteButton(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setShowConfirmModal(false);
      setShowDeleteButton(false);
      Animated.parallel([
        Animated.timing(deleteButtonOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(deleteButtonScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      await onDelete(habit.id);
    } catch (error) {
      console.error('[DeletableHabitCard] Error confirming delete:', error);
    }
  };

  return (
    <View className="relative mb-2">
      <View className="flex-row items-center gap-3">
        {/* Card do hábito */}
        <Pressable
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
          delayLongPress={500}
          className="flex-1"
        >
          <HabitCard habit={habit} onToggle={onToggle} />
        </Pressable>

        {/* Botão de deletar (aparece após long press) */}
        {showDeleteButton && (
          <Animated.View
            style={{
              opacity: deleteButtonOpacity,
              transform: [{ scale: deleteButtonScale }],
            }}
          >
            <TouchableOpacity
              onPress={handleDeletePress}
              className="w-14 h-14 bg-red-500 rounded-full items-center justify-center"
              activeOpacity={0.8}
            >
              <Trash2 size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Modal de confirmação */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-red-500/20 rounded-full items-center justify-center mb-4">
                <AlertTriangle size={32} color="#EF4444" />
              </View>
              <Text className="text-xl font-bold text-foreground mb-2">
                Deletar hábito?
              </Text>
              <Text className="text-muted-foreground text-center">
                Tem certeza que deseja deletar "{habit.name}"?
              </Text>
              <Text className="text-muted-foreground text-center mt-2 text-sm">
                Esta ação não pode ser desfeita.
              </Text>
            </View>

            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={handleCancelDelete}
                className="flex-1 bg-card border border-border rounded-lg py-3 items-center"
              >
                <Text className="text-foreground font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDelete}
                className="flex-1 bg-red-500 rounded-lg py-3 items-center"
              >
                <Text className="text-white font-semibold">Deletar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#334155',
  },
});

