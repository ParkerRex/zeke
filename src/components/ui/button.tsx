import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/utils/cn';
import { Slot } from '@radix-ui/react-slot';

import { FramedContainer } from '../sexy-boarder';

const buttonVariants = cva(
  'w-fit inline-flex items-center justify-center whitespace-nowrap text-sm rounded-md font-alt font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-black text-white hover:bg-gray-800 focus:ring-gray-400',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-red-400',
        outline: 'border border-gray-300 bg-white text-black hover:bg-gray-50 focus:ring-gray-200',
        secondary: 'bg-gray-100 text-black hover:bg-gray-200 focus:ring-gray-200',
        ghost: 'hover:bg-gray-100 hover:text-black focus:ring-gray-200',
        link: 'text-black underline-offset-4 hover:underline focus:ring-gray-200',
        minimal: 'border border-gray-200 bg-white text-black hover:border-gray-400 focus:ring-gray-200',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 rounded-md px-3 text-xs',
        nav: 'h-8 rounded-md px-3 text-sm',
        lg: 'h-12 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <WithSexyBorder variant={variant} className={cn('w-fit', className)}>
        <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
      </WithSexyBorder>
    );
  }
);
Button.displayName = 'Button';

export function WithSexyBorder({
  variant,
  className,
  children,
}: {
  variant: string | null | undefined;
  className?: string;
  children: React.ReactNode;
}) {
  if (variant === 'minimal') {
    return <FramedContainer className={className}>{children}</FramedContainer>;
  } else {
    return <>{children}</>;
  }
}

export { Button, buttonVariants };
