"use client";

import MotionNumber from "motion-number";

type Props = {
  value: number;
  currency: string;
};

export function AnimatedNumber({ value, currency }: Props) {
  return (
    <MotionNumber
      value={value}
      format={{
        style: "currency",
        currency: currency ?? "USD",
      }}
    />
  );
}
