import React from 'react';
import { PrivacyUtils } from './security';

// Analytics event types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  userAgent?: string;
  url?: string;
}

// Analytics configuration
interface AnalyticsConfig {
  enabled: boolean;
  sampleRate: number; // 0-1, percentage of events to track
  batchSize: number;
  flushInterval: number;
  privacyMode: boolean;
}

// Default configuration
const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  sampleRate: 0.1, // Track 10% of events
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  privacyMode: true,
};

class AnalyticsManager {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string;
  private flushTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    // Set up periodic flush
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('page_hidden');
      } else {
        this.track('page_visible');
      }
    });

    // Track before unload
    window.addEventListener('beforeunload', () => {
      this.track('session_end');
      this.flush(true); // Force immediate flush
    });

    this.isInitialized = true;
    this.track('session_start');
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track an event
  track(eventName: string, properties: Record<string, any> = {}): void {
    if (!this.config.enabled) return;

    // Sample events based on sample rate
    if (Math.random() > this.config.sampleRate) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: this.config.privacyMode
        ? PrivacyUtils.anonymizeUserData(properties)
        : properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    this.eventQueue.push(event);

    // Flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  // Track user interactions
  trackInteraction(element: string, action: string, details?: Record<string, any>): void {
    this.track('user_interaction', {
      element,
      action,
      ...details,
    });
  }

  // Track AI operations
  trackAIOperation(operation: string, success: boolean, duration?: number, metadata?: Record<string, any>): void {
    this.track('ai_operation', {
      operation,
      success,
      duration,
      ...metadata,
    });
  }

  // Track project operations
  trackProjectOperation(operation: 'create' | 'save' | 'load' | 'delete' | 'export', projectId?: string): void {
    this.track('project_operation', {
      operation,
      projectId: projectId ? PrivacyUtils.hashForLogging(projectId) : undefined,
    });
  }

  // Track errors
  trackError(error: Error, context?: Record<string, any>): void {
    this.track('error', {
      message: error.message,
      stack: this.config.privacyMode ? undefined : error.stack?.substring(0, 500),
      ...context,
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.track('performance', {
      metric,
      value,
      unit,
    });
  }

  // Flush events to analytics service
  private async flush(force = false): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // In production, send to your analytics endpoint
      if (process.env.NODE_ENV === 'production') {
        const response = await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events: eventsToSend }),
        });

        if (!response.ok) {
          throw new Error('Analytics upload failed');
        }
      } else {
        // In development, just log
        console.log('Analytics events:', eventsToSend);
      }
    } catch (error) {
      console.error('Failed to send analytics:', error);
      // Re-queue events on failure (unless forced)
      if (!force) {
        this.eventQueue.unshift(...eventsToSend);
      }
    }
  }

  // Get analytics insights (for admin dashboard)
  async getInsights(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    try {
      const response = await fetch(`/api/analytics/insights?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch insights');
      return await response.json();
    } catch (error) {
      console.error('Failed to get insights:', error);
      return null;
    }
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(true);
  }
}

// Global analytics instance
let analyticsInstance: AnalyticsManager | null = null;

export function getAnalytics(): AnalyticsManager {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsManager({
      enabled: process.env.NODE_ENV === 'production',
      sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // Sample all events in dev
      privacyMode: true,
    });
  }
  return analyticsInstance;
}

// React hook for analytics
export function useAnalytics() {
  const analytics = getAnalytics();

  return {
    track: analytics.track.bind(analytics),
    trackInteraction: analytics.trackInteraction.bind(analytics),
    trackAIOperation: analytics.trackAIOperation.bind(analytics),
    trackProjectOperation: analytics.trackProjectOperation.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
  };
}

// Analytics components
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  // Initialize analytics on mount
  React.useEffect(() => {
    getAnalytics();
    return () => {
      getAnalytics().destroy();
    };
  }, []);

  return <>{children}</>;
}

// Performance tracking hook
export function usePerformanceTracking(name: string) {
  const startTime = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    startTime.current = performance.now();
  }, []);

  React.useEffect(() => {
    return () => {
      if (startTime.current) {
        const duration = performance.now() - startTime.current;
        getAnalytics().trackPerformance(`${name}_duration`, duration);
      }
    };
  }, [name]);
}