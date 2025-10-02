"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { revalidateAfterTeamChange } from "@/actions/revalidate-action";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { logger } from "@zeke/logger";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { use, useRef, useState } from "react";
import { z } from "zod";
import { CountrySelector } from "../country-selector";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Team name must be at least 2 characters.",
  }),
  countryCode: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  defaultCountryCodePromise: Promise<string>;
};

export function CreateTeamForm({
  defaultCountryCodePromise,
}: Props) {
  const countryCode = use(defaultCountryCodePromise);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittedRef = useRef(false);

  const createTeamMutation = useMutation(
    trpc.team.create.mutationOptions({
      onSuccess: async (teamId) => {
        const successId = `team_creation_success_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log(`[${successId}] Team creation mutation successful`, {
          teamId,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        });

        // Lock the form permanently - never reset on success
        setIsLoading(true);
        isSubmittedRef.current = true;

        try {
          // Invalidate all queries to ensure fresh data everywhere
          console.log(`[${successId}] Invalidating queries`);
          await queryClient.invalidateQueries();

          // Revalidate server-side paths and redirect
          console.log(`[${successId}] Revalidating server-side paths`);
          await revalidateAfterTeamChange();

          console.log(
            `[${successId}] Team creation flow completed successfully`,
          );
        } catch (error) {
          // Check if this is a Next.js redirect (expected behavior)
          if (error instanceof Error && error.message === "NEXT_REDIRECT") {
            console.log(
              `[${successId}] Team creation completed successfully - redirecting to home`,
            );
            // This is expected - Next.js redirects work by throwing this error
            return;
          }

          // Only log actual errors, not expected redirects
          console.error(`[${successId}] Team creation flow failed:`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            teamId,
          });
        }
        // Note: We NEVER reset loading state on success - user should be redirected
      },
      onError: (error) => {
        const errorId = `team_creation_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Extract TRPC error details
        const trpcError = error && typeof error === 'object' && 'data' in error
          ? (error as any).data
          : null;

        logger.error({
          errorId,
          msg: "Team creation mutation failed",
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          trpcCode: trpcError?.code,
          trpcHttpStatus: trpcError?.httpStatus,
          trpcData: trpcError,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        });

        // Capture error in Sentry for debugging
        if (error instanceof Error && process.env.NODE_ENV === "production") {
          import("@sentry/nextjs").then((Sentry) => {
            Sentry.captureException(error, {
              extra: {
                errorId,
                component: "CreateTeamForm",
                action: "team_creation_mutation",
                trpcCode: trpcError?.code,
                trpcHttpStatus: trpcError?.httpStatus,
                url: window.location.href,
                timestamp: new Date().toISOString(),
              },
            });
          });
        }

        setIsLoading(false);
        isSubmittedRef.current = false; // Reset on error to allow retry
      },
    }),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      name: "",
      countryCode: countryCode ?? "US",
    },
  });

  // Computed loading state that can never be reset unexpectedly
  const isFormLocked = isLoading || isSubmittedRef.current;

  function onSubmit(values: FormValues) {
    if (isFormLocked) {
      console.warn("Team creation form submission blocked - form is locked", {
        isFormLocked,
        isLoading,
        isSubmittedRef: isSubmittedRef.current,
        formValues: values,
      });
      return;
    }

    const submissionId = `form_submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[${submissionId}] Team creation form submission started`, {
      teamName: values.name,
      countryCode: values.countryCode,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    setIsLoading(true);
    isSubmittedRef.current = true; // Permanent flag that survives re-renders

    createTeamMutation.mutate({
      name: values.name,
      countryCode: values.countryCode,
      switchTeam: true, // Automatically switch to the new team
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="mt-4 w-full">
              <FormLabel className="text-xs text-[#666] font-normal">
                Company name
              </FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  placeholder="(if it's just you, that's cool too we love that)"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="countryCode"
          render={({ field }) => (
            <FormItem className="mt-4 w-full border-b border-border pb-4">
              <FormLabel className="text-xs text-[#666] font-normal">
                Country
              </FormLabel>
              <FormControl className="w-full">
                <CountrySelector
                  defaultValue={field.value ?? "US"}
                  onSelect={(code, name) => {
                    field.onChange(name);
                    form.setValue("countryCode", code);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton
          className="mt-6 w-full"
          type="submit"
          isSubmitting={isFormLocked}
        >
          Create
        </SubmitButton>
      </form>
    </Form>
  );
}
