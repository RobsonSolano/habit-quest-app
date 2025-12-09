import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const habitIcons = [
  { emoji: '💧', label: 'Água' },
  { emoji: '🏃', label: 'Exercício' },
  { emoji: '📖', label: 'Leitura' },
  { emoji: '🧘', label: 'Meditação' },
  { emoji: '🥗', label: 'Alimentação' },
  { emoji: '😴', label: 'Sono' },
  { emoji: '💼', label: 'Trabalho' },
  { emoji: '🎨', label: 'Criatividade' },
  { emoji: '🎯', label: 'Metas' },
  { emoji: '🌱', label: 'Crescimento' },
];

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (habit: {
    name: string;
    icon: string;
    frequency: 'daily' | 'weekly';
    points: number;
  }) => void;
}

export const AddHabitModal = ({ visible, onClose, onAdd }: AddHabitModalProps) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(habitIcons[0].emoji);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');

  const handleSubmit = () => {
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      icon,
      frequency,
      points: frequency === 'daily' ? 10 : 30,
    });

    // Reset form
    setName('');
    setIcon(habitIcons[0].emoji);
    setFrequency('daily');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Criar Novo Hábito"
      description="Adicione um novo hábito para começar sua jornada de crescimento!"
    >
      <View className="space-y-2">
        {/* Name Input */}
        <Input
          label="Nome do Hábito"
          placeholder="Ex: Beber 2L de água"
          value={name}
          onChangeText={setName}
          className="mb-3"
        />

        {/* Icon Selector */}
        <View>
          <Text className="text-sm font-medium text-foreground mb-1">
            Ícone
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row gap-2 mb-3"
          >
            {habitIcons.map((item) => (
              <TouchableOpacity
                key={item.emoji}
                onPress={() => setIcon(item.emoji)}
                className={cn(
                  'w-14 h-14 rounded-lg items-center justify-center border-2',
                  icon === item.emoji
                    ? 'bg-primary/20 border-primary'
                    : 'bg-muted/50 border-border'
                )}
              >
                <Text className="text-2xl">{item.emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Frequency Selector */}
        <View>
          <Text className="text-sm font-medium text-foreground mb-2">
            Frequência
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setFrequency('daily')}
              className={cn(
                'flex-1 py-3 rounded-lg border-2',
                frequency === 'daily'
                  ? 'bg-primary border-primary'
                  : 'bg-transparent border-border'
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold',
                  frequency === 'daily' ? 'text-white' : 'text-foreground'
                )}
              >
                Diário (+10 XP)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFrequency('weekly')}
              className={cn(
                'flex-1 py-3 rounded-lg border-2',
                frequency === 'weekly'
                  ? 'bg-primary border-primary'
                  : 'bg-transparent border-border'
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold',
                  frequency === 'weekly' ? 'text-white' : 'text-foreground'
                )}
              >
                Semanal (+30 XP)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <Button
          variant="primary"
          onPress={handleSubmit}
          disabled={!name.trim()}
          className="mt-4"
        >
          Criar Hábito
        </Button>
      </View>
    </Modal>
  );
};

export const AddHabitButton = ({ onPress }: { onPress: () => void }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-primary rounded-lg px-4 py-3 flex-row items-center gap-2"
      activeOpacity={0.8}
    >
      <Plus size={20} color="white" />
      <Text className="text-white font-semibold">Novo Hábito</Text>
    </TouchableOpacity>
  );
};

