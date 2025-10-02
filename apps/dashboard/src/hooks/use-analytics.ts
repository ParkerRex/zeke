import { api } from "@/trpc/client";
import {
  type EventContext,
  ResearchEvents,
} from "@zeke/events/research-events";
import { useCallback, useEffect } from "react";

/**
 * Hook for tracking analytics events in the research dashboard
 * Provides type-safe event tracking with automatic context enrichment
 */
export function useAnalytics() {
  const { data: workspace } = api.workspace.get.useQuery();

  // Build context from workspace data
  const context: EventContext = {
    teamId: workspace?.team?.id || "unknown",
    userId: workspace?.user?.id || "unknown",
    sessionId:
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("sessionId") || generateSessionId()
        : "server",
    timestamp: new Date().toISOString(),
    subscriptionTier:
      workspace?.team?.subscriptionStatus === "active"
        ? "paid"
        : workspace?.team?.subscriptionStatus === "trialing"
          ? "trial"
          : "free",
    deviceType: getDeviceType(),
    browserInfo: getBrowserInfo(),
  };

  // Track page views automatically
  useEffect(() => {
    track("DashboardView", {
      source: "navigation",
      hasNotifications: (workspace?.navCounts?.notifications || 0) > 0,
    });
  }, []);

  /**
   * Track an event with properties
   */
  const track = useCallback(
    <T extends keyof typeof ResearchEvents>(eventName: T, properties?: any) => {
      const event = ResearchEvents[eventName];

      // In development, log to console
      if (process.env.NODE_ENV === "development") {
        console.log(`[Analytics] ${event.name}`, {
          ...context,
          ...properties,
        });
      }

      // Send to analytics service
      if (typeof window !== "undefined" && window.analytics) {
        window.analytics.track(event.name, {
          ...context,
          ...properties,
          channel: event.channel,
        });
      }

      // Also send to backend for server-side analytics
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: event.name,
          properties: {
            ...context,
            ...properties,
          },
        }),
      }).catch((err) => {
        console.error("Failed to send analytics event:", err);
      });
    },
    [context],
  );

  /**
   * Track timing events (for performance monitoring)
   */
  const trackTiming = useCallback(
    (metric: string, duration: number, metadata?: any) => {
      track("PageLoadTime", {
        page: window.location.pathname,
        loadTimeMs: duration,
        ...metadata,
      });
    },
    [track],
  );

  /**
   * Track API performance
   */
  const trackApiCall = useCallback(
    (
      endpoint: string,
      method: string,
      responseTime: number,
      statusCode: number,
    ) => {
      track("ApiResponseTime", {
        endpoint,
        method,
        responseTimeMs: responseTime,
        statusCode,
      });
    },
    [track],
  );

  return {
    track,
    trackTiming,
    trackApiCall,
    context,
  };
}

/**
 * Utility functions
 */
function generateSessionId(): string {
  const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem("sessionId", id);
  }
  return id;
}

function getDeviceType(): "desktop" | "tablet" | "mobile" {
  if (typeof window === "undefined") return "desktop";

  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function getBrowserInfo() {
  if (typeof navigator === "undefined") return undefined;

  const ua = navigator.userAgent;
  let name = "Unknown";
  let version = "0";

  if (ua.includes("Chrome")) {
    name = "Chrome";
    version = ua.match(/Chrome\/(\d+)/)?.[1] || "0";
  } else if (ua.includes("Safari")) {
    name = "Safari";
    version = ua.match(/Version\/(\d+)/)?.[1] || "0";
  } else if (ua.includes("Firefox")) {
    name = "Firefox";
    version = ua.match(/Firefox\/(\d+)/)?.[1] || "0";
  }

  return { name, version };
}
