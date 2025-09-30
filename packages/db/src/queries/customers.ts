import type { Database } from "@db/client";
import {
  customers,
  customerTags,
  // invoices, // REMOVED: invoices table removed in migration to Zeke
  // tags, // REMOVED: tags table removed in migration to Zeke
  // trackerProjects, // REMOVED: trackerProjects table removed in migration to Zeke
} from "@db/schema";
import { buildSearchQuery } from "@zeke/db/utils/search-query";
// import { generateToken } from "@zeke/invoice/token"; // REMOVED: invoice module dependency
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";
// import { createActivity } from "./activities"; // TODO: Re-enable when activities module is created

type GetCustomerByIdParams = {
  id: string;
  teamId: string;
};

export const getCustomerById = async (
  db: Database,
  params: GetCustomerByIdParams,
) => {
  const [result] = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      billingEmail: customers.billingEmail,
      phone: customers.phone,
      website: customers.website,
      createdAt: customers.createdAt,
      teamId: customers.teamId,
      country: customers.country,
      addressLine1: customers.addressLine1,
      addressLine2: customers.addressLine2,
      city: customers.city,
      state: customers.state,
      zip: customers.zip,
      note: customers.note,
      vatNumber: customers.vatNumber,
      countryCode: customers.countryCode,
      token: customers.token,
      contact: customers.contact,
      // invoiceCount: sql<number>`cast(count(${invoices.id}) as int)`, // REMOVED: invoices table removed
      // projectCount: sql<number>`cast(count(${trackerProjects.id}) as int)`, // REMOVED: trackerProjects table removed
      tags: sql<CustomerTag[]>`'[]'`.as("tags"), // REMOVED: tags table removed, returning empty array
    })
    .from(customers)
    .where(
      and(eq(customers.id, params.id), eq(customers.teamId, params.teamId)),
    )
    // .leftJoin(invoices, eq(invoices.customerId, customers.id)) // REMOVED: invoices table removed
    // .leftJoin(trackerProjects, eq(trackerProjects.customerId, customers.id)) // REMOVED: trackerProjects table removed
    .leftJoin(customerTags, eq(customerTags.customerId, customers.id))
    // .leftJoin(tags, eq(tags.id, customerTags.tagId)) // REMOVED: tags table removed
    .groupBy(customers.id);

  return result;
};

export type GetCustomersParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  q?: string | null;

  sort?: string[] | null;
};

export type CustomerTag = {
  id: string;
  name: string;
};

export const getCustomers = async (
  db: Database,
  params: GetCustomersParams,
) => {
  const { teamId, sort, cursor, pageSize = 25, q } = params;

  const whereConditions: SQL[] = [eq(customers.teamId, teamId)];

  // Apply search query filter
  if (q) {
    // If the query is a number, search by numeric fields if any
    if (!Number.isNaN(Number.parseInt(q))) {
      // Add numeric search logic if needed
    } else {
      const query = buildSearchQuery(q);

      // Search using full-text search or name
      whereConditions.push(
        sql`(to_tsquery('english', ${query}) @@ ${customers.fts} OR ${customers.name} ILIKE '%' || ${q} || '%')`,
      );
    }
  }

  // Start building the query
  const query = db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      billingEmail: customers.billingEmail,
      phone: customers.phone,
      website: customers.website,
      createdAt: customers.createdAt,
      teamId: customers.teamId,
      country: customers.country,
      addressLine1: customers.addressLine1,
      addressLine2: customers.addressLine2,
      city: customers.city,
      state: customers.state,
      zip: customers.zip,
      note: customers.note,
      vatNumber: customers.vatNumber,
      countryCode: customers.countryCode,
      token: customers.token,
      contact: customers.contact,
      // invoiceCount: sql<number>`cast(count(${invoices.id}) as int)`, // REMOVED: invoices table removed
      // projectCount: sql<number>`cast(count(${trackerProjects.id}) as int)`, // REMOVED: trackerProjects table removed
      tags: sql<CustomerTag[]>`'[]'`.as("tags"), // REMOVED: tags table removed, returning empty array
    })
    .from(customers)
    // .leftJoin(invoices, eq(invoices.customerId, customers.id)) // REMOVED: invoices table removed
    // .leftJoin(trackerProjects, eq(trackerProjects.customerId, customers.id)) // REMOVED: trackerProjects table removed
    .leftJoin(customerTags, eq(customerTags.customerId, customers.id))
    // .leftJoin(tags, eq(tags.id, customerTags.tagId)) // REMOVED: tags table removed
    .where(and(...whereConditions))
    .groupBy(customers.id);

  // Apply sorting
  if (sort && sort.length === 2) {
    const [column, direction] = sort;
    const isAscending = direction === "asc";

    if (column === "name") {
      isAscending
        ? query.orderBy(asc(customers.name))
        : query.orderBy(desc(customers.name));
    } else if (column === "created_at") {
      isAscending
        ? query.orderBy(asc(customers.createdAt))
        : query.orderBy(desc(customers.createdAt));
    } else if (column === "contact") {
      isAscending
        ? query.orderBy(asc(customers.contact))
        : query.orderBy(desc(customers.contact));
    } else if (column === "email") {
      isAscending
        ? query.orderBy(asc(customers.email))
        : query.orderBy(desc(customers.email));
    }
    // REMOVED: invoice, project, and tag sorting since those tables are removed
    // Add other sorting options as needed
  } else {
    // Default sort by created_at descending
    query.orderBy(desc(customers.createdAt));
  }

  // Apply pagination
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;
  query.limit(pageSize).offset(offset);

  // Execute query
  const data = await query;

  // Calculate next cursor
  const nextCursor =
    data && data.length === pageSize
      ? (offset + pageSize).toString()
      : undefined;

  return {
    meta: {
      cursor: nextCursor ?? null,
      hasPreviousPage: offset > 0,
      hasNextPage: data && data.length === pageSize,
    },
    data,
  };
};

