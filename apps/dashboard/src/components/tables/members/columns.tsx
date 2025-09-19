import type { RouterOutputs } from "@api/trpc/routers/_app";
import type { ColumnDef, FilterFn, Row } from "@tanstack/react-table";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@zeke/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImageNext } from "@zeke/ui/avatar";
import { Button } from "@zeke/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@zeke/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@zeke/ui/select";
import { useToast } from "@zeke/ui/use-toast";
import { Loader2, MoreHorizontal } from "lucide-react";
import * as React from "react";
import "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";

type TeamMember = RouterOutputs["team"]["members"][number];

const userFilterFn: FilterFn<TeamMember> = (
	row: Row<TeamMember>,
	_: string,
	filterValue: string,
) => {
	const memberName = row.original.user?.fullName?.toLowerCase();

	return memberName?.includes(filterValue.toLowerCase()) ?? false;
};

export const columns: ColumnDef<TeamMember>[] = [
	{
		id: "user",
		accessorKey: "user.full_name",
		filterFn: userFilterFn,
		cell: ({ row }) => {
			return (
				<div>
					<div className="flex items-center space-x-4">
						<Avatar className="rounded-full size-8">
							<AvatarImageNext
								src={row.original.user?.avatarUrl ?? ""}
								alt={row.original.user?.fullName ?? ""}
								width={32}
								height={32}
							/>
							<AvatarFallback>
								<span className="text-xs">
									{row.original.user?.fullName?.charAt(0)?.toUpperCase()}
								</span>
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col">
							<span className="font-medium text-sm">
								{row.original.user?.fullName}
							</span>
							<span className="text-sm text-[#606060]">
								{row.original.user?.email}
							</span>
						</div>
					</div>
				</div>
			);
		},
	},
	{
		id: "actions",
		cell: ({ row, table }) => {
			const { toast } = useToast();
			const meta = table.options.meta;
			const trpc = useTRPC();
			const queryClient = useQueryClient();
			const router = useRouter();

			const deleteMemberMutation = useMutation(
				trpc.team.deleteMember.mutationOptions({
					onSuccess: () => {
						queryClient.invalidateQueries({
							queryKey: trpc.team.members.queryKey(),
						});
					},
					onError: () => {
						toast({
							title: "Error deleting member",
						});
					},
				}),
			);

			const leaveTeamMutation = useMutation(
				trpc.team.leave.mutationOptions({
					onSuccess: async () => {
						router.push("/teams");
					},
				}),
			);

			const updateMemberMutation = useMutation(
				trpc.team.updateMember.mutationOptions({
					onSuccess: () => {
						queryClient.invalidateQueries({
							queryKey: trpc.team.members.queryKey(),
						});
					},
				}),
			);

			const getRoleLabel = (role: string | null) => {
				if (role === "owner") return "Owner";
				return "Member";
			};

			return (
				<div className="flex justify-end">
					<div className="flex space-x-2 items-center">
						{(meta?.currentUser?.role === "owner" &&
							meta?.currentUser?.user?.id !== row.original.user?.id) ||
						(meta?.currentUser?.role === "owner" &&
							(meta?.totalOwners ?? 0) > 1) ? (
							<Select
								value={row.original.role ?? undefined}
								onValueChange={(role) => {
									updateMemberMutation.mutate({
										userId: row.original.user?.id!,
										teamId: row.original.teamId!,
										role: role as "owner" | "member",
									});
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder={getRoleLabel(row.original.role)} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="owner">Owner</SelectItem>
									<SelectItem value="member">Member</SelectItem>
								</SelectContent>
							</Select>
						) : (
							<span className="text-sm text-[#606060]">
								{getRoleLabel(row.original.role)}
							</span>
						)}
						{meta?.currentUser?.role === "owner" && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" className="size-8 p-0">
										<MoreHorizontal className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{meta?.currentUser?.user?.id !== row.original.user?.id && (
										<AlertDialog>
											<DropdownMenuItem
												className="text-destructive"
												asDialogTrigger
											>
												<AlertDialogTrigger>Remove Member</AlertDialogTrigger>
											</DropdownMenuItem>

											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>
														Remove Team Member
													</AlertDialogTitle>
													<AlertDialogDescription>
														You are about to remove the following Team Member,
														are you sure you want to continue?
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction
														disabled={deleteMemberMutation.isPending}
														onClick={() => {
															deleteMemberMutation.mutate({
																userId: row.original.user?.id!,
																teamId: row.original.teamId!,
															});
														}}
													>
														{deleteMemberMutation.isPending ? (
															<Loader2 className="size-4 animate-spin" />
														) : (
															"Confirm"
														)}
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									)}

									{meta?.currentUser?.user?.id === row.original.user?.id && (
										<AlertDialog>
											<DropdownMenuItem
												className="text-destructive"
												asDialogTrigger
											>
												<AlertDialogTrigger>Leave Team</AlertDialogTrigger>
											</DropdownMenuItem>

											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>Leave Team</AlertDialogTitle>
													<AlertDialogDescription>
														You are about to leave this team. In order to regain
														access at a later time, a Team Owner must invite
														you.
														<p className="mt-4">
															Are you sure you want to continue?
														</p>
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction
														disabled={leaveTeamMutation.isPending}
														onClick={() =>
															leaveTeamMutation.mutate({
																teamId: row.original.teamId!,
															})
														}
													>
														{leaveTeamMutation.isPending ? (
															<Loader2 className="size-4 animate-spin" />
														) : (
															"Confirm"
														)}
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>
			);
		},
		meta: {
			className: "text-right",
		},
	},
];
