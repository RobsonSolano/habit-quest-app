import Toast from 'react-native-toast-message';

/**
 * Helper para mostrar Toast de forma segura, evitando erros de navigation context
 */
export const showToast = (
  type: 'success' | 'error' | 'info',
  text1: string,
  text2?: string,
  delay: number = 100
) => {
  setTimeout(() => {
    try {
      Toast.show({
        type,
        text1,
        text2,
      });
    } catch (error) {
      // Se o Toast falhar (ex: navigation context), apenas logar
      console.warn('[Toast] show failed:', error);
    }
  }, delay);
};

