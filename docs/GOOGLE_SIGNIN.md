# 🔐 Configurar Google Sign-In

Guia para adicionar login com Google no HabitQuest.

---

## 📋 Pré-requisitos

- Projeto configurado no Supabase
- Conta no Google Cloud Console
- App funcionando localmente

---

## 🚀 Passo 1: Configurar Google Cloud Console

### 1.1 Criar Projeto (se não tiver)

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Clique em **Select a project** > **New Project**
3. Nome: `HabitQuest`
4. Clique em **Create**

### 1.2 Configurar Tela de Consentimento OAuth

1. Vá em **APIs & Services** > **OAuth consent screen**
2. Selecione **External** e clique em **Create**
3. Preencha:
   - **App name**: HabitQuest
   - **User support email**: seu email
   - **Developer contact**: seu email
4. Clique em **Save and Continue**
5. Em **Scopes**, adicione:
   - `email`
   - `profile`
   - `openid`
6. Continue até finalizar

### 1.3 Criar Credenciais OAuth

1. Vá em **APIs & Services** > **Credentials**
2. Clique em **Create Credentials** > **OAuth client ID**

#### Para Android:

1. Application type: **Android**
2. Name: `HabitQuest Android`
3. Package name: `com.habitquest.app`
4. SHA-1 certificate fingerprint:
   ```bash
   # Para debug (desenvolvimento)
   cd android && ./gradlew signingReport
   # Copie o SHA1 de "debugAndroidTest"
   
   # Para release (produção)
   keytool -list -v -keystore your-release-key.keystore
   ```
5. Clique em **Create**
6. Copie o **Client ID**

#### Para iOS:

1. Application type: **iOS**
2. Name: `HabitQuest iOS`
3. Bundle ID: `com.habitquest.app`
4. Clique em **Create**
5. Copie o **Client ID**

#### Para Web (usado no Supabase):

1. Application type: **Web application**
2. Name: `HabitQuest Web`
3. Authorized redirect URIs:
   ```
   https://SEU_PROJETO.supabase.co/auth/v1/callback
   ```
4. Clique em **Create**
5. Copie o **Client ID** e **Client Secret**

---

## 🗄️ Passo 2: Configurar Supabase

1. No Supabase Dashboard, vá em **Authentication** > **Providers**
2. Encontre **Google** e clique para expandir
3. Habilite o toggle **Enable Sign in with Google**
4. Preencha:
   - **Client ID**: O Web Client ID
   - **Client Secret**: O Web Client Secret
5. Clique em **Save**

---

## 📦 Passo 3: Instalar Dependências

```bash
npx expo install expo-auth-session expo-crypto expo-web-browser
```

---

## 💻 Passo 4: Implementar no Código

### 4.1 Criar hook de autenticação Google

Crie o arquivo `src/hooks/useGoogleAuth.ts`:

```typescript
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

WebBrowser.maybeCompleteAuthSession();

// Substitua pelos seus Client IDs
const GOOGLE_CLIENT_ID_WEB = 'SEU_WEB_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_IOS = 'SEU_IOS_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_ANDROID = 'SEU_ANDROID_CLIENT_ID.apps.googleusercontent.com';

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID_WEB,
    iosClientId: GOOGLE_CLIENT_ID_IOS,
    androidClientId: GOOGLE_CLIENT_ID_ANDROID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      signInWithGoogle(id_token);
    }
  }, [response]);

  const signInWithGoogle = async (idToken: string) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }

    return data;
  };

  return {
    signIn: () => promptAsync(),
    isLoading: !request,
  };
};
```

### 4.2 Adicionar botão na tela de Auth

No `AuthScreen.tsx`, adicione:

```typescript
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

// Dentro do componente:
const { signIn: signInWithGoogle, isLoading: googleLoading } = useGoogleAuth();

// No JSX, adicione o botão:
<TouchableOpacity
  onPress={signInWithGoogle}
  disabled={googleLoading}
  className="flex-row items-center justify-center gap-2 py-3 bg-white rounded-lg mt-4"
>
  <Text className="text-gray-800 font-semibold">
    Continuar com Google
  </Text>
</TouchableOpacity>
```

---

## 🔧 Passo 5: Configurar app.json

Adicione as configurações no `app.json`:

```json
{
  "expo": {
    "scheme": "habitquest",
    "ios": {
      "bundleIdentifier": "com.habitquest.app",
      "config": {
        "googleSignIn": {
          "reservedClientId": "com.googleusercontent.apps.SEU_IOS_CLIENT_ID"
        }
      }
    },
    "android": {
      "package": "com.habitquest.app"
    }
  }
}
```

---

## ✅ Passo 6: Testar

1. Rode o app: `npm start`
2. Na tela de login, clique em "Continuar com Google"
3. Selecione sua conta Google
4. Você deve ser redirecionado e logado automaticamente

---

## 🐛 Troubleshooting

### Erro: "redirect_uri_mismatch"
- Verifique se a URL de callback está correta no Google Cloud Console
- Deve ser: `https://SEU_PROJETO.supabase.co/auth/v1/callback`

### Erro: "invalid_client"
- Verifique se os Client IDs estão corretos
- Certifique-se de usar o Client ID correto para cada plataforma

### Erro no Android: "DEVELOPER_ERROR"
- Verifique se o SHA-1 está correto
- Rode `./gradlew signingReport` e use o SHA1 correto
- O package name deve ser exatamente `com.habitquest.app`

### Não redireciona após login
- Verifique se o `scheme` está configurado no app.json
- Certifique-se de que `expo-web-browser` está instalado

---

## 📚 Referências

- [Expo AuthSession Docs](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Supabase Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com)

