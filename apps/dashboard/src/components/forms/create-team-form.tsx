"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useRef, useState } from "react";
import { z } from "zod";
import { revalidateAfterTeamChange } from "@/actions/revalidate-action";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

const formSchema = z.object({
	name: z.string().min(2, {
		message: "Team name must be at least 2 characters.",
	}),
});

export function CreateTeamForm() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [isLoading, setIsLoading] = useState(false);
	const isSubmittedRef = useRef(false);

	const createTeamMutation = useMutation(
		trpc.team.create.mutationOptions({
			onSuccess: async () => {
				// Lock the form permanently - never reset on success
				setIsLoading(true);
				isSubmittedRef.current = true;

				try {
					// Invalidate all queries to ensure fresh data everywhere
					await queryClient.invalidateQueries();
					// Revalidate server-side paths and redirect
					await revalidateAfterTeamChange();
				} catch (error) {
					// Even if redirect fails, keep the form locked to prevent duplicates
					console.error("Redirect failed, but keeping form locked:", error);
				}
				// Note: We NEVER reset loading state on success - user should be redirected
			},
			onError: () => {
				setIsLoading(false);
				isSubmittedRef.current = false; // Reset on error to allow retry
			},
		}),
	);

	const form = useZodForm(formSchema, {
		defaultValues: {
			name: "",
		},
	});

	// Computed loading state that can never be reset unexpectedly
	const isFormLocked = isLoading || isSubmittedRef.current;

	function onSubmit(values: z.infer<typeof formSchema>) {
		if (isFormLocked) {
			return;
		}

		setIsLoading(true);
		isSubmittedRef.current = true; // Permanent flag that survives re-renders

		createTeamMutation.mutate({
			name: values.name,
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
									placeholder="Ex: Acme Marketing or Acme Co"
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
