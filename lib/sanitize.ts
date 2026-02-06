/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes all HTML tags and dangerous characters
 */
export function sanitizeHtml(input: string): string {
    if (!input) return '';

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize text content for safe storage and display
 * Trims whitespace and limits length
 */
export function sanitizeText(input: string, maxLength: number = 10000): string {
    if (!input) return '';

    const trimmed = input.trim();
    if (trimmed.length > maxLength) {
        return trimmed.substring(0, maxLength);
    }

    return trimmed;
}

/**
 * Validate and sanitize video note content
 */
export function sanitizeNote(content: string): string {
    if (!content || typeof content !== 'string') {
        throw new Error('Invalid note content');
    }

    const sanitized = sanitizeText(content, 5000);

    if (sanitized.length === 0) {
        throw new Error('Note content cannot be empty');
    }

    return sanitized;
}

/**
 * Validate and sanitize playlist/video names
 */
export function sanitizeName(name: string, maxLength: number = 200): string {
    if (!name || typeof name !== 'string') {
        throw new Error('Invalid name');
    }

    const sanitized = sanitizeText(name, maxLength);

    if (sanitized.length === 0) {
        throw new Error('Name cannot be empty');
    }

    // Remove special characters that could cause issues
    return sanitized.replace(/[<>:"/\\|?*\x00-\x1F]/g, '');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate YouTube video ID format
 */
export function isValidYouTubeId(id: string): boolean {
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

/**
 * Validate YouTube playlist ID format
 */
export function isValidPlaylistId(id: string): boolean {
    return /^(PL|UU|LL|FL|RD)[a-zA-Z0-9_-]+$/.test(id);
}
