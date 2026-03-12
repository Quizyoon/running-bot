import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS running_sessions (
  session_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          VARCHAR NOT NULL,
  group_id         VARCHAR NOT NULL,
  display_name     VARCHAR NOT NULL DEFAULT 'Unknown',
  run_date         DATE NOT NULL,
  distance_km      FLOAT NOT NULL,
  duration_sec     INTEGER NOT NULL,
  pace_min_per_km  FLOAT NOT NULL,
  screenshot_url   VARCHAR,
  source_app       VARCHAR,
  is_attendance    BOOLEAN DEFAULT true,
  event_id         UUID,
  created_at       TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS member_stats (
  user_id              VARCHAR NOT NULL,
  group_id             VARCHAR NOT NULL,
  display_name         VARCHAR NOT NULL,
  monthly_distance_km  FLOAT DEFAULT 0,
  monthly_avg_pace     FLOAT,
  weekly_attendance    INTEGER DEFAULT 0,
  streak_days          INTEGER DEFAULT 0,
  badges               TEXT[] DEFAULT '{}',
  ranking_score        FLOAT DEFAULT 0,
  updated_at           TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, group_id)
);

CREATE TABLE IF NOT EXISTS events (
  event_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       VARCHAR NOT NULL,
  event_type     VARCHAR NOT NULL,
  event_name     VARCHAR,
  event_date     DATE,
  event_end_date DATE,
  week_start     DATE,
  created_by     VARCHAR NOT NULL,
  prize_info     VARCHAR,
  status         VARCHAR DEFAULT 'SCHEDULED',
  winner_user_id VARCHAR,
  created_at     TIMESTAMP DEFAULT now()
);

ALTER TABLE events ADD COLUMN IF NOT EXISTS event_name VARCHAR;
ALTER TABLE events ADD COLUMN IF NOT EXISTS prize_info VARCHAR;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_end_date DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS prize_product_id VARCHAR;

CREATE INDEX IF NOT EXISTS idx_sessions_group_date ON running_sessions(group_id, run_date);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON running_sessions(user_id, run_date);
CREATE INDEX IF NOT EXISTS idx_events_group_status ON events(group_id, status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
`;

export async function initDatabase(): Promise<void> {
  await pool.query(SCHEMA_SQL);
  console.log("Database initialized");
}
