import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

/**
 * Inicializa Sentry APENAS em produção
 * Em desenvolvimento, não faz nada (evita logs desnecessários)
 */
export const initSentry = () => {
  // Em desenvolvimento, não inicializar Sentry
  if (__DEV__) {
    console.log('[Sentry] Disabled in development mode');
    return;
  }

  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Performance Monitoring (100% das transações em produção)
    tracesSampleRate: 1.0,
    
    // Ambiente
    environment: 'production',
    
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
  if (__DEV__) return; // Não fazer nada em dev
  
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
};

// Limpar usuário (logout)
export const clearSentryUser = () => {
  if (__DEV__) return; // Não fazer nada em dev
  
  Sentry.setUser(null);
};

// Capturar erro manualmente (só funciona em produção)
export const captureError = (error: Error, context?: Record<string, any>) => {
  if (__DEV__) {
    // Em dev, só logar no console
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
  if (__DEV__) return; // Não fazer nada em dev
  
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
};

// Capturar mensagem (não é erro, mas informação importante)
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  if (__DEV__) {
    console.log('[Sentry] Would capture message:', message);
    return;
  }
  
  Sentry.captureMessage(message, level);
};

// Adicionar contexto adicional
export const setContext = (key: string, context: Record<string, any>) => {
  if (__DEV__) return; // Não fazer nada em dev
  
  Sentry.setContext(key, context);
};

