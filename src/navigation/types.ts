import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Stats: undefined;
  Friends: undefined;
  Partnerships: undefined;
  Profile: { username?: string };
};

export type AuthNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;
export type MainNavigationProp = BottomTabNavigationProp<MainTabParamList>;

export type HomeScreenRouteProp = RouteProp<MainTabParamList, 'Home'>;
export type StatsScreenRouteProp = RouteProp<MainTabParamList, 'Stats'>;
export type ProfileScreenRouteProp = RouteProp<MainTabParamList, 'Profile'>;
export type FriendsScreenRouteProp = RouteProp<MainTabParamList, 'Friends'>;
