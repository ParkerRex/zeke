import {
  logDatabaseError,
  measurePerformance,
} from "@/src/utils/sentry-config";
import { connectDb, type Database } from "@zeke/db/client";

export type TransactionClient = Database;

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Execute a function within a database transaction
 * Uses Drizzle's transaction support
 */
export async function withTransaction<T>(
  operation: string,
  fn: (client: TransactionClient) => Promise<T>,
  options: {
    useAdminClient?: boolean;
    userId?: string;
  } = {},
): Promise<TransactionResult<T>> {
  const { userId } = options;

  return measurePerformance(
    `transaction:${operation}`,
    async () => {
      try {
        const db = await connectDb();
        const result = await fn(db);

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        logDatabaseError(error as Error, {
          operation,
          userId,
        });

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    { operation, userId },
  );
}

/**
 * Create a user record
 * TODO: Add customer record support when database schema is updated
 */
export async function createUserWithCustomer(
  userData: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  },
  customerData: {
    stripe_customer_id: string;
  },
): Promise<TransactionResult<{ userId: string; customerId: string }>> {
  return withTransaction(
    "create_user_with_customer",
    async (client) => {
      // Step 1: Create user record
      const { data: user, error: userError } = await client
        .from("users")
        .insert([
          {
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
          },
        ])
        .select("id")
        .single();

      if (userError) {
        throw new Error(`Failed to create user: ${userError.message}`);
      }

      // TODO: Create customer record when 'customers' table exists
      console.log(
        `Created user ${user.id}, customer ID ${customerData.stripe_customer_id} not stored`,
      );

      return {
        userId: user.id,
        customerId: user.id,
      };
    },
    { useAdminClient: true, userId: userData.id },
  );
}

/**
 * Update user subscription with proper error handling
 */
export async function updateUserSubscription(
  userId: string,
  subscriptionData: {
    subscription_id: string;
    status: string;
    price_id?: string;
    current_period_start?: string;
    current_period_end?: string;
    cancel_at_period_end?: boolean;
  },
): Promise<TransactionResult<{ subscriptionId: string }>> {
  return withTransaction(
    "update_user_subscription",
    async (client) => {
      // Step 1: Ensure user exists
      const { data: user, error: userError } = await client
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Step 2: Upsert subscription
      const { data: subscription, error: subscriptionError } = await client
        .from("subscriptions")
        .upsert({
          id: subscriptionData.subscription_id,
          user_id: userId,
          status: subscriptionData.status as any, // Cast to match DB enum
          price_id: subscriptionData.price_id || null,
          current_period_start: subscriptionData.current_period_start || null,
          current_period_end: subscriptionData.current_period_end || null,
          cancel_at_period_end: subscriptionData.cancel_at_period_end || null,
        })
        .select("id")
        .single();

      if (subscriptionError) {
        throw new Error(
          `Failed to update subscription: ${subscriptionError.message}`,
        );
      }

      return {
        subscriptionId: subscription.id,
      };
    },
    { useAdminClient: true, userId },
  );
}

/**
 * Create a story with content and overlays atomically
 */
export async function createStoryWithContent(
  storyData: {
    title?: string;
    canonical_url?: string;
    kind?: string;
    primary_url?: string;
    published_at?: string;
    cluster_key?: string;
  },
  contentData: {
    raw_item_id: string;
    text: string;
    html_url?: string;
    lang?: string;
    content_hash: string;
  },
  overlayData?: {
    why_it_matters?: string;
    chili?: number;
    confidence?: number;
    citations?: any;
    model_version?: string;
  },
): Promise<TransactionResult<{ storyId: string; contentId: string }>> {
  return withTransaction(
    "create_story_with_content",
    async (client) => {
      // Step 1: Create content
      const { data: content, error: contentError } = await client
        .from("contents")
        .insert([contentData])
        .select("id")
        .single();

      if (contentError) {
        throw new Error(`Failed to create content: ${contentError.message}`);
      }

      // Step 2: Create story
      const { data: story, error: storyError } = await client
        .from("stories")
        .insert([
          {
            ...storyData,
            content_id: content.id,
          },
        ])
        .select("id")
        .single();

      if (storyError) {
        // Rollback: Delete the content record
        await client.from("contents").delete().eq("id", content.id);

        throw new Error(`Failed to create story: ${storyError.message}`);
      }

      // Step 3: Create overlay if provided
      if (overlayData) {
        const { error: overlayError } = await client
          .from("story_overlays")
          .insert([
            {
              story_id: story.id,
              ...overlayData,
              analyzed_at: new Date().toISOString(),
            },
          ]);

        if (overlayError) {
          // Rollback: Delete story and content
          await client.from("stories").delete().eq("id", story.id);
          await client.from("contents").delete().eq("id", content.id);

          throw new Error(
            `Failed to create story overlay: ${overlayError.message}`,
          );
        }
      }

      return {
        storyId: story.id,
        contentId: content.id,
      };
    },
    { useAdminClient: true },
  );
}

/**
 * Batch operation helper for processing multiple items
 */
export async function batchOperation<T, R>(
  operation: string,
  items: T[],
  processor: (item: T, client: TransactionClient) => Promise<R>,
  options: {
    batchSize?: number;
    useAdminClient?: boolean;
    continueOnError?: boolean;
  } = {},
): Promise<{
  success: boolean;
  results: R[];
  errors: Array<{ item: T; error: string }>;
}> {
  const {
    batchSize = 10,
    useAdminClient = false,
    continueOnError = false,
  } = options;
  const results: R[] = [];
  const errors: Array<{ item: T; error: string }> = [];

  // Process items in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const batchPromises = batch.map(async (item) => {
      const result = await withTransaction(
        `${operation}_batch_item`,
        (client) => processor(item, client),
        { useAdminClient },
      );

      if (result.success && result.data) {
        results.push(result.data);
      } else {
        errors.push({ item, error: result.error || "Unknown error" });

        if (!continueOnError) {
          throw new Error(`Batch operation failed: ${result.error}`);
        }
      }
    });

    try {
      await Promise.all(batchPromises);
    } catch (error) {
      if (!continueOnError) {
        return {
          success: false,
          results,
          errors,
        };
      }
    }
  }

  return {
    success: errors.length === 0,
    results,
    errors,
  };
}
