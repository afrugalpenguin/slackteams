type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  sanitize: boolean;
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
  sanitize: true,
};

// Sensitive field patterns to redact
const SENSITIVE_KEYS = /^(password|token|secret|key|auth|credential|bearer|access_token|refresh_token|id_token|accessToken|refreshToken|idToken)$/i;
const EMAIL_PATTERN = /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
const TOKEN_PATTERN = /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g;

/**
 * Sanitize data before logging to prevent sensitive info exposure
 */
function sanitizeValue(value: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 5) return '[nested]';

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    // Mask JWT tokens
    let sanitized = value.replace(TOKEN_PATTERN, '[REDACTED_TOKEN]');
    // Mask email local part
    sanitized = sanitized.replace(EMAIL_PATTERN, '***@$2');
    // Truncate very long strings
    if (sanitized.length > 500) {
      sanitized = sanitized.slice(0, 500) + '...[truncated]';
    }
    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    // Handle Error objects specially
    if (value instanceof Error) {
      return {
        name: value.name,
        message: sanitizeValue(value.message, depth + 1),
        // Don't include full stack in production
        stack: config.enabled ? value.stack : undefined,
      };
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEYS.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeValue(val, depth + 1);
      }
    }
    return sanitized;
  }

  return value;
}

function sanitizeArgs(args: unknown[]): unknown[] {
  if (!config.sanitize) return args;
  return args.map((arg) => sanitizeValue(arg));
}

function shouldLog(level: LogLevel): boolean {
  return config.enabled && LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
}

function formatMessage(level: LogLevel, message: string, ...args: unknown[]): unknown[] {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  const sanitizedMessage = config.sanitize ? sanitizeValue(message) : message;
  const sanitizedArgs = sanitizeArgs(args);
  return [prefix, sanitizedMessage, ...sanitizedArgs];
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
