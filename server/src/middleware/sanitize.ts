import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 * Strips all HTML tags and attributes
 */
export function sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], // Strip ALL HTML tags
        ALLOWED_ATTR: [], // Strip ALL attributes
    });
}

/**
 * Sanitize but allow basic formatting (bold, italic, links)
 * Use for rich text content like notices
 */
export function sanitizeRichText(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'a', 'br', 'p'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
        ALLOW_DATA_ATTR: false,
    });
}

/**
 * Check if input contains potential XSS payload
 * Useful for logging/monitoring
 */
export function containsXSS(input: string): boolean {
    if (!input) return false;

    const patterns = [
        /<script\b/i,
        /javascript:/i,
        /on\w+\s*=/i,  // onclick=, onerror=, etc.
        /<iframe\b/i,
        /<embed\b/i,
        /<object\b/i,
    ];

    return patterns.some(p => p.test(input));
}
