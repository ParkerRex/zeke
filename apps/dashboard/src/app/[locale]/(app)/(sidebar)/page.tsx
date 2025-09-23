import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard • ZEKE",
  description: "Redirecting to your story workspace.",
};

export default function DashboardEntry() {
  redirect("/stories");
}
