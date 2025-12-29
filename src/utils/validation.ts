/**
 * Input validation utilities for Microsoft Graph API
 */

// Graph API IDs are typically GUIDs or base64-encoded strings
// GUID format: 8-4-4-4-12 hex characters
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Chat IDs and some other IDs use a longer format with colons and special chars
const GRAPH_ID_PATTERN = /^[a-zA-Z0-9_:@.-]+$/;

/**
 * Validate a Microsoft Graph API ID
 * Prevents injection attacks by ensuring IDs only contain safe characters
 */
export function validateGraphId(id: string, fieldName = 'ID'): string {
  if (!id || typeof id !== 'string') {
    throw new Error(`${fieldName} is required`);
  }

  const trimmed = id.trim();

  if (trimmed.length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }

  if (trimmed.length > 500) {
    throw new Error(`${fieldName} is too long`);
  }

  // Check for path traversal attempts
  if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
    throw new Error(`${fieldName} contains invalid characters`);
  }

  // Must match either GUID or general Graph ID pattern
  if (!GUID_PATTERN.test(trimmed) && !GRAPH_ID_PATTERN.test(trimmed)) {
    throw new Error(`${fieldName} contains invalid characters`);
  }

  return trimmed;
}

/**
 * Validate a team ID (must be a GUID)
 */
export function validateTeamId(id: string): string {
  const trimmed = validateGraphId(id, 'Team ID');

  if (!GUID_PATTERN.test(trimmed)) {
    throw new Error('Team ID must be a valid GUID');
  }

  return trimmed;
}

/**
 * Validate a channel ID (must be a GUID or special format)
 */
export function validateChannelId(id: string): string {
  return validateGraphId(id, 'Channel ID');
}

/**
 * Validate a chat ID (uses base64-like format)
 */
export function validateChatId(id: string): string {
  return validateGraphId(id, 'Chat ID');
}

/**
 * Validate a message ID
 */
export function validateMessageId(id: string): string {
  return validateGraphId(id, 'Message ID');
}

/**
 * Validate a user ID (must be a GUID)
 */
export function validateUserId(id: string): string {
  const trimmed = validateGraphId(id, 'User ID');

  if (!GUID_PATTERN.test(trimmed)) {
    throw new Error('User ID must be a valid GUID');
  }

  return trimmed;
}
