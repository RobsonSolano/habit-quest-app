import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { analytics } from '@/lib/analytics';
import { setSentryUser, clearSentryUser } from '@/lib/sentry';
import { handleError } from '@/lib/errorHandler';
import { showToast } from '@/lib/toast';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    // Timeout de segurança (10 segundos) — cobre getSession + fetchProfile
    // O clearTimeout só ocorre após fetchProfile completar, não antes
    timeoutId = setTimeout(() => {
      if (mounted) {
        logger.warn('AuthContext', 'Auth init timeout - forcing loading to false');
        setIsLoading(false);
      }
    }, 10000);

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;

        if (error) {
          logger.error('AuthContext', 'Error getting session', error);
          clearTimeout(timeoutId);
          setIsLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email).finally(() => {
            if (mounted) {
              clearTimeout(timeoutId);
              setIsLoading(false);
            }
          });
        } else {
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (!mounted) return;

        clearTimeout(timeoutId);
        logger.error('AuthContext', 'getSession failed', error);
        setIsLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email);
        } else {
          setProfile(null);
          clearSentryUser();
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data as Profile);
        // Identificar usuário no Sentry (só em produção)
        const profile = data as Profile;
        setSentryUser(userId, userEmail, profile.username || profile.name);
      }
    } catch (error) {
      handleError(error, {
        title: 'Erro ao carregar perfil',
        context: { userId, action: 'fetchProfile' },
        showToast: false, // Não mostrar toast para erros silenciosos
      });
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        showToast('error', 'Erro ao criar conta', error.message);
        return false;
      }

      if (data.user) {
        // Track signup
        analytics.identify(data.user.id, { email, name });
        analytics.trackSignUp('email');
        
        showToast('success', 'Conta criada! 🎉', `Bem-vindo, ${name}!`);
        return true;
      }

      return false;
    } catch (error) {
      handleError(error, {
        title: 'Erro ao criar conta',
        context: { action: 'signup', email },
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showToast('error', 'Erro ao fazer login', error.message);
        return false;
      }

      if (data.user) {
        // Track login
        analytics.identify(data.user.id, { email });
        analytics.trackLogin('email');
        
        showToast('success', 'Bem-vindo de volta! 👋', profile?.name || email);
        return true;
      }

      return false;
    } catch (error) {
      handleError(error, {
        title: 'Erro ao fazer login',
        context: { action: 'login', email },
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      analytics.trackLogout();
      clearSentryUser();
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      showToast('info', 'Até logo! 👋');
    } catch (error) {
      handleError(error, {
        title: 'Erro ao fazer logout',
        context: { action: 'logout' },
        showToast: false, // Logout não precisa mostrar erro
      });
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        profile, 
        session, 
        login, 
        signup, 
        logout, 
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
