// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zeke/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@zeke/ui/form";
import { Input } from "@zeke/ui/input";
import { SubmitButton } from "@zeke/ui/submit-button";
import { z } from "zod";
import { InputColor } from "../input-color";

type Props = {
  id: string;
  onOpenChange: (isOpen: boolean) => void;
  isOpen: boolean;
  defaultValue: {
    name: string;
  };
};

const formSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
});

type UpdateTagFormValues = z.infer<typeof formSchema>;

export function EditCategoryModal({
  id,
  onOpenChange,
  isOpen,
  defaultValue,
}: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateTagMutation = useMutation(
    trpc.tags.update.mutationOptions({
      onSuccess: () => {
        onOpenChange(false);
        queryClient.invalidateQueries({
          queryKey: trpc.tags.list.queryKey(),
        });
      },
    }),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      id,
      name: defaultValue.name,
    },
  });

  function onSubmit(values: UpdateTagFormValues) {
    updateTagMutation.mutate(values);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[455px]">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2 mb-6">
              <div className="flex flex-col space-y-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }: { field: any }) => (
                    <FormItem className="flex-1 space-y-1">
                      <FormLabel className="text-xs text-[#878787] font-normal">
                        Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input {...field} placeholder="Tag name" autoFocus />
                          <FormMessage />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="mt-8 w-full">
                <div className="space-y-4 w-full">
                  <SubmitButton
                    isSubmitting={updateTagMutation.isPending}
                    className="w-full"
                  >
                    Save
                  </SubmitButton>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
