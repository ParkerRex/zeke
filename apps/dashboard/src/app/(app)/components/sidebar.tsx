"use client";

import { OrganizationSwitcher, UserButton } from "@zeke/auth/client";
import { NotificationsTrigger } from "@zeke/notifications/components/trigger";
import { Button } from "@zeke/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@zeke/ui/collapsible";
import { ModeToggle } from "@zeke/ui/components/mode-toggle";
import { cn } from "@zeke/ui/lib/utils";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from "@zeke/ui/sidebar";
import { Icons } from "@zeke/ui/icons";
import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "./search";

type GlobalSidebarProperties = {
	readonly children: ReactNode;
};

const data = {
	navMain: [
		{
			title: "Today",
			url: "/today",
			icon: Icons.SquareTerminal,
			isActive: true,
		},
		{
			title: "Stories",
			url: "/stories",
			icon: Icons.BookOpen,
		},
		{
			title: "Watchlists",
			url: "/watchlists",
			icon: Icons.FolderIcon,
		},
		{
			title: "Account",
			url: "/account",
			icon: Icons.Settings2,
			items: [
				{
					title: "Profile",
					url: "/account",
				},
				{
					title: "Billing",
					url: "/account#billing",
				},
				{
					title: "Settings",
					url: "/account#settings",
				},
			],
		},
	],
	navSecondary: [
		{
			title: "Admin",
			url: "/admin",
			icon: Icons.Settings2,
		},
		{
			title: "Support",
			url: "#",
			icon: Icons.LifeBuoy,
		},
		{
			title: "Feedback",
			url: "#",
			icon: Icons.Send,
		},
	],
};

export const GlobalSidebar = ({ children }: GlobalSidebarProperties) => {
	const sidebar = useSidebar();

	return (
		<>
			<Sidebar variant="inset">
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							<div
								className={cn(
									"h-[36px] overflow-hidden transition-all [&>div]:w-full",
									sidebar.open ? "" : "-mx-1",
								)}
							>
								<OrganizationSwitcher
									hidePersonal
									afterSelectOrganizationUrl="/"
								/>
							</div>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>
				<Search />
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>Platform</SidebarGroupLabel>
						<SidebarMenu>
							{data.navMain.map((item) => (
								<Collapsible
									key={item.title}
									asChild
									defaultOpen={item.isActive}
								>
									<SidebarMenuItem>
										<SidebarMenuButton asChild tooltip={item.title}>
											<Link href={item.url}>
												<item.icon />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
										{item.items?.length ? (
											<>
												<CollapsibleTrigger asChild>
													<SidebarMenuAction className="data-[state=open]:rotate-90">
														<Icons.ChevronRight />
														<span className="sr-only">Toggle</span>
													</SidebarMenuAction>
												</CollapsibleTrigger>
												<CollapsibleContent>
													<SidebarMenuSub>
														{item.items?.map((subItem) => (
															<SidebarMenuSubItem key={subItem.title}>
																<SidebarMenuSubButton asChild>
																	<Link href={subItem.url}>
																		<span>{subItem.title}</span>
																	</Link>
																</SidebarMenuSubButton>
															</SidebarMenuSubItem>
														))}
													</SidebarMenuSub>
												</CollapsibleContent>
											</>
										) : null}
									</SidebarMenuItem>
								</Collapsible>
							))}
						</SidebarMenu>
					</SidebarGroup>

					<SidebarGroup className="mt-auto">
						<SidebarGroupContent>
							<SidebarMenu>
								{data.navSecondary.map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton asChild>
											<Link href={item.url}>
												<item.icon />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarFooter>
					<SidebarMenu>
						<SidebarMenuItem className="flex items-center gap-2">
							<div className="flex w-full items-center gap-2">
								<UserButton />
								<div className="flex shrink-0 items-center gap-px">
									<ModeToggle />
									<Button variant="ghost" size="icon" className="shrink-0">
										<div className="h-4 w-4">
											<NotificationsTrigger />
										</div>
									</Button>
								</div>
							</div>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>
			</Sidebar>
			<SidebarInset>{children}</SidebarInset>
		</>
	);
};
