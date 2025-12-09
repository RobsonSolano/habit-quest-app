import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { useAuth } from '@/contexts/AuthContext';
import { MainNavigator } from './MainNavigator';
import AuthScreen from '@/screens/AuthScreen';
import { logger } from '@/lib/logger';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { user, isLoading } = useAuth();

  React.useEffect(() => {
    logger.log('RootNavigator', 'Render', { 
      isLoading, 
      hasUser: !!user 
    });
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  try {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    );
  } catch (error) {
    logger.error('RootNavigator', 'Error rendering navigator', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }
};

