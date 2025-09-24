// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.


import { zodResolver } from "@hookform/resolvers/zod";
import { type UseFormProps, useForm } from "react-hook-form";
import type { z } from "zod";

export const useZodForm = <T extends z.ZodType<any, any>>(
  schema: T,
  options?: Omit<UseFormProps<z.infer<T>>, "resolver">,
) => {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    ...options,
  });
};
