import { describe, it, expect } from 'vitest';
import { sanitizeHtml, escapeHtml, stripHtml } from './sanitize';

describe('sanitizeHtml', () => {
  it('should allow safe tags', () => {
    const input = '<p>Hello <strong>world</strong></p>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Hello <strong>world</strong></p>');
  });

  it('should remove script tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Hello</p>alert("xss")');
  });

  it('should remove onclick handlers', () => {
    const input = '<p onclick="alert(\'xss\')">Click me</p>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Click me</p>');
  });

  it('should remove javascript: URLs', () => {
    const input = '<a href="javascript:alert(\'xss\')">Click</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain('href="#"');
  });

  it('should add rel="noopener noreferrer" to links', () => {
    const input = '<a href="https://example.com">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain('rel="noopener noreferrer"');
    expect(result).toContain('target="_blank"');
  });

  it('should remove img tags', () => {
    const input = '<p>Hello</p><img src="x" onerror="alert(1)">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<img');
    expect(result).not.toContain('onerror');
  });
});

describe('escapeHtml', () => {
  it('should escape HTML entities', () => {
    const input = '<script>alert("xss")</script>';
    const result = escapeHtml(input);
    expect(result).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
  });

  it('should escape ampersands', () => {
    const input = 'foo & bar';
    const result = escapeHtml(input);
    expect(result).toBe('foo &amp; bar');
  });

  it('should handle empty strings', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('stripHtml', () => {
  it('should remove all HTML tags', () => {
    const input = '<p>Hello <strong>world</strong>!</p>';
    const result = stripHtml(input);
    expect(result).toBe('Hello world!');
  });

  it('should handle nested tags', () => {
    const input = '<div><p><span>Nested</span> content</p></div>';
    const result = stripHtml(input);
    expect(result).toBe('Nested content');
  });

  it('should handle empty strings', () => {
    expect(stripHtml('')).toBe('');
  });

  it('should decode HTML entities', () => {
    const input = '&lt;script&gt;';
    const result = stripHtml(input);
    expect(result).toBe('<script>');
  });
});
