type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const config: LoggerConfig = {
  enabled: import.meta.env.DEV,
  minLevel: 'debug',
};

function shouldLog(level: LogLevel): boolean {
  return config.enabled && LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
}

function formatMessage(level: LogLevel, message: string, ...args: unknown[]): unknown[] {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return [prefix, message, ...args];
}

export const logger = {
  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.log(...formatMessage('debug', message, ...args));
    }
  },

  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.info(...formatMessage('info', message, ...args));
    }
  },

  warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(...formatMessage('warn', message, ...args));
    }
  },

  error(message: string, ...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(...formatMessage('error', message, ...args));
    }
  },

  // Configure logger at runtime
  configure(options: Partial<LoggerConfig>): void {
    Object.assign(config, options);
  },
};

export default logger;
