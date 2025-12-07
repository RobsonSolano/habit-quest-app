# 🎨 Configurar App Icon e Splash Screen

Guia para customizar ícone e tela de splash do HabitQuest.

---

## 📐 Especificações

### App Icon

| Plataforma | Tamanho | Formato | Notas |
|------------|---------|---------|-------|
| iOS | 1024x1024 | PNG | Sem transparência, cantos arredondados automáticos |
| Android | 1024x1024 | PNG | Adaptive icon (foreground + background) |

### Splash Screen

| Plataforma | Tamanho | Formato |
|------------|---------|---------|
| Ambos | 1284x2778 | PNG |

---

## 🎨 Passo 1: Criar os Assets

### 1.1 App Icon

Crie uma imagem quadrada de **1024x1024 pixels**:

1. Use Figma, Photoshop, ou qualquer editor
2. Design sugerido para HabitQuest:
   - Background: Gradiente roxo (#8B5CF6 → #7C3AED)
   - Ícone: Emoji 🎯 ou símbolo de check
   - Bordas: Sem bordas (iOS adiciona automaticamente)

3. Exporte como PNG sem transparência

### 1.2 Adaptive Icon (Android)

O Android usa dois layers:
- **Foreground**: O ícone em si (com transparência)
- **Background**: Cor sólida ou gradiente

Crie duas imagens:
- `adaptive-icon.png` (1024x1024) - foreground com transparência
- Use cor de background no app.json

### 1.3 Splash Screen

Crie uma imagem vertical:
1. Tamanho: **1284x2778 pixels** (proporção iPhone)
2. Coloque o logo centralizado
3. Use a mesma cor de fundo do app (#0F172A)

---

## 📁 Passo 2: Organizar Assets

Coloque os arquivos na pasta `assets/`:

```
assets/
├── icon.png              # 1024x1024 - App icon
├── adaptive-icon.png     # 1024x1024 - Foreground Android
├── splash.png            # 1284x2778 - Splash screen
└── favicon.png           # 48x48 - Para web
```

---

## 🔧 Passo 3: Configurar app.json

```json
{
  "expo": {
    "name": "HabitQuest",
    "slug": "habit-quest",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F172A"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.habitquest.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0F172A"
      },
      "package": "com.habitquest.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

---

## 🎭 Passo 4: Splash Screen Animada (Opcional)

Para uma splash screen mais profissional com animação:

### 4.1 Instalar

```bash
npx expo install expo-splash-screen
```

### 4.2 Criar componente de splash

Crie `src/components/AnimatedSplash.tsx`:

```typescript
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

interface Props {
  onFinish: () => void;
}

export const AnimatedSplash = ({ onFinish }: Props) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Esconder splash nativa
    SplashScreen.hideAsync();

    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Depois de 2s, chamar onFinish
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(onFinish);
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.Text style={styles.icon}>🎯</Animated.Text>
        <Animated.Text style={styles.title}>HabitQuest</Animated.Text>
        <Animated.Text style={styles.subtitle}>
          Transforme sua vida
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748B',
  },
});
```

### 4.3 Usar no App

No `App.tsx`:

```typescript
import { useState } from 'react';
import { AnimatedSplash } from '@/components/AnimatedSplash';

export default function App() {
  const [splashFinished, setSplashFinished] = useState(false);

  if (!splashFinished) {
    return <AnimatedSplash onFinish={() => setSplashFinished(true)} />;
  }

  return (
    // ... resto do app
  );
}
```

---

## 🛠️ Ferramentas Úteis

### Geradores de Ícone

- [Icon Kitchen](https://icon.kitchen) - Gera ícones para todas as plataformas
- [App Icon Generator](https://appicon.co) - Upload e gera todos os tamanhos
- [Figma](https://figma.com) - Design do zero

### Geradores de Splash

- [Ape Tools](https://apetools.webprofusion.com) - Gera splash screens
- [Expo Splash Screen Generator](https://github.com/expo/expo/tree/main/packages/expo-splash-screen)

---

## 📱 Testando

```bash
# Limpar cache e rodar
npx expo start --clear
```

No simulador/emulador:
1. Feche o app completamente
2. Abra novamente
3. Observe a splash screen

---

## 🐛 Troubleshooting

### Ícone não atualiza
```bash
# Limpar cache
npx expo start --clear

# Ou rebuildar
eas build --platform android --profile preview
```

### Splash aparece cortada
- Verifique o `resizeMode` no app.json
- Use `contain` para não cortar, `cover` para preencher

### Cor de fundo errada
- Verifique se `backgroundColor` está igual no app.json e na imagem

---

## 📚 Referências

- [Expo App Icon](https://docs.expo.dev/develop/user-interface/app-icons/)
- [Expo Splash Screen](https://docs.expo.dev/develop/user-interface/splash-screen/)
- [iOS Human Interface Guidelines - App Icon](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Adaptive Icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)

