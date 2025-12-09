import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle } from 'lucide-react-native';
import { handleError } from '@/lib/errorHandler';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error (Sentry só em produção)
    handleError(error, {
      title: 'Erro no app',
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
      showToast: false, // Não mostrar toast aqui, já temos a UI
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-background">
          <ScrollView
            contentContainerClassName="flex-1 justify-center items-center px-6"
          >
            <View className="items-center">
              <View className="mb-4">
                <AlertTriangle size={64} color="#EF4444" />
              </View>
              <Text className="text-2xl font-bold text-foreground mb-2 text-center">
                Ops! Algo deu errado
              </Text>
              <Text className="text-muted-foreground text-center mb-6">
                O aplicativo encontrou um erro inesperado. Tente reiniciar o app.
              </Text>
              
              {__DEV__ && this.state.error && (
                <View className="bg-card border border-border rounded-lg p-4 mb-6 w-full">
                  <Text className="text-xs text-muted-foreground font-mono mb-2">
                    {this.state.error.message}
                  </Text>
                  {this.state.error.stack && (
                    <Text className="text-xs text-muted-foreground font-mono">
                      {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                onPress={this.handleReset}
                className="bg-primary px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold">Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