export type UpsertCustomerParams = {
  id?: string;
  teamId: string;
  userId?: string;
  name: string;
  email: string;
  billingEmail?: string | null;
  country?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  note?: string | null;
  website?: string | null;
  phone?: string | null;
  contact?: string | null;
  vatNumber?: string | null;
  countryCode?: string | null;
  tags?: { id: string; name: string }[] | null;
};

export const upsertCustomer = async (
  db: Database,
  params: UpsertCustomerParams,
) => {
  const { id, tags: inputTags, teamId, userId, ...rest } = params;

  // const token = id ? await generateToken(id) : undefined; // REMOVED: generateToken dependency
  const token = undefined; // Placeholder since generateToken is removed

  const isNewCustomer = !id;

  // Upsert customer
  const [customer] = await db
    .insert(customers)
    .values({
      id,
      teamId,
      ...rest,
    })
    .onConflictDoUpdate({
      target: customers.id,
      set: {
        name: rest.name,
        email: rest.email,
        billingEmail: rest.billingEmail,
        token,
        country: rest.country,
        addressLine1: rest.addressLine1,
        addressLine2: rest.addressLine2,
        city: rest.city,
        state: rest.state,
        zip: rest.zip,
        note: rest.note,
        website: rest.website,
        phone: rest.phone,
        contact: rest.contact,
        vatNumber: rest.vatNumber,
        countryCode: rest.countryCode,
      },
    })
    .returning();

  if (!customer) {
    throw new Error("Failed to create or update customer");
  }

  const customerId = customer.id;

  // Create activity for new customers only
  if (isNewCustomer) {
    // TODO: Re-enable when activities module is created
    // createActivity(db, {
    //   teamId,
    //   userId,
    //   type: "customer_created",
    //   source: "user",
    //   priority: 7,
    //   metadata: {
    //     customerId: customerId,
    //     customerName: customer.name,
    //     customerEmail: customer.email,
    //     website: customer.website,
    //     country: customer.country,
    //     city: customer.city,
    //   },
    // });
  }

  // REMOVED: Tag association logic since tags table is removed
  // Previously would handle tag insertions and deletions here

  // Return the customer with empty tags
  const [result] = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      billingEmail: customers.billingEmail,
      phone: customers.phone,
      website: customers.website,
      createdAt: customers.createdAt,
      teamId: customers.teamId,
      country: customers.country,
      addressLine1: customers.addressLine1,
      addressLine2: customers.addressLine2,
      city: customers.city,
      state: customers.state,
      zip: customers.zip,
      note: customers.note,
      vatNumber: customers.vatNumber,
      countryCode: customers.countryCode,
      token: customers.token,
      contact: customers.contact,
      // invoiceCount: sql<number>`cast(count(${invoices.id}) as int)`, // REMOVED: invoices table removed
      // projectCount: sql<number>`cast(count(${trackerProjects.id}) as int)`, // REMOVED: trackerProjects table removed
      tags: sql<CustomerTag[]>`'[]'`.as("tags"), // REMOVED: tags table removed, returning empty array
    })
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.teamId, teamId)))
    // .leftJoin(invoices, eq(invoices.customerId, customers.id)) // REMOVED: invoices table removed
    // .leftJoin(trackerProjects, eq(trackerProjects.customerId, customers.id)) // REMOVED: trackerProjects table removed
    .leftJoin(customerTags, eq(customerTags.customerId, customers.id))
    // .leftJoin(tags, eq(tags.id, customerTags.tagId)) // REMOVED: tags table removed
    .groupBy(customers.id);

  return result;
};

export type DeleteCustomerParams = {
  id: string;
  teamId: string;
};

export const deleteCustomer = async (
  db: Database,
  params: DeleteCustomerParams,
) => {
  const { id, teamId } = params;

  // First, get the customer data before deleting it
  const customerToDelete = await getCustomerById(db, { id, teamId });

  if (!customerToDelete) {
    throw new Error("Customer not found");
  }

  // Delete the customer
  await db
    .delete(customers)
    .where(and(eq(customers.id, id), eq(customers.teamId, teamId)));

  // Return the deleted customer data
  return customerToDelete;
};
