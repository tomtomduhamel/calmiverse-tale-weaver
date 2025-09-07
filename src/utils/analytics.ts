/**
 * Commercial application analytics
 * Tracks usage patterns for business insights
 */

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp: string;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private maxEvents = 1000;
  private enabled: boolean;

  constructor() {
    this.enabled = !import.meta.env.DEV; // Only enabled in production
  }

  track(event: string, properties?: Record<string, any>, userId?: string) {
    if (!this.enabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      },
      userId,
      timestamp: new Date().toISOString()
    };

    this.events.push(analyticsEvent);
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // In production, you would send to analytics service
    this.sendToAnalytics(analyticsEvent);
  }

  private sendToAnalytics(event: AnalyticsEvent) {
    // Placeholder for analytics service integration
    // Could be Google Analytics, Mixpanel, etc.
    if (import.meta.env.DEV) {
      console.log('[Analytics]', event);
    }
  }

  // Business metrics tracking
  trackStoryCreation(userId: string, childrenCount: number, objective: string) {
    this.track('story_created', {
      children_count: childrenCount,
      objective_type: objective,
      feature: 'story_generation'
    }, userId);
  }

  trackStoryRead(storyId: string, userId: string, readingTime?: number) {
    this.track('story_read', {
      story_id: storyId,
      reading_time_seconds: readingTime,
      feature: 'story_reading'
    }, userId);
  }

  trackChildProfile(userId: string, action: 'created' | 'updated' | 'deleted') {
    this.track('child_profile', {
      action,
      feature: 'profile_management'
    }, userId);
  }

  trackFeatureUsage(feature: string, action: string, userId?: string) {
    this.track('feature_usage', {
      feature,
      action
    }, userId);
  }

  trackError(error: string, component?: string, userId?: string) {
    this.track('error_occurred', {
      error_message: error,
      component,
      severity: 'error'
    }, userId);
  }

  // User engagement metrics
  trackSessionStart(userId: string) {
    this.track('session_start', {
      platform: this.getPlatform()
    }, userId);
  }

  trackSessionEnd(userId: string, duration: number) {
    this.track('session_end', {
      duration_minutes: Math.round(duration / 60000),
      platform: this.getPlatform()
    }, userId);
  }

  private getPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (userAgent.includes('mobile')) return 'mobile';
    return 'desktop';
  }

  // Get stored events for manual sync
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

export const analytics = new Analytics();
