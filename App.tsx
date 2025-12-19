import './global.css';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { analytics } from './src/lib/analytics';
import { initSentry } from './src/lib/sentry';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { logger } from './src/lib/logger';

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    try {
      // Inicializar logger PRIMEIRO
      logger.init().catch(err => console.warn('Logger init failed:', err));
      
      // Inicializar Sentry (para capturar erros desde o início)
      initSentry();
      
      // Inicializar analytics
      analytics.init().then(() => {
        analytics.trackAppOpen();
      }).catch(err => {
        console.warn('Analytics init failed:', err);
      });
      
      logger.log('App', 'App initialized');
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }, []);
  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <AuthProvider>
            <StatusBar style="light" />
            <RootNavigator />
            <Toast />
          </AuthProvider>
        </NavigationContainer>
      </QueryClientProvider>
        </SafeAreaProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
