import type { ApiContext } from "@api/context";
import { logger } from "@zeke/logger";

/**
 * Audit event types for tracking sensitive operations
 */
export type AuditEventType =
  | "chat_message_created"
  | "assistant_tool_called"
  | "chat_feedback_submitted"
  | "story_created"
  | "story_deleted"
  | "insight_created"
  | "insight_linked"
  | "source_ingested"
  | "playbook_executed"
  | "team_member_invited"
  | "team_member_removed"
  | "permissions_changed"
  | "data_exported";

/**
 * Audit event metadata
 */
export interface AuditEvent {
  type: AuditEventType;
  userId: string;
  teamId?: string;
  resource?: {
    type: string;
    id: string;
  };
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  timestamp?: string;
}

/**
 * Log an audit event with contextual information
 */
export function auditLog(
  ctx: Partial<ApiContext>,
  event: Omit<AuditEvent, "userId" | "timestamp">,
) {
  const auditEvent: AuditEvent = {
    ...event,
    userId: ctx.session?.user?.id || "anonymous",
    teamId: ctx.teamId || undefined,
    timestamp: new Date().toISOString(),
    ip:
      ctx.headers?.get?.("x-forwarded-for") || ctx.headers?.get?.("x-real-ip"),
    userAgent: ctx.headers?.get?.("user-agent"),
  };

  // Log to structured logger
  logger.info("audit_event", auditEvent);

  // In production, also send to audit service/database
  if (process.env.NODE_ENV === "production") {
    // TODO: Send to audit storage (e.g., BigQuery, CloudWatch)
    sendToAuditStorage(auditEvent);
  }
}

/**
 * Log a batch of audit events
 */
export function auditLogBatch(
  ctx: Partial<ApiContext>,
  events: Array<Omit<AuditEvent, "userId" | "timestamp">>,
) {
  for (const event of events) {
    auditLog(ctx, event);
  }
}

/**
 * Create an audit logger bound to a specific context
 */
export function createAuditLogger(ctx: Partial<ApiContext>) {
  return {
    log: (event: Omit<AuditEvent, "userId" | "timestamp">) =>
      auditLog(ctx, event),

    logBatch: (events: Array<Omit<AuditEvent, "userId" | "timestamp">>) =>
      auditLogBatch(ctx, events),

    // Convenience methods for common events
    logChatMessage: (chatId: string, messageId: string, metadata?: any) =>
      auditLog(ctx, {
        type: "chat_message_created",
        resource: { type: "chat_message", id: messageId },
        metadata: { chatId, ...metadata },
      }),

    logToolCall: (toolName: string, chatId: string, metadata?: any) =>
      auditLog(ctx, {
        type: "assistant_tool_called",
        resource: { type: "tool", id: toolName },
        metadata: { chatId, ...metadata },
      }),

    logFeedback: (chatId: string, messageId: string, type: string) =>
      auditLog(ctx, {
        type: "chat_feedback_submitted",
        resource: { type: "chat_message", id: messageId },
        metadata: { chatId, feedbackType: type },
      }),

    logDataExport: (exportType: string, resourceCount: number) =>
      auditLog(ctx, {
        type: "data_exported",
        metadata: { exportType, resourceCount },
      }),
  };
}

/**
 * Send audit events to external storage
 * This is a placeholder for actual implementation
 */
function sendToAuditStorage(event: AuditEvent) {
  // Implement based on your audit storage solution
  // Examples:
  // - Send to BigQuery for analysis
  // - Send to CloudWatch Logs for compliance
  // - Store in separate audit database
  // - Send to SIEM system

  // For now, just log that we would send it
  if (process.env.AUDIT_WEBHOOK_URL) {
    fetch(process.env.AUDIT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch((err) => {
      logger.error("Failed to send audit event", { error: err, event });
    });
  }
}

/**
 * Middleware to automatically log API calls
 */
export function auditMiddleware(procedureName: string) {
  return async (opts: any) => {
    const { ctx, next, input } = opts;

    const start = Date.now();
    const audit = createAuditLogger(ctx);

    try {
      const result = await next({ ctx: { ...ctx, audit } });

      // Log successful API calls for sensitive operations
      if (isSensitiveOperation(procedureName)) {
        audit.log({
          type: "api_call" as any,
          metadata: {
            procedure: procedureName,
            duration: Date.now() - start,
            success: true,
          },
        });
      }

      return result;
    } catch (error) {
      // Log failed API calls
      audit.log({
        type: "api_call" as any,
        metadata: {
          procedure: procedureName,
          duration: Date.now() - start,
          success: false,
          error: error.message,
        },
      });
      throw error;
    }
  };
}

/**
 * Check if an operation should be audited
 */
function isSensitiveOperation(procedureName: string): boolean {
  const sensitivePatterns = [
    /delete/i,
    /remove/i,
    /export/i,
    /invite/i,
    /permission/i,
    /role/i,
    /billing/i,
    /payment/i,
  ];

  return sensitivePatterns.some((pattern) => pattern.test(procedureName));
}
