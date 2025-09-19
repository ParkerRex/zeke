import { redirect } from "next/navigation";

import { getOrCreateCustomer } from "@/actions/account/get-or-create-customer";
import { getURL } from "@/src/utils/get-url";
import { stripeAdmin } from "@/src/utils/stripe-admin";
import { createClient } from "@zeke/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    throw new Error("Could not get userId");
  }

  if (!session.user.email) {
    throw new Error("Could not get email");
  }

  const customer = await getOrCreateCustomer({
    userId: session.user.id,
    email: session.user.email,
  });

  const { url } = await stripeAdmin.billingPortal.sessions.create({
    customer,
    return_url: `${getURL()}/account`,
  });

  redirect(url);
}
