CREATE TABLE IF NOT EXISTS noctis.instance_configuration (
    key text PRIMARY KEY,
    value text,
    updated_at timestamp
);

INSERT INTO noctis.instance_configuration (key, value, updated_at)
VALUES ('manual_review_enabled', 'true', toTimestamp(now()));

INSERT INTO noctis.instance_configuration (key, value, updated_at)
VALUES ('manual_review_schedule_enabled', 'false', toTimestamp(now()));

INSERT INTO noctis.instance_configuration (key, value, updated_at)
VALUES ('manual_review_schedule_start_hour_utc', '0', toTimestamp(now()));

INSERT INTO noctis.instance_configuration (key, value, updated_at)
VALUES ('manual_review_schedule_end_hour_utc', '23', toTimestamp(now()));
