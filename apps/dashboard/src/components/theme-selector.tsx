"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@zeke/ui/select";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeSelector() {
	const { theme, setTheme, resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// Avoid hydration mismatch by waiting until mounted
	useEffect(() => setMounted(true), []);

	const value = (theme ?? "system") as "light" | "dark" | "system";

	if (!mounted) {
		return <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />;
	}

	return (
		<div className="flex items-center gap-3">
			<div className="text-muted-foreground text-sm">Theme</div>
			<Select onValueChange={(v) => setTheme(v)} value={value}>
				<SelectTrigger className="w-40">
					<SelectValue placeholder="Select theme" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="system">
						{"System"}
						{resolvedTheme ? ` (${resolvedTheme})` : ""}
					</SelectItem>
					<SelectItem value="light">Light</SelectItem>
					<SelectItem value="dark">Dark</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
