/**
 * HTML sanitization utilities for preventing XSS attacks
 */

// Allowed HTML tags for message content
const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'strike', 's',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'span', 'div',
]);

// Allowed attributes per tag
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  span: new Set(['class']),
  div: new Set(['class']),
  pre: new Set(['class']),
  code: new Set(['class']),
};

// Dangerous URL schemes
const DANGEROUS_URL_SCHEMES = /^(javascript|data|vbscript):/i;

/**
 * Sanitize a URL to prevent javascript: and other dangerous schemes
 */
function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (DANGEROUS_URL_SCHEMES.test(trimmed)) {
    return '#';
  }
  return trimmed;
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * Allows only safe HTML tags and attributes
 */
export function sanitizeHtml(html: string): string {
  // Create a temporary container
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Walk through all elements and sanitize
  sanitizeNode(temp);

  return temp.innerHTML;
}

function sanitizeNode(node: Node): void {
  const children = Array.from(node.childNodes);

  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as Element;
      const tagName = element.tagName.toLowerCase();

      // Remove disallowed tags but keep their content
      if (!ALLOWED_TAGS.has(tagName)) {
        // Move children up to parent
        while (element.firstChild) {
          node.insertBefore(element.firstChild, element);
        }
        node.removeChild(element);
        continue;
      }

      // Remove disallowed attributes
      const allowedAttrs = ALLOWED_ATTRS[tagName] || new Set();
      const attrs = Array.from(element.attributes);

      for (const attr of attrs) {
        if (!allowedAttrs.has(attr.name)) {
          element.removeAttribute(attr.name);
        } else if (attr.name === 'href') {
          // Sanitize URLs
          element.setAttribute('href', sanitizeUrl(attr.value));
          // Force external links to open safely
          element.setAttribute('target', '_blank');
          element.setAttribute('rel', 'noopener noreferrer');
        }
      }

      // Remove event handlers (onclick, onerror, etc.)
      for (const attr of Array.from(element.attributes)) {
        if (attr.name.startsWith('on')) {
          element.removeAttribute(attr.name);
        }
      }

      // Recursively sanitize children
      sanitizeNode(element);
    }
  }
}

/**
 * Strip all HTML tags and return plain text
 */
export function stripHtml(html: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || '';
}
