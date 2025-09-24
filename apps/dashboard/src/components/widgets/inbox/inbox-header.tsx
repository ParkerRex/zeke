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
import { type InboxOption, options } from "./data";

type Props = {
  filter: InboxOption;
  disabled: boolean;
  setFilter: (filter: InboxOption) => void;
};

export function InboxHeader({ filter, disabled, setFilter }: Props) {
  const t = useI18n();

  return (
    <div className="flex justify-between">
      <div>
        <Link href="/inbox" prefetch>
          <h2 className="text-lg">Inbox</h2>
        </Link>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger disabled={disabled}>
          <div className="flex items-center space-x-2">
            <span>{t(`inbox_filter.${filter}`)}</span>
            <Icons.ChevronDown />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[130px]">
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              onCheckedChange={() => setFilter(option)}
              checked={option === filter}
            >
              {t(`inbox_filter.${option}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
