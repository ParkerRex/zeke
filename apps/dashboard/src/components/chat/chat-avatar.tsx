"use client";

import { Avatar, AvatarImageNext } from "@zeke/ui/avatar";
import { Icons } from "@zeke/ui/icons";
import type { UIMessage } from "ai";
import { useUserQuery } from "@/hooks/use-user";

type Props = {
	role: UIMessage["role"];
};

export function ChatAvatar({ role }: Props) {
	const { data: user } = useUserQuery();

	switch (role) {
		case "user": {
			return (
				<div className="flex size-[25px] shrink-0 select-none items-center justify-center">
					<Avatar className="size-6">
						<AvatarImageNext
							src={user?.avatarUrl || ""}
							alt={user?.fullName ?? ""}
							width={24}
							height={24}
						/>
					</Avatar>
				</div>
			);
		}

		case "assistant": {
			return (
				<div className="flex size-[25px] shrink-0 select-none items-center justify-center">
					<Icons.LogoSmall className="size-6" />
				</div>
			);
		}

		default:
			return null;
	}
}
