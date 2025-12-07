# 📊 Configurar Analytics e Error Tracking

Guia para adicionar Mixpanel (analytics) e Sentry (error tracking).

---

## 📈 Parte 1: Analytics com Mixpanel

Mixpanel ajuda a entender como os usuários usam o app.

### 1.1 Criar Conta Mixpanel

1. Acesse [mixpanel.com](https://mixpanel.com)
2. Crie uma conta gratuita (até 1M eventos/mês grátis)
3. Crie um projeto
4. Copie o **Project Token**

### 1.2 Instalar

```bash
npm install mixpanel-react-native
```

### 1.3 Criar Serviço de Analytics

Crie `src/lib/analytics.ts`:

```typescript
import { Mixpanel } from 'mixpanel-react-native';

const MIXPANEL_TOKEN = 'SEU_PROJECT_TOKEN';

class AnalyticsService {
  private mixpanel: Mixpanel;
  private initialized: boolean = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    
    this.mixpanel = new Mixpanel(MIXPANEL_TOKEN, true);
    await this.mixpanel.init();
    this.initialized = true;
  }

  // Identificar usuário
  identify(userId: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    
    this.mixpanel.identify(userId);
    if (properties) {
      this.mixpanel.getPeople().set(properties);
    }
  }

  // Resetar (logout)
  reset(): void {
    if (!this.initialized) return;
    this.mixpanel.reset();
  }

  // Rastrear evento
  track(event: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    this.mixpanel.track(event, properties);
  }

  // Eventos específicos do HabitQuest
  trackSignUp(method: 'email' | 'google' | 'apple'): void {
    this.track('Sign Up', { method });
  }

  trackLogin(method: 'email' | 'google' | 'apple'): void {
    this.track('Login', { method });
  }

  trackHabitCreated(habit: { name: string; frequency: string }): void {
    this.track('Habit Created', habit);
  }

  trackHabitCompleted(habit: { name: string; points: number; streak: number }): void {
    this.track('Habit Completed', habit);
  }

  trackStreakBroken(oldStreak: number): void {
    this.track('Streak Broken', { old_streak: oldStreak });
  }

  trackStreakMilestone(streak: number): void {
    this.track('Streak Milestone', { streak });
  }

  trackAchievementUnlocked(achievement: { title: string; type: string }): void {
    this.track('Achievement Unlocked', achievement);
  }

  trackFriendAdded(): void {
    this.track('Friend Added');
  }

  trackLevelUp(newLevel: number): void {
    this.track('Level Up', { level: newLevel });
  }

  trackScreenView(screenName: string): void {
    this.track('Screen View', { screen: screenName });
  }
}

export const analytics = new AnalyticsService();
```

### 1.4 Inicializar no App

No `App.tsx`:

```typescript
import { useEffect } from 'react';
import { analytics } from '@/lib/analytics';

export default function App() {
  useEffect(() => {
    analytics.init();
  }, []);

  // ...
}
```

### 1.5 Usar nos Componentes

```typescript
// No AuthContext após login bem-sucedido:
analytics.identify(user.id, {
  email: user.email,
  name: profile?.name,
});
analytics.trackLogin('email');

// No IndexScreen ao completar hábito:
analytics.trackHabitCompleted({
  name: habit.name,
  points: habit.points,
  streak: habit.streak + 1,
});

// Ao subir de nível:
analytics.trackLevelUp(newLevel);
```

---

## 🐛 Parte 2: Error Tracking com Sentry

Sentry captura erros e crashes automaticamente.

### 2.1 Criar Conta Sentry

1. Acesse [sentry.io](https://sentry.io)
2. Crie uma conta gratuita (5K erros/mês grátis)
3. Crie um projeto **React Native**
4. Copie o **DSN**

### 2.2 Instalar

```bash
npx expo install @sentry/react-native
```

### 2.3 Configurar

Crie `src/lib/sentry.ts`:

```typescript
import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = 'https://xxx@xxx.ingest.sentry.io/xxx';

export const initSentry = () => {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: 1.0,
    
    // Session Replay (opcional)
    _experiments: {
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    },
    
    // Ambiente
    environment: __DEV__ ? 'development' : 'production',
    
    // Ignorar erros comuns
    ignoreErrors: [
      'Network request failed',
      'timeout',
    ],
    
    // Antes de enviar
    beforeSend(event) {
      // Não enviar em dev
      if (__DEV__) {
        return null;
      }
      return event;
    },
  });
};

// Identificar usuário
export const setUser = (userId: string, email?: string) => {
  Sentry.setUser({
    id: userId,
    email,
  });
};

// Limpar usuário (logout)
export const clearUser = () => {
  Sentry.setUser(null);
};

// Capturar erro manualmente
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

// Adicionar breadcrumb
export const addBreadcrumb = (message: string, category: string) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
  });
};

// Capturar mensagem
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};
```

### 2.4 Inicializar no App

No `App.tsx`:

```typescript
import { initSentry } from '@/lib/sentry';

// ANTES de qualquer outro código
initSentry();

export default function App() {
  // ...
}
```

### 2.5 Configurar app.json

```json
{
  "expo": {
    "plugins": [
      [
        "@sentry/react-native/expo",
        {
          "organization": "sua-org",
          "project": "habitquest"
        }
      ]
    ],
    "hooks": {
      "postPublish": [
        {
          "file": "sentry-expo/upload-sourcemaps",
          "config": {
            "organization": "sua-org",
            "project": "habitquest"
          }
        }
      ]
    }
  }
}
```

### 2.6 Usar nos Componentes

```typescript
import { captureError, setUser, addBreadcrumb } from '@/lib/sentry';

// No AuthContext após login:
setUser(user.id, user.email);

// Em try/catch:
try {
  await someOperation();
} catch (error) {
  captureError(error as Error, { 
    context: 'habit_completion',
    habitId: habit.id,
  });
}

// Adicionar contexto:
addBreadcrumb('User started completing habit', 'user-action');
```

### 2.7 Error Boundary

Crie `src/components/ErrorBoundary.tsx`:

```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Sentry from '@sentry/react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-background items-center justify-center p-6">
          <Text className="text-4xl mb-4">😢</Text>
          <Text className="text-xl font-bold text-foreground mb-2">
            Ops! Algo deu errado
          </Text>
          <Text className="text-muted-foreground text-center mb-6">
            Ocorreu um erro inesperado. Por favor, tente novamente.
          </Text>
          <TouchableOpacity
            onPress={this.handleRetry}
            className="bg-primary px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default Sentry.withErrorBoundary(ErrorBoundary, {
  showDialog: true,
});
```

Use no `App.tsx`:

```typescript
import ErrorBoundary from '@/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      {/* ... resto do app */}
    </ErrorBoundary>
  );
}
```

---

## 📊 Métricas Importantes para Acompanhar

### No Mixpanel

1. **Retenção**: Quantos usuários voltam no D1, D7, D30
2. **Funil de onboarding**: Signup → Criar hábito → Completar hábito
3. **Engajamento**: Média de hábitos completados/dia
4. **Ofensiva**: Média de streak antes de quebrar
5. **Social**: % de usuários com amigos

### No Sentry

1. **Crash-free rate**: % de sessões sem crash
2. **Erros mais comuns**: Quais erros aparecem mais
3. **Performance**: Tempo de carregamento de telas

---

## 🔧 Variáveis de Ambiente

Adicione no `.env`:

```env
EXPO_PUBLIC_MIXPANEL_TOKEN=seu_token
EXPO_PUBLIC_SENTRY_DSN=seu_dsn
```

E use:

```typescript
const MIXPANEL_TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN!;
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN!;
```

---

## 📚 Referências

- [Mixpanel React Native](https://developer.mixpanel.com/docs/react-native)
- [Sentry React Native](https://docs.sentry.io/platforms/react-native/)
- [Expo + Sentry](https://docs.expo.dev/guides/using-sentry/)

