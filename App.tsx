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
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { logger } from './src/lib/logger';
import { adsService } from './src/lib/ads';
import { sendTestEvent } from './src/lib/sentry';

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    try {
      // Inicializar logger PRIMEIRO
      logger.init().catch(err => console.warn('Logger init failed:', err));
      
      // Inicializar analytics
      analytics.init().then(() => {
        analytics.trackAppOpen();
      }).catch(err => {
        console.warn('Analytics init failed:', err);
      });
      
      // Inicializar anúncios
      adsService.init().catch(err => {
        console.warn('Ads init failed:', err);
      });
      
      logger.log('App', 'App initialized');

      // Envio de teste ao Sentry em dev (EXPO_PUBLIC_SENTRY_ENABLED_IN_DEV=true)
      if (__DEV__ && process.env.EXPO_PUBLIC_SENTRY_ENABLED_IN_DEV === 'true' && process.env.EXPO_PUBLIC_SENTRY_DSN) {
        const timer = setTimeout(() => {
          sendTestEvent();
          console.log('[Sentry] Test event sent. Check your Sentry project in a few seconds.');
        }, 3000);
        return () => clearTimeout(timer);
      }
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
