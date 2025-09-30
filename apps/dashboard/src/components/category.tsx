"use client";

import { cn } from "@zeke/ui/cn";

type CategoryIconProps = {
  color?: string;
  size?: number;
  className?: string;
};

export function CategoryColor({
  color,
  className,
  size = 12,
}: CategoryIconProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: color,
        width: size,
        height: size,
      }}
    />
  );
}

type Props = {
  name: string;
  className?: string;
  color?: string;
};

export function Category({ name, color, className }: Props) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <CategoryColor color={color} />
      {name && <span>{name}</span>}
    </div>
  );
}
