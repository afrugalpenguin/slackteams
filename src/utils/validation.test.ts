import { describe, it, expect } from 'vitest';
import {
  validateGraphId,
  validateTeamId,
  validateChannelId,
  validateChatId,
  validateMessageId,
  validateUserId,
} from './validation';

describe('validateGraphId', () => {
  it('should accept valid GUIDs', () => {
    const guid = '12345678-1234-1234-1234-123456789abc';
    expect(validateGraphId(guid)).toBe(guid);
  });

  it('should accept valid Graph ID formats', () => {
    const id = '19:abc123@thread.tacv2';
    expect(validateGraphId(id)).toBe(id);
  });

  it('should trim whitespace', () => {
    const guid = '12345678-1234-1234-1234-123456789abc';
    expect(validateGraphId(`  ${guid}  `)).toBe(guid);
  });

  it('should reject empty strings', () => {
    expect(() => validateGraphId('')).toThrow('ID is required');
  });

  it('should reject null/undefined', () => {
    expect(() => validateGraphId(null as unknown as string)).toThrow('ID is required');
    expect(() => validateGraphId(undefined as unknown as string)).toThrow('ID is required');
  });

  it('should reject path traversal attempts', () => {
    expect(() => validateGraphId('../etc/passwd')).toThrow('invalid characters');
    expect(() => validateGraphId('foo/bar')).toThrow('invalid characters');
    expect(() => validateGraphId('foo\\bar')).toThrow('invalid characters');
  });

  it('should reject IDs that are too long', () => {
    const longId = 'a'.repeat(501);
    expect(() => validateGraphId(longId)).toThrow('too long');
  });

  it('should use custom field name in errors', () => {
    expect(() => validateGraphId('', 'Team ID')).toThrow('Team ID is required');
  });
});

describe('validateTeamId', () => {
  it('should accept valid team GUIDs', () => {
    const guid = '12345678-1234-1234-1234-123456789abc';
    expect(validateTeamId(guid)).toBe(guid);
  });

  it('should reject non-GUID formats', () => {
    expect(() => validateTeamId('not-a-guid')).toThrow('must be a valid GUID');
  });
});

describe('validateChannelId', () => {
  it('should accept channel ID formats', () => {
    const channelId = '19:abc123def456@thread.tacv2';
    expect(validateChannelId(channelId)).toBe(channelId);
  });
});

describe('validateChatId', () => {
  it('should accept chat ID formats', () => {
    const chatId = '19:abc123_def456@unq.gbl.spaces';
    expect(validateChatId(chatId)).toBe(chatId);
  });
});

describe('validateMessageId', () => {
  it('should accept message ID formats', () => {
    const messageId = '1234567890123';
    expect(validateMessageId(messageId)).toBe(messageId);
  });
});

describe('validateUserId', () => {
  it('should accept valid user GUIDs', () => {
    const guid = '12345678-1234-1234-1234-123456789abc';
    expect(validateUserId(guid)).toBe(guid);
  });

  it('should reject non-GUID formats', () => {
    expect(() => validateUserId('user@example.com')).toThrow('must be a valid GUID');
  });
});
