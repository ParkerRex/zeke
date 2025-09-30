import { useClickAway } from "@uidotdev/usehooks";
import { cn } from "@zeke/ui/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@zeke/ui/popover";
import { useState } from "react";
import { HexColorPicker } from "react-colorful";

type Props = {
  value: string;
  onSelect: (value: string) => void;
};

export function ColorPicker({ value, onSelect }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="size-3 transition-colors rounded-[2px] absolute top-3 left-2"
          style={{
            backgroundColor: value,
          }}
        />
      </PopoverTrigger>
      <PopoverContent className="p-0 w-auto" sideOffset={14}>
        <HexColorPicker
          className="color-picker"
          color={value}
          onChange={(c) => {
            onSelect(c);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
