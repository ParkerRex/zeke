import { cn } from '@/lib/utils'; // Assumes you have a cn utility for classnames
// biome-ignore-all lint: example
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from 'react';

// Button Component
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'product' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]',
    secondary:
      'bg-transparent border-2 border-current text-primary hover:bg-primary hover:text-primary-foreground',
    ghost: 'bg-transparent hover:bg-primary/10 text-primary',
    danger: 'bg-error text-white hover:bg-error/90',
    product:
      'bg-gradient-to-r from-yellow-500 to-red-500 text-white hover:opacity-90',
    dark: 'bg-dark-gray-900 text-white hover:bg-dark-gray-800 border border-dark-gray-700',
  };

  const sizes = {
    sm: 'h-9 px-4 text-sm rounded-md',
    md: 'h-11 px-6 text-base rounded-md',
    lg: 'h-13 px-8 text-lg rounded-lg',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Button Container Component
interface ButtonContainerProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end' | 'stretch';
  children: ReactNode;
}

export const ButtonContainer = ({
  align = 'start',
  className,
  children,
  ...props
}: ButtonContainerProps) => {
  const alignmentClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    stretch: 'w-full [&>button]:flex-1',
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row',
        alignmentClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Component
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  noPadding?: boolean;
  children: ReactNode;
}

export const Card = ({
  hover = false,
  noPadding = false,
  className,
  children,
  ...props
}: CardProps) => {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-mozilla-sm',
        !noPadding && 'p-6',
        hover &&
          'hover:-translate-y-1 cursor-pointer transition-all duration-300 hover:shadow-mozilla-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Input Component
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  fullWidth?: boolean;
}

export const Input = ({
  error = false,
  fullWidth = true,
  className,
  ...props
}: InputProps) => {
  return (
    <input
      className={cn(
        'rounded-md border bg-input px-4 py-2.5 text-foreground',
        'focus:border-transparent focus:outline-none focus:ring-2',
        'transition-colors duration-200 placeholder:text-foreground/50',
        error
          ? 'border-error focus:ring-error'
          : 'border-border focus:ring-ring',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    />
  );
};

// Text Input with Label
interface TextFieldProps extends InputProps {
  label: string;
  helperText?: string;
  required?: boolean;
}

export const TextField = ({
