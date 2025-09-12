import { getAdminFlag } from "@db/queries/account/get-admin-flag";
import { getSession } from "@db/queries/account/get-session";
import { redirect } from "next/navigation";
import AdminConsole from "./ui/AdminConsole";

export const metadata = { title: "Admin Console" };

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const { isAdmin } = await getAdminFlag();
  if (!isAdmin) redirect("/home");
  return <AdminConsole />;
}
