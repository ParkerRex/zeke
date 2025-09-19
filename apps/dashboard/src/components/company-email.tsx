"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@zeke/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@zeke/ui/form";
import { Input } from "@zeke/ui/input";
import { SubmitButton } from "@zeke/ui/submit-button";
import { z } from "zod";
import { useTeamMutation, useTeamQuery } from "@/hooks/use-team";
import { useZodForm } from "@/hooks/use-zod-form";
import { CountrySelector } from "./country-selector";

const formSchema = z.object({
	email: z.string().email(),
});

export function CompanyEmail() {
	const { data } = useTeamQuery();
	const updateTeamMutation = useTeamMutation();

	const form = useZodForm(formSchema, {
		defaultValues: {
			email: data?.email ?? "",
		},
	});

	const onSubmit = form.handleSubmit((data) => {
		updateTeamMutation.mutate(data);
	});

	return (
		<Form {...form}>
			<form onSubmit={onSubmit}>
				<Card>
					<CardHeader>
						<CardTitle>Company email</CardTitle>
						<CardDescription>
							This is the email address that will be used to receive emails from
							zeke.
						</CardDescription>
					</CardHeader>

					<CardContent>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem className="max-w-[300px]">
									<FormControl>
										<Input {...field} placeholder="Email" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>

					<CardFooter className="flex justify-end">
						<SubmitButton
							isSubmitting={updateTeamMutation.isPending}
							disabled={updateTeamMutation.isPending}
						>
							Save
						</SubmitButton>
					</CardFooter>
				</Card>
			</form>
		</Form>
	);
}
