import type { Database } from "../types/db";
import type { Client } from "../types";

type SourceRow = Database["public"]["Tables"]["sources"]["Row"];

export type CreateSourceParams = Pick<
  SourceRow,
  "type" | "name" | "url" | "metadata" | "is_active"
>;

export type UpdateSourceParams = {
  id: SourceRow["id"];
  fields: Partial<
    Pick<SourceRow, "type" | "name" | "url" | "metadata" | "is_active">
  >;
};

const normalizeOptionalField = <T>(value: T | null | undefined): T | null =>
  value === undefined ? null : value;

export async function createSource(
  supabase: Client,
  fields: CreateSourceParams,
) {
  const { data } = await supabase
    .from("sources")
    .insert({
      type: fields.type,
      name: normalizeOptionalField(fields.name),
      url: normalizeOptionalField(fields.url),
      metadata: normalizeOptionalField(fields.metadata),
      is_active: fields.is_active,
    })
    .select("id")
    .maybeSingle()
    .throwOnError();

  return data;
}

export async function updateSource(
  supabase: Client,
  params: UpdateSourceParams,
) {
  const { id, fields } = params;
  const updateData: Partial<Omit<SourceRow, "id" | "created_at" | "updated_at">> = {};

  if (fields.type !== undefined) {
    updateData.type = fields.type;
  }
  if (fields.name !== undefined) {
    updateData.name = normalizeOptionalField(fields.name);
  }
  if (fields.url !== undefined) {
    updateData.url = normalizeOptionalField(fields.url);
  }
  if (fields.metadata !== undefined) {
    updateData.metadata = normalizeOptionalField(fields.metadata);
  }
  if (fields.is_active !== undefined) {
    updateData.is_active = fields.is_active;
  }

  const { data } = await supabase
    .from("sources")
    .update(updateData)
    .eq("id", id)
    .select("id")
    .maybeSingle()
    .throwOnError();

  return data;
}

export async function updateUser(supabase: Client, data: any) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return;
  }

  return supabase
    .from("users")
    .update(data)
    .eq("id", session.user.id)
    .select()
    .single();
}

export async function deleteUser(supabase: Client) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return;
  }

  await Promise.all([
    supabase.auth.admin.deleteUser(session.user.id),
    supabase.from("users").delete().eq("id", session.user.id),
    supabase.auth.signOut(),
  ]);

  return session.user.id;
}

// Billing-related functions removed - not used in Zeke
// (prices/products tables don't exist in current schema)
