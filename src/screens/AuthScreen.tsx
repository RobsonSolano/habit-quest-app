import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

const AuthScreen = () => {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) return;
    setLoginLoading(true);
    await login(loginEmail, loginPassword);
    setLoginLoading(false);
  };

  const handleSignup = async () => {
    if (!signupName || !signupEmail || !signupPassword) return;
    setSignupLoading(true);
    await signup(signupEmail, signupPassword, signupName);
    setSignupLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-1 justify-center px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center mb-12">
            <Text className="text-5xl font-bold text-transparent bg-gradient-to-r from-primary to-secondary mb-2">
              HabitQuest
            </Text>
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} color="#8B5CF6" />
              <Text className="text-muted-foreground">
                Transforme sua vida, um hábito por vez
              </Text>
            </View>
          </View>

          {/* Tabs */}
          <View className="flex-row mb-6 bg-card rounded-lg p-1">
            <TouchableOpacity
              onPress={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-md ${
                isLogin ? 'bg-primary' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  isLogin ? 'text-white' : 'text-muted-foreground'
                }`}
              >
                Entrar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-md ${
                !isLogin ? 'bg-primary' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  !isLogin ? 'text-white' : 'text-muted-foreground'
                }`}
              >
                Cadastrar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card */}
          <Card className="mb-6">
            {isLogin ? (
              <View className="space-y-4">
                <Input
                  label="Email"
                  placeholder="seu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                />
                <Input
                  label="Senha"
                  placeholder="••••••••"
                  secureTextEntry
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                />
                <Button
                  variant="primary"
                  onPress={handleLogin}
                  loading={loginLoading}
                  disabled={!loginEmail || !loginPassword}
                  className="mt-2"
                >
                  Entrar
                </Button>
                <Text className="text-xs text-muted-foreground text-center mt-4">
                  💡 Dica: Apenas para validação - use qualquer email/senha
                </Text>
              </View>
            ) : (
              <View className="space-y-4">
                <Input
                  label="Nome"
                  placeholder="Seu nome"
                  value={signupName}
                  onChangeText={setSignupName}
                />
                <Input
                  label="Email"
                  placeholder="seu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={signupEmail}
                  onChangeText={setSignupEmail}
                />
                <Input
                  label="Senha"
                  placeholder="••••••••"
                  secureTextEntry
                  value={signupPassword}
                  onChangeText={setSignupPassword}
                />
                <Button
                  variant="primary"
                  onPress={handleSignup}
                  loading={signupLoading}
                  disabled={!signupName || !signupEmail || !signupPassword}
                  className="mt-2"
                >
                  Criar Conta
                </Button>
              </View>
            )}
          </Card>

          {/* Footer */}
          <View className="items-center">
            <View className="flex-row items-center bg-muted/50 rounded-full px-6 py-3">
              <Text className="text-sm text-muted-foreground">
                🎮 Ganhe XP • 🏆 Conquiste medalhas • 🔥 Mantenha streaks
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthScreen;

