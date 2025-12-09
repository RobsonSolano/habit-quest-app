import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { analytics } from '@/lib/analytics';
import { handleError } from '@/lib/errorHandler';
import { setSentryUser } from '@/lib/sentry';

WebBrowser.maybeCompleteAuthSession();

// Client IDs do Google OAuth
const GOOGLE_CLIENT_ID_WEB = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || '';
const GOOGLE_CLIENT_ID_IOS = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || '';
const GOOGLE_CLIENT_ID_ANDROID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || '';

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID_WEB,
    iosClientId: GOOGLE_CLIENT_ID_IOS || GOOGLE_CLIENT_ID_WEB,
    androidClientId: GOOGLE_CLIENT_ID_ANDROID || GOOGLE_CLIENT_ID_WEB,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        signInWithGoogle(id_token);
      }
    } else if (response?.type === 'error') {
      console.error('Google auth error:', response.error);
      Toast.show({
        type: 'error',
        text1: 'Erro ao fazer login',
        text2: 'Não foi possível autenticar com Google',
      });
    }
  }, [response]);

  const signInWithGoogle = async (idToken: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        handleError(error, {
          title: 'Erro ao fazer login',
          message: error.message,
        });
        throw error;
      }

      if (data.user) {
        // Track Google login
        analytics.identify(data.user.id, { 
          email: data.user.email,
          login_method: 'google',
        });
        analytics.trackLogin('google');
        
        // Identificar usuário no Sentry (só em produção)
        setSentryUser(data.user.id, data.user.email);
        
        Toast.show({
          type: 'success',
          text1: 'Login realizado! 🎉',
          text2: 'Bem-vindo ao HabitQuest!',
        });
      }

      return data;
    } catch (error) {
      handleError(error, {
        title: 'Erro ao fazer login',
        message: 'Não foi possível autenticar com Google',
        context: { action: 'google_signin' },
      });
      throw error;
    }
  };

  return {
    signIn: () => {
      if (!GOOGLE_CLIENT_ID_WEB) {
        Toast.show({
          type: 'error',
          text1: 'Configuração incompleta',
          text2: 'Google Client ID não configurado',
        });
        return;
      }
      promptAsync();
    },
    isLoading: !request,
  };
};

