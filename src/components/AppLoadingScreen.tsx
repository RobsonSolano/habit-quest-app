import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';

export function AppLoadingScreen() {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: '700',
          color: colors.foreground,
          marginBottom: 4,
        }}
      >
        HabitQuest
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: colors.muted.foreground,
          marginBottom: 32,
        }}
      >
        Carregando...
      </Text>
      <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
    </SafeAreaView>
  );
}
