# 🍎 Configurar Apple Sign-In

Guia para adicionar login com Apple no HabitQuest.

> ⚠️ **Importante**: Apple Sign-In é **obrigatório** na App Store se você oferecer outros métodos de login social.

---

## 📋 Pré-requisitos

- Mac com Xcode instalado
- Conta Apple Developer ($99/ano)
- Projeto configurado no Supabase

---

## 🚀 Passo 1: Configurar Apple Developer Portal

### 1.1 Criar App ID

1. Acesse [developer.apple.com](https://developer.apple.com)
2. Vá em **Certificates, Identifiers & Profiles**
3. Clique em **Identifiers** > **+**
4. Selecione **App IDs** > **Continue**
5. Selecione **App** > **Continue**
6. Preencha:
   - **Description**: HabitQuest
   - **Bundle ID**: `com.habitquest.app` (Explicit)
7. Em **Capabilities**, marque ✅ **Sign In with Apple**
8. Clique em **Continue** > **Register**

### 1.2 Criar Service ID (para Supabase)

1. Em **Identifiers**, clique em **+**
2. Selecione **Services IDs** > **Continue**
3. Preencha:
   - **Description**: HabitQuest Web
   - **Identifier**: `com.habitquest.app.web`
4. Clique em **Continue** > **Register**
5. Clique no Service ID criado
6. Marque ✅ **Sign In with Apple**
7. Clique em **Configure**
8. Preencha:
   - **Primary App ID**: Selecione seu App ID
   - **Domains**: `SEU_PROJETO.supabase.co`
   - **Return URLs**: `https://SEU_PROJETO.supabase.co/auth/v1/callback`
9. Clique em **Save** > **Continue** > **Save**

### 1.3 Criar Key para Apple Sign-In

1. Vá em **Keys** > **+**
2. Preencha:
   - **Key Name**: HabitQuest Auth Key
3. Marque ✅ **Sign In with Apple**
4. Clique em **Configure**
5. Selecione seu App ID
6. Clique em **Save** > **Continue** > **Register**
7. **IMPORTANTE**: Baixe o arquivo `.p8` (só pode baixar 1 vez!)
8. Anote o **Key ID**

---

## 🗄️ Passo 2: Configurar Supabase

1. No Supabase Dashboard, vá em **Authentication** > **Providers**
2. Encontre **Apple** e clique para expandir
3. Habilite o toggle
4. Preencha:
   - **Service ID**: `com.habitquest.app.web`
   - **Secret Key**: Cole o conteúdo do arquivo `.p8`
   - **Key ID**: O Key ID que você anotou
   - **Team ID**: Encontre em [developer.apple.com](https://developer.apple.com) > Account > Membership
5. Clique em **Save**

---

## 📦 Passo 3: Instalar Dependências

```bash
npx expo install expo-apple-authentication
```

---

## 💻 Passo 4: Implementar no Código

### 4.1 Criar hook de autenticação Apple

Crie o arquivo `src/hooks/useAppleAuth.ts`:

```typescript
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export const useAppleAuth = () => {
  const isAvailable = Platform.OS === 'ios';

  const signIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) throw error;

        // Apple só retorna o nome na primeira vez
        // Salvar no profile se disponível
        if (credential.fullName?.givenName) {
          const fullName = [
            credential.fullName.givenName,
            credential.fullName.familyName,
          ].filter(Boolean).join(' ');

          if (data.user) {
            await supabase
              .from('profiles')
              .update({ name: fullName })
              .eq('id', data.user.id);
          }
        }

        return data;
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // Usuário cancelou
        return null;
      }
      throw error;
    }
  };

  return {
    signIn,
    isAvailable,
  };
};
```

### 4.2 Adicionar botão na tela de Auth

No `AuthScreen.tsx`, adicione:

```typescript
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAppleAuth } from '@/hooks/useAppleAuth';

// Dentro do componente:
const { signIn: signInWithApple, isAvailable: appleAvailable } = useAppleAuth();

// No JSX, adicione o botão (apenas iOS):
{appleAvailable && (
  <AppleAuthentication.AppleAuthenticationButton
    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
    cornerRadius={8}
    style={{ width: '100%', height: 48, marginTop: 16 }}
    onPress={signInWithApple}
  />
)}
```

---

## 🔧 Passo 5: Configurar app.json

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.habitquest.app",
      "usesAppleSignIn": true
    }
  }
}
```

---

## 🏗️ Passo 6: Configurar Xcode (para build nativo)

Se você ejetar para bare workflow ou usar EAS Build:

1. Abra o projeto no Xcode
2. Selecione o target do app
3. Vá em **Signing & Capabilities**
4. Clique em **+ Capability**
5. Adicione **Sign in with Apple**

---

## ✅ Passo 7: Testar

1. Rode no simulador iOS ou dispositivo real
2. Na tela de login, clique no botão "Sign in with Apple"
3. Autentique com Face ID/Touch ID
4. Você deve ser logado automaticamente

---

## 🐛 Troubleshooting

### Erro: "invalid_client"
- Verifique se o Service ID está correto
- Certifique-se de que o Team ID está certo

### Erro: "invalid_grant"
- Verifique se a Return URL está correta
- Deve ser: `https://SEU_PROJETO.supabase.co/auth/v1/callback`

### Nome não aparece após login
- Apple só retorna o nome na PRIMEIRA vez que o usuário faz login
- Se testar novamente, vá em Settings > Apple ID > Password & Security > Apps Using Apple ID > HabitQuest > Stop Using Apple ID
- Depois tente novamente

### Botão não aparece
- Apple Sign-In só funciona em iOS
- Verifique se `expo-apple-authentication` está instalado

---

## 📚 Referências

- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Supabase Apple Auth](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Apple Developer Docs](https://developer.apple.com/sign-in-with-apple/)

