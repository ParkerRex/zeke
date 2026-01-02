import { useCallback } from "react";

/**
 * Hook for tracking analytics events in the research dashboard
 * TODO: Re-enable when analytics is needed
 */
export function useAnalytics() {
  const track = useCallback((_eventName: string, _properties?: unknown) => {
    // Analytics disabled for now
  }, []);

  const trackTiming = useCallback(
    (_metric: string, _duration: number, _metadata?: unknown) => {
      // Analytics disabled for now
    },
    [],
  );

  const trackApiCall = useCallback(
    (
      _endpoint: string,
      _method: string,
      _responseTime: number,
      _statusCode: number,
    ) => {
      // Analytics disabled for now
    },
    [],
  );

  return {
    track,
    trackTiming,
    trackApiCall,
    context: {},
  };
}
