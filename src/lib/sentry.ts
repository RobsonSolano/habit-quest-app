import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';
const ENABLED_IN_DEV = process.env.EXPO_PUBLIC_SENTRY_ENABLED_IN_DEV === 'true';

/**
 * Inicializa Sentry.
 * Em desenvolvimento fica desligado por padrão (use EXPO_PUBLIC_SENTRY_ENABLED_IN_DEV=true para testar).
 */
export const initSentry = () => {
  if (!SENTRY_DSN) {
    if (!__DEV__) {
      console.warn('Sentry DSN not configured. Error tracking disabled.');
    }
    return;
  }

  if (__DEV__ && !ENABLED_IN_DEV) {
    console.log('[Sentry] Disabled in development (set EXPO_PUBLIC_SENTRY_ENABLED_IN_DEV=true to test)');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Performance Monitoring (100% das transações em produção)
    tracesSampleRate: 1.0,
    
    // Ambiente (dev quando EXPO_PUBLIC_SENTRY_ENABLED_IN_DEV=true)
    environment: __DEV__ ? 'development' : 'production',
    
    // Ignorar erros comuns que não são bugs
    ignoreErrors: [
      'Network request failed',
      'timeout',
      'NetworkError',
      'AbortError',
      'expo-notifications',
    ],
    
    // Configurações adicionais
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000, // 30s
  });
};

// Identificar usuário (só funciona se Sentry estiver inicializado)
export const setSentryUser = (userId: string, email?: string, username?: string) => {
  if (__DEV__ && !ENABLED_IN_DEV) return;
  
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
};

// Limpar usuário (logout)
export const clearSentryUser = () => {
  if (__DEV__ && !ENABLED_IN_DEV) return;
  
  Sentry.setUser(null);
};

// Capturar erro manualmente
export const captureError = (error: Error, context?: Record<string, any>) => {
  if (__DEV__ && !ENABLED_IN_DEV) {
    console.log('[Sentry] Would capture:', error.message, context);
    return;
  }
  
  Sentry.captureException(error, {
    extra: context,
    tags: {
      source: 'manual',
    },
  });
};

// Adicionar breadcrumb (contexto do que aconteceu antes do erro)
export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  if (__DEV__ && !ENABLED_IN_DEV) return;
  
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
};

// Capturar mensagem (não é erro, mas informação importante)
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  if (__DEV__ && !ENABLED_IN_DEV) {
    console.log('[Sentry] Would capture message:', message);
    return;
  }
  
  Sentry.captureMessage(message, level);
};

// Adicionar contexto adicional
export const setContext = (key: string, context: Record<string, any>) => {
  if (__DEV__ && !ENABLED_IN_DEV) return;
  
  Sentry.setContext(key, context);
};

/**
 * Envia um evento de teste ao Sentry (só em dev com ENABLED_IN_DEV).
 * Use para validar se o projeto está recebendo eventos.
 */
export const sendTestEvent = () => {
  if (!SENTRY_DSN || (__DEV__ && !ENABLED_IN_DEV)) return;
  Sentry.captureMessage('[HabitQuest] Teste de envio - desenvolvimento', 'info');
  Sentry.captureException(new Error('[HabitQuest] Teste de exception - desenvolvimento'));
};

