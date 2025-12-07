import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainStackParamList = {
  Index: undefined;
  Stats: undefined;
  Profile: { username?: string };
  Friends: undefined;
};

export type AuthNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;
export type MainNavigationProp = StackNavigationProp<MainStackParamList>;

export type IndexScreenRouteProp = RouteProp<MainStackParamList, 'Index'>;
export type StatsScreenRouteProp = RouteProp<MainStackParamList, 'Stats'>;
export type ProfileScreenRouteProp = RouteProp<MainStackParamList, 'Profile'>;
export type FriendsScreenRouteProp = RouteProp<MainStackParamList, 'Friends'>;
