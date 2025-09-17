import "./styles.css";
import { Toolbar as CMSToolbar } from "@zeke/cms/components/toolbar";
import { cn } from "@zeke/ui/cn";
import type { ReactNode } from "react";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

interface RootLayoutProps {
	readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
	return (
		<html lang="en" className={cn("scroll-smooth")} suppressHydrationWarning>
			<body>
				<SiteHeader />
				{children}
				<SiteFooter />
				<CMSToolbar />
			</body>
		</html>
	);
}
