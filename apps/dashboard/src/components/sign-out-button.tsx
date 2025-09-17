"use client";

import { Button } from "@zeke/ui/button";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { toast } from "sonner";
import type { ActionResponse } from "@/src/types/action-response";

type Props = {
	signOutAction: () => Promise<ActionResponse>;
	className?: string;
	variant?: ComponentProps<typeof Button>["variant"];
	size?: ComponentProps<typeof Button>["size"];
};

export function SignOutButton({
	signOutAction,
	className,
	variant = "destructive",
	size = "sm",
}: Props) {
	const router = useRouter();

	async function handleClick() {
		const response = await signOutAction();
		if (response?.error) {
			toast.error(
				"An error occurred while logging out. Please try again or contact support.",
			);
		} else {
			router.refresh();
			toast.success("You have been logged out.");
		}
	}

	return (
		<Button
			className={className}
			onClick={handleClick}
			size={size}
			variant={variant}
		>
			Sign Out
		</Button>
	);
}

export default SignOutButton;
