// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@zeke/ui/button";
import {
  DialogContent,
  DialogDescription,
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
} from "@zeke/ui/form";
import { Icons } from "@zeke/ui/icons";
import { Input } from "@zeke/ui/input";
import { SubmitButton } from "@zeke/ui/submit-button";
import { useEffect } from "react";
import { useFieldArray } from "react-hook-form";
import { z } from "zod";

type Props = {
  onOpenChange: (isOpen: boolean) => void;
  isOpen: boolean;
};

interface TagFormValues {
  name: string;
}

interface CreateTagsFormValues {
  tags: TagFormValues[];
}

const formSchema = z.object({
  tags: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
    }),
  ),
});

export function CreateCategoriesModal({ onOpenChange, isOpen }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createTagsMutation = useMutation({
    mutationFn: async (data: TagFormValues[]) => {
      const results = [];
      for (const tag of data) {
        const result = await trpc.tags.create.mutate({ name: tag.name });
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.tags.list.queryKey(),
      });
      onOpenChange(false);
    },
  });

  const newItem = {
    name: "",
  };

  const form = useZodForm(formSchema, {
    defaultValues: {
      tags: [newItem],
    },
  });

  useEffect(() => {
    form.reset({
      tags: [newItem],
    });
  }, [isOpen, form]);

  const onSubmit = (data: CreateTagsFormValues) => {
    createTagsMutation.mutate(data.tags);
  };

  const { fields, append } = useFieldArray({
    name: "tags",
    control: form.control,
  });

  return (
    <DialogContent className="max-w-[455px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="p-4">
            <DialogHeader className="mb-4">
              <DialogTitle>Create tags</DialogTitle>
              <DialogDescription>
                You can add your own tags here.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col space-y-6 max-h-[420px] overflow-auto">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col space-y-2">
                  <FormField
                    control={form.control}
                    name={`tags.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1 space-y-1">
                        <FormLabel className="text-xs text-[#878787] font-normal">
                          Name
                        </FormLabel>
                        <FormControl>
                          <Input {...field} autoFocus placeholder="Tag name" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              type="button"
              className="mt-4 space-x-1"
              onClick={() => {
                append(newItem);
              }}
            >
              <Icons.Add />
              <span>Add more</span>
            </Button>

            <DialogFooter className="border-t-[1px] pt-4 mt-8 items-center !justify-between">
              <div>
                {Object.values(form.formState.errors).length > 0 && (
                  <span className="text-sm text-destructive">
                    Please complete the fields above.
                  </span>
                )}
              </div>
              <SubmitButton isSubmitting={createTagsMutation.isPending}>
                Create
              </SubmitButton>
            </DialogFooter>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}
