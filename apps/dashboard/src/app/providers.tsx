"use client";

import type { ReactNode } from "react";
import { DesktopProvider } from "@/components/desktop-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { TRPCReactProvider } from "@/trpc/client";

type ProviderProps = {
	children: ReactNode;
};

export function Providers({ children }: ProviderProps) {
	return (
		<TRPCReactProvider>
			<DesktopProvider />

			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
				disableTransitionOnChange
			>
				{children}
			</ThemeProvider>
		</TRPCReactProvider>
	);
}
