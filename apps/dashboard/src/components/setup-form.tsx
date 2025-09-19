"use client";

import { useUserMutation } from "@/hooks/use-user";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@zeke/ui/form";
import { Input } from "@zeke/ui/input";
import { SubmitButton } from "@zeke/ui/submit-button";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { z } from "zod";
import { AvatarUpload } from "./avatar-upload";

const formSchema = z.object({
  fullName: z.string().min(2).max(32),
});

export function SetupForm() {
  const router = useRouter();
  const uploadRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const trpc = useTRPC();
  const { data: user } = useSuspenseQuery(trpc.user.me.queryOptions());

  const updateUserMutation = useUserMutation();

  const form = useZodForm(formSchema, {
    defaultValues: {
      fullName: user?.fullName ?? "",
    },
  });

  function handleSubmit(data: z.infer<typeof formSchema>) {
    updateUserMutation.mutate(data, {
      onSuccess: async () => {
        setIsRedirecting(true);
        // Invalidate all queries to ensure fresh data
        await queryClient.invalidateQueries();
        // Redirect directly to teams page
        router.push("/teams");
      },
      onError: () => {
        setIsRedirecting(false);
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="flex justify-between items-end gap-4">
          <AvatarUpload
            userId={user?.id ?? ""}
            avatarUrl={user?.avatarUrl}
            size={80}
            ref={uploadRef}
          />
        </div>

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>
                This is your first and last name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton
          type="submit"
          className="w-full"
          isSubmitting={updateUserMutation.isPending || isRedirecting}
        >
          Save
        </SubmitButton>
      </form>
    </Form>
  );
}
