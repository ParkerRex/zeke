"use client";

import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import countries from "@zeke/location/country-flags";
import { Button } from "@zeke/ui/button";
import { cn } from "@zeke/ui/cn";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@zeke/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@zeke/ui/popover";
import { useEffect, useState } from "react";

type Props = {
  defaultValue: string;
  onSelect: (countryCode: string, countryName: string) => void;
};

export function CountrySelector({ defaultValue, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (defaultValue !== value) {
      setValue(defaultValue);
    }
  }, [defaultValue, value]);

  const selected = Object.values(countries).find(
    (country) => country.code === value || country.name === value,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-expanded={open}
          className="w-full justify-between truncate font-normal"
        >
          {selected?.name ?? "Select country"}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start" portal={false}>
        <Command loop>
          <CommandInput
            placeholder="Search country..."
            className="h-9 px-2"
            autoComplete="off"
          />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandGroup>
            <CommandList className="max-h-[230px] overflow-y-auto pt-2">
              {Object.values(countries).map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.name}
                  onSelect={() => {
                    setValue(country.code);
                    onSelect(country.code, country.name);
                    setOpen(false);
                  }}
                >
                  {country.name}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === country.code ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
