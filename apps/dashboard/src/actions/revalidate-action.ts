"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function revalidateAfterTeamChange() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/teams");
  redirect("/");
}
