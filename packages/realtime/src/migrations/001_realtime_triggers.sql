-- Realtime LISTEN/NOTIFY Triggers
-- Run this migration to enable realtime updates on selected tables

-- Create function to notify on table changes
CREATE OR REPLACE FUNCTION notify_table_change()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'table_changes',
    json_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'record', CASE
        WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
        ELSE row_to_json(NEW)
      END,
      'old_record', CASE
        WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)
        ELSE NULL
      END
    )::text
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to documents table (for vault realtime updates)
DROP TRIGGER IF EXISTS documents_realtime_changes ON documents;
CREATE TRIGGER documents_realtime_changes
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION notify_table_change();

-- Apply trigger to inbox table (for inbox realtime updates)
DROP TRIGGER IF EXISTS inbox_realtime_changes ON inbox;
CREATE TRIGGER inbox_realtime_changes
  AFTER INSERT OR UPDATE OR DELETE ON inbox
  FOR EACH ROW EXECUTE FUNCTION notify_table_change();

-- Apply trigger to notifications table
DROP TRIGGER IF EXISTS notifications_realtime_changes ON notifications;
CREATE TRIGGER notifications_realtime_changes
  AFTER INSERT OR UPDATE OR DELETE ON notifications
  FOR EACH ROW EXECUTE FUNCTION notify_table_change();

-- Apply trigger to activities table
DROP TRIGGER IF EXISTS activities_realtime_changes ON activities;
CREATE TRIGGER activities_realtime_changes
  AFTER INSERT OR UPDATE OR DELETE ON activities
  FOR EACH ROW EXECUTE FUNCTION notify_table_change();

-- Apply trigger to chats table
DROP TRIGGER IF EXISTS chats_realtime_changes ON chats;
CREATE TRIGGER chats_realtime_changes
  AFTER INSERT OR UPDATE OR DELETE ON chats
  FOR EACH ROW EXECUTE FUNCTION notify_table_change();

-- Apply trigger to chat_messages table
DROP TRIGGER IF EXISTS chat_messages_realtime_changes ON chat_messages;
CREATE TRIGGER chat_messages_realtime_changes
  AFTER INSERT OR UPDATE OR DELETE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION notify_table_change();

COMMENT ON FUNCTION notify_table_change() IS 'Triggers pg_notify for realtime updates via WebSocket';
