import { cookies } from "next/headers";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "../app-sidebar";
import { AppSidebarInset } from "../app-sidebar-inset";
import { SidebarProvider } from "../ui/sidebar";

type ProviderProps = {
  children: React.ReactNode;
};

export async function Providers({ children }: ProviderProps) {
  const cookieStore = await cookies();

  const sidebarState = cookieStore.get("sidebar:state")?.value;
  //* get sidebar width from cookie
  const sidebarWidth = cookieStore.get("sidebar:width")?.value;

  let defaultOpen = true;

  if (sidebarState) {
    defaultOpen = sidebarState === "true";
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
      enableSystem
    >
      <SidebarProvider defaultOpen={defaultOpen} defaultWidth={sidebarWidth}>
        <AppSidebar>
          <AppSidebarInset>{children}</AppSidebarInset>
        </AppSidebar>
      </SidebarProvider>
    </ThemeProvider>
  );
}
