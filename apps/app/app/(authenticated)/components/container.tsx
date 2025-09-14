import React from 'react';

import { cn } from '@zeke/design-system/lib/utils';

export const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn('container', className)} ref={ref} {...props} />
));

Container.displayName = 'Container';
