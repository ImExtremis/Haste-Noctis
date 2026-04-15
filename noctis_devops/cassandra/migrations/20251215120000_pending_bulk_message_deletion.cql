ALTER TABLE noctis.users ADD pending_bulk_message_deletion_at timestamp;
ALTER TABLE noctis.users ADD pending_bulk_message_deletion_channel_count int;
ALTER TABLE noctis.users ADD pending_bulk_message_deletion_message_count int;
