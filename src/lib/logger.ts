// Logger simplificado - apenas console logs para evitar problemas com file system
// Os logs aparecem no terminal/console do Expo

// Formatar timestamp
const getTimestamp = () => {
  try {
    return new Date().toISOString();
  } catch {
    return new Date().toLocaleString();
  }
};

// Formatar dados para log (simplificado para evitar problemas)
const formatData = (data?: any): string => {
  if (!data) return '';
  try {
    // Limitar tamanho para não sobrecarregar
    const str = JSON.stringify(data);
    return str.length > 500 ? ` ${str.substring(0, 500)}...` : ` ${str}`;
  } catch (error) {
    return ` [Data could not be stringified]`;
  }
};

// Wrapper seguro para evitar que erros no logger quebrem o app
const safeLog = (fn: () => void) => {
  try {
    fn();
  } catch (error) {
    // Se o logger falhar, usar console básico
    console.log('[Logger] Failed to log:', error);
  }
};

export const logger = {
  // Log simples
  log: (category: string, message: string, data?: any) => {
    safeLog(() => {
      const timestamp = getTimestamp();
      const logMessage = `[${timestamp}] [${category}] ${message}${formatData(data)}`;
      console.log(logMessage);
    });
  },

  // Log de erro
  error: (category: string, message: string, error?: any) => {
    safeLog(() => {
      const timestamp = getTimestamp();
      const errorData = error ? {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined,
      } : null;
      const logMessage = `[${timestamp}] [ERROR] [${category}] ${message}${formatData(errorData)}`;
      console.error(logMessage);
    });
  },

  // Log de warning
  warn: (category: string, message: string, data?: any) => {
    safeLog(() => {
      const timestamp = getTimestamp();
      const logMessage = `[${timestamp}] [WARN] [${category}] ${message}${formatData(data)}`;
      console.warn(logMessage);
    });
  },

  // Inicialização (não faz nada agora, mas mantém compatibilidade)
  init: async () => {
    try {
      logger.log('Logger', 'Logger initialized (console mode)');
    } catch (error) {
      console.log('[Logger] Init failed, using basic console');
    }
  },
};


