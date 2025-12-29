import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  beforeEach(() => {
    // Mock console methods
    console.log = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();

    // Enable logging for tests
    logger.configure({ enabled: true, minLevel: 'debug', sanitize: true });
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  describe('log levels', () => {
    it('should log debug messages when debug level is set', () => {
      logger.debug('test message');
      expect(console.log).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      logger.info('test message');
      expect(console.info).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      logger.warn('test message');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      logger.error('test message');
      expect(console.error).toHaveBeenCalled();
    });

    it('should respect minLevel setting', () => {
      logger.configure({ minLevel: 'warn' });

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('should not log when disabled', () => {
      logger.configure({ enabled: false });

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('sanitization', () => {
    it('should redact sensitive field names', () => {
      logger.debug('user data:', { password: 'secret123', username: 'john' });

      const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];
      const loggedObject = call[2];

      expect(loggedObject.password).toBe('[REDACTED]');
      expect(loggedObject.username).toBe('john');
    });

    it('should redact token fields', () => {
      logger.debug('auth:', {
        access_token: 'abc123',
        refresh_token: 'def456',
        id_token: 'ghi789',
        accessToken: 'jkl012',
        refreshToken: 'mno345',
        idToken: 'pqr678',
      });

      const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];
      const loggedObject = call[2];

      expect(loggedObject.access_token).toBe('[REDACTED]');
      expect(loggedObject.refresh_token).toBe('[REDACTED]');
      expect(loggedObject.id_token).toBe('[REDACTED]');
      expect(loggedObject.accessToken).toBe('[REDACTED]');
      expect(loggedObject.refreshToken).toBe('[REDACTED]');
      expect(loggedObject.idToken).toBe('[REDACTED]');
    });

    it('should redact other sensitive fields', () => {
      logger.debug('sensitive:', {
        secret: 'mysecret',
        key: 'mykey',
        auth: 'myauth',
        credential: 'mycred',
        bearer: 'mybearer',
      });

      const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];
      const loggedObject = call[2];

      expect(loggedObject.secret).toBe('[REDACTED]');
      expect(loggedObject.key).toBe('[REDACTED]');
      expect(loggedObject.auth).toBe('[REDACTED]');
      expect(loggedObject.credential).toBe('[REDACTED]');
      expect(loggedObject.bearer).toBe('[REDACTED]');
    });

    it('should mask JWT tokens in strings', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      logger.debug(`Token: ${jwt}`);

      const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];
      const message = call[1];

      expect(message).toContain('[REDACTED_TOKEN]');
      expect(message).not.toContain('eyJ');
    });

    it('should mask email addresses', () => {
      logger.debug('User email: john.doe@example.com');

      const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];
      const message = call[1];

      expect(message).toContain('***@example.com');
      expect(message).not.toContain('john.doe@');
    });

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(600);
      logger.debug(longString);

      const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];
      const message = call[1];

      expect(message.length).toBeLessThan(600);
      expect(message).toContain('...[truncated]');
    });

    it('should handle nested objects', () => {
      logger.debug('nested:', {
        level1: {
          level2: {
            password: 'secret',
            safe: 'value',
          },
        },
      });

      const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];
      const loggedObject = call[2];

      expect(loggedObject.level1.level2.password).toBe('[REDACTED]');
      expect(loggedObject.level1.level2.safe).toBe('value');
    });

    it('should handle deeply nested objects with depth limit', () => {
      const deep = { l1: { l2: { l3: { l4: { l5: { l6: 'value' } } } } } };
      logger.debug('deep:', deep);

      const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];
      const loggedObject = call[2];

      // Should hit depth limit and return '[nested]'
      expect(loggedObject.l1.l2.l3.l4.l5.l6).toBe('[nested]');
    });

    it('should handle arrays', () => {
      logger.debug('array:', ['user@example.com', 'test']);

      const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];
      const loggedArray = call[2];

      expect(loggedArray[0]).toBe('***@example.com');
      expect(loggedArray[1]).toBe('test');
    });

    it('should handle Error objects', () => {
      const error = new Error('test error with email@test.com');
      logger.error('error:', error);

      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
      const loggedError = call[2];

      expect(loggedError.name).toBe('Error');
      expect(loggedError.message).toContain('***@test.com');
    });

    it('should handle null and undefined', () => {
      logger.debug('null:', null, 'undefined:', undefined);

      const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];

      expect(call[2]).toBeNull();
      expect(call[4]).toBeUndefined();
    });

    it('should skip sanitization when disabled', () => {
      logger.configure({ sanitize: false });
      logger.debug('user data:', { password: 'secret123' });

      const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];
      const loggedObject = call[2];

      expect(loggedObject.password).toBe('secret123');
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      logger.configure({ enabled: false });
      logger.debug('test');
      expect(console.log).not.toHaveBeenCalled();

      logger.configure({ enabled: true });
      logger.debug('test');
      expect(console.log).toHaveBeenCalled();
    });

    it('should allow partial configuration', () => {
      logger.configure({ minLevel: 'error' });

      logger.warn('warn');
      logger.error('error');

      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('message formatting', () => {
    it('should include timestamp and level prefix', () => {
      logger.debug('test message');

      const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];
      const prefix = call[0];

      expect(prefix).toMatch(/\[\d{2}:\d{2}:\d{2}\] \[DEBUG\]/);
    });

    it('should pass through additional arguments', () => {
      logger.debug('message', 'arg1', 123, { name: 'value' });

      const call = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];

      expect(call[2]).toBe('arg1');
      expect(call[3]).toBe(123);
      expect(call[4]).toEqual({ name: 'value' });
    });
  });
});
