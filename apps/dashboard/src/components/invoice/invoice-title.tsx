"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.



import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";
import { Input } from "./input";

export function InvoiceTitle() {
  const { watch } = useFormContext();
  const invoiceTitle = watch("template.title");

  const trpc = useTRPC();
  const updateTemplateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions(),
  );

  return (
    <Input
      className="text-[21px] font-medium mb-2 w-fit min-w-[100px] !border-none"
      name="template.title"
      onBlur={() => {
        updateTemplateMutation.mutate({ title: invoiceTitle });
      }}
    />
  );
}
