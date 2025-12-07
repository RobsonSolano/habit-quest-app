import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { useAuth } from '@/contexts/AuthContext';
import { MainNavigator } from './MainNavigator';
import AuthScreen from '@/screens/AuthScreen';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // ou um loading screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
};

