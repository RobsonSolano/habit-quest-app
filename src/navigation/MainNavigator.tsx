import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BarChart3, Users, User } from 'lucide-react-native';
import { MainTabParamList } from './types';

import IndexScreen from '@/screens/IndexScreen';
import StatsScreen from '@/screens/StatsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import FriendsScreen from '@/screens/FriendsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator = () => {
  let insets;
  try {
    insets = useSafeAreaInsets();
  } catch (error) {
    console.warn('[MainNavigator] Error getting safe area insets:', error);
    insets = { bottom: 0, top: 0, left: 0, right: 0 };
  }
  
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom || 0, 10) : 10;
  const tabBarHeight = 70 + (Platform.OS === 'android' ? (insets.bottom || 0) : 0);
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1E293B',
          borderTopColor: '#334155',
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: bottomPadding,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={IndexScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Stats" 
        component={StatsScreen}
        options={{
          tabBarLabel: 'Estatísticas',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsScreen}
        options={{
          tabBarLabel: 'Amigos',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
