"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";

type ProviderProps = {
	locale: string;
	children: ReactNode;
};

export function Providers({ locale, children }: ProviderProps) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			{children}
		</ThemeProvider>
	);
}
