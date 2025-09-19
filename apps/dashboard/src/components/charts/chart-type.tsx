"use client";

import { chartTypeOptions, useReportsParams } from "@/hooks/use-reports-params";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@zeke/ui/select";

type Props = {
  disabled?: boolean;
};

export function ChartType({ disabled }: Props) {
  const { params, setParams } = useReportsParams();

  return (
    <Select
      defaultValue={params.chart}
      onValueChange={(value) => {
        if (value) {
          setParams({
            ...params,
            chart: value as NonNullable<typeof params.chart>,
          });
        }
      }}
    >
      <SelectTrigger
        className="flex-1 space-x-1 font-medium"
        disabled={disabled}
      >
        <span>{params.chart}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {chartTypeOptions.map((option) => {
            return (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
