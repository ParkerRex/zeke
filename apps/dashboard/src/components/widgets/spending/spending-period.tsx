"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useI18n } from "@/locales/client";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@zeke/ui/dropdown-menu";
import { Icons } from "@zeke/ui/icons";
import Link from "next/link";
import { options } from "./data";

type Props = {
  period: string;
  onChange: (period: string) => void;
};

export function SpendingPeriod({ period, onChange }: Props) {
  const t = useI18n();

  const selectedPeriod = options.find((option) => option.id === period);

  return (
    <div className="flex justify-between">
      <div>
        <Link
          href={`/transactions?start=${selectedPeriod?.from}&end=${selectedPeriod?.to}&amount=lte,0`}
          prefetch
        >
          <h2 className="text-lg">Spending</h2>
        </Link>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="flex items-center space-x-2">
            {/* @ts-expect-error */}
            <span>{t(`spending_period.${period}`)}</span>
            <Icons.ChevronDown />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[180px]">
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.id}
              onCheckedChange={() => onChange(option.id)}
              checked={option.id === period}
            >
              {/* @ts-expect-error */}
              {t(`spending_period.${option.id}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
