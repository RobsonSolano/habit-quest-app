import { showToast } from './toast';
import { captureError as sentryCaptureError } from './sentry';
import { analytics } from './analytics';

/**
 * Trata erros de forma elegante:
 * - Em desenvolvimento: apenas mostra toast e loga no console
 * - Em produção: mostra toast + salva no Sentry
 */
export const handleError = (
  error: Error | unknown,
  options?: {
    title?: string;
    message?: string;
    context?: Record<string, any>;
    showToast?: boolean;
  }
) => {
  const err = error instanceof Error ? error : new Error(String(error));
  const { title = 'Ops! Algo deu errado', message, context, showToast: shouldShowToast = true } = options || {};

  // Log sempre no console
  console.error('[ErrorHandler]', err.message, context || '');

  // Toast sempre (se habilitado)
  if (shouldShowToast) {
    showToast('error', title, message || err.message || 'Tente novamente em instantes');
  }

  // Sentry apenas em produção
  if (!__DEV__) {
    sentryCaptureError(err, context);
    analytics.trackError('app_error', err.message);
  }
};

/**
 * Wrapper para funções assíncronas com tratamento automático de erro
 */
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    title?: string;
    message?: string;
    showToast?: boolean;
  }
): T => {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, options);
      throw error; // Re-throw para o caller decidir o que fazer
    }
  }) as T;
};

