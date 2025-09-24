// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { CurrencyInput } from "@zeke/ui/currency-input";
import { useRef } from "react";
import { useController, useFormContext } from "react-hook-form";

export function TaxInput() {
  const { control } = useFormContext();
  const trpc = useTRPC();
  const lastSavedValueRef = useRef<number | undefined>(undefined);
  const updateTemplateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions(),
  );

  const {
    field: { value, onChange },
  } = useController({
    name: "template.taxRate",
    control,
  });

  return (
    <CurrencyInput
      suffix="%)"
      prefix="("
      autoComplete="off"
      value={value}
      onValueChange={(values) => {
        const newValue = values.floatValue ?? 0;
        onChange(newValue);
      }}
      onBlur={() => {
        const currentValue = value ?? 0;
        // Only save if the value has actually changed
        if (currentValue !== lastSavedValueRef.current) {
          lastSavedValueRef.current = currentValue;
          updateTemplateMutation.mutate({ taxRate: currentValue });
        }
      }}
      className="p-0 border-0 h-6 text-xs !bg-transparent font-mono flex-shrink-0 w-16 text-[11px] text-[#878787]"
      thousandSeparator={false}
      decimalScale={2}
      isAllowed={(values) => {
        const { floatValue } = values;
        return (
          floatValue === undefined || (floatValue >= 0 && floatValue <= 100)
        );
      }}
      allowNegative={false}
    />
  );
}
