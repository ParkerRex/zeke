"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { TRPCProvider } from "@/trpc/client";

type ProviderProps = {
	locale: string;
	children: ReactNode;
};

export function Providers({ locale, children }: ProviderProps) {
	return (
		<TRPCProvider>
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
				disableTransitionOnChange
			>
				{children}
			</ThemeProvider>
		</TRPCProvider>
	);
}
