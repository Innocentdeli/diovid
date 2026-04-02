import DOMPurify from 'isomorphic-dompurify';
import { JSDOM } from 'jsdom';

// Security utilities
export class SecurityUtils {
  // Input sanitization for HTML content
  static sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'span', 'div'
      ],
      ALLOWED_ATTR: ['class', 'style'],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover']
    });
  }

  // Sanitize plain text
  static sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/data:\w+\/[\w\.\-]+;base64,/gi, '[BASE64_DATA]') // Mask base64 data
      .trim()
      .substring(0, 50000); // Reasonable length limit
  }

  // Validate file upload
  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
    }

    // Check file name for malicious patterns
    const fileName = file.name.toLowerCase();
    const dangerousPatterns = [
      /\.\./, // Directory traversal
      /[<>:"|?*]/, // Invalid filename characters
      /\.(exe|bat|cmd|com|scr|pif|js|vb|vbs|wsf|wsh)$/ // Executable extensions
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(fileName)) {
        return { valid: false, error: 'Invalid filename' };
      }
    }

    return { valid: true };
  }

  // Rate limiting helper
  static checkRateLimit(
    identifier: string,
    limits: { windowMs: number; maxRequests: number },
    store: Map<string, { count: number; resetTime: number }>
  ): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const record = store.get(identifier);

    if (!record || now > record.resetTime) {
      store.set(identifier, {
        count: 1,
        resetTime: now + limits.windowMs
      });
      return { allowed: true };
    }

    if (record.count >= limits.maxRequests) {
      return { allowed: false, resetTime: record.resetTime };
    }

    record.count++;
    return { allowed: true };
  }

  // Content moderation (basic implementation)
  static moderateContent(text: string): { approved: boolean; reason?: string } {
    const lowerText = text.toLowerCase();

    // Basic content filters (expand as needed)
    const prohibitedTerms = [
      'violence', 'hate', 'discrimination', 'illegal',
      'nsfw', 'adult', 'explicit', 'offensive'
    ];

    for (const term of prohibitedTerms) {
      if (lowerText.includes(term)) {
        return {
          approved: false,
          reason: 'Content contains prohibited terms'
        };
      }
    }

    // Length checks
    if (text.length > 100000) {
      return {
        approved: false,
        reason: 'Content exceeds maximum length'
      };
    }

    return { approved: true };
  }

  // Generate secure filename
  static generateSecureFilename(originalName: string): string {
    const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}.${ext}`;
  }

  // Hash sensitive data for logging
  static hashForLogging(data: string): string {
    // Simple hash for logging purposes (not for security)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // GDPR compliance: Data anonymization
  static anonymizeUserData(data: any): any {
    if (typeof data !== 'object' || data === null) return data;

    const anonymized = { ...data };

    // Remove or hash PII fields
    const piiFields = ['email', 'name', 'phone', 'address', 'ip'];
    for (const field of piiFields) {
      if (anonymized[field]) {
        anonymized[field] = this.hashForLogging(anonymized[field]);
      }
    }

    return anonymized;
  }

  // CORS headers for API responses
  static getSecureHeaders(origin?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    };

    // CORS headers
    if (origin) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      headers['Access-Control-Max-Age'] = '86400';
    }

    return headers;
  }
}

// Privacy compliance utilities
export class PrivacyUtils {
  // Cookie consent management
  static setCookieConsent(consent: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  }): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookie-consent', JSON.stringify({
        ...consent,
        timestamp: Date.now()
      }));
    }
  }

  static getCookieConsent(): {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  } | null {
    if (typeof window === 'undefined') return null;

    try {
      const consent = localStorage.getItem('cookie-consent');
      return consent ? JSON.parse(consent) : null;
    } catch {
      return null;
    }
  }

  // Data export for GDPR
  static async exportUserData(userId: string): Promise<any> {
    // This would integrate with your data storage to export all user data
    // For now, return a placeholder structure
    return {
      userId,
      exportDate: new Date().toISOString(),
      data: {
        projects: [],
        preferences: {},
        activity: []
      }
    };
  }

  // Data anonymization for analytics
  static anonymizeUserData(data: any): any {
    if (typeof data !== 'object' || data === null) return data;

    const anonymized = { ...data };

    // Remove or hash PII fields
    const piiFields = ['email', 'name', 'phone', 'address', 'ip', 'userId'];
    for (const field of piiFields) {
      if (anonymized[field]) {
        anonymized[field] = SecurityUtils.hashForLogging(anonymized[field]);
      }
    }

    return anonymized;
  }

  // Data deletion for GDPR
  static async deleteUserData(userId: string): Promise<boolean> {
    try {
      // This would delete all user data from your systems
      // localStorage.clear(); // For client-side
      // Call your backend APIs to delete server-side data
      console.log(`Deleting data for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete user data:', error);
      return false;
    }
  }

  // Hash sensitive data for logging
  static hashForLogging(data: string): string {
    return SecurityUtils.hashForLogging(data);
  }
}