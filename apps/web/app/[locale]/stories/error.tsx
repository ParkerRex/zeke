/**
 * Error boundary for stories section
 */

'use client';

import { useEffect } from 'react';
import { ErrorState } from '../../../components/layout';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Stories error:', error);
  }, [error]);

  return (
    <div className="container mx-auto">
      <ErrorState
        title="Failed to load stories"
        description="We encountered an error while loading the stories. This might be a temporary issue with our data source."
        onRetry={reset}
      >
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm font-medium">
              Error Details (Development)
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </ErrorState>
    </div>
  );
}
