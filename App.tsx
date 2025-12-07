import './nativewind-env.d.ts';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';

const queryClient = new QueryClient();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <AuthProvider>
            <StatusBar style="light" />
            <RootNavigator />
            <Toast />
          </AuthProvider>
        </NavigationContainer>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
