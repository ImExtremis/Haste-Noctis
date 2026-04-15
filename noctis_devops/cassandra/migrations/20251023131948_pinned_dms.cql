CREATE TABLE IF NOT EXISTS noctis.pinned_dms (
    user_id bigint,
    channel_id bigint,
    sort_order int,
    PRIMARY KEY ((user_id), channel_id)
);
