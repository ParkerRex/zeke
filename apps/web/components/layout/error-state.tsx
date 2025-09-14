/**
 * Reusable error state component
 */

import { Button } from '@zeke/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@zeke/design-system/components/ui/card';
import { cn } from '@zeke/design-system/lib/utils';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  showSupport?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error. This might be a temporary issue.',
  onRetry,
  showRetry = true,
  showSupport = true,
  className,
  children,
}: ErrorStateProps) {
  return (
    <div className={cn('py-20', className)}>
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          <div className="space-y-2 text-muted-foreground text-sm">
            <p>• Check your internet connection</p>
            <p>• Try refreshing the page</p>
            <p>• If the problem persists, contact support</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {showRetry && onRetry && (
              <Button onClick={onRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            {showSupport && (
              <Button variant="outline" asChild>
                <a href="/contact">Contact Support</a>
              </Button>
            )}
          </div>

          {children}
        </CardContent>
      </Card>
    </div>
  );
}
