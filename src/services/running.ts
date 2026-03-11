import { pool } from "../db/client";
import { OcrResult } from "../ocr/claude";

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
}

export function validateRunData(data: OcrResult): ValidationResult {
  const warnings: string[] = [];

  if (data.distanceKm !== null) {
    if (data.distanceKm < 0.5) {
      warnings.push("거리가 0.5km 미만입니다. 확인해주세요.");
    }
    if (data.distanceKm > 100) {
      warnings.push("거리가 100km를 초과합니다. 확인해주세요.");
    }
  }

  if (data.paceMinPerKm !== null) {
    if (data.paceMinPerKm < 2.0) {
      warnings.push("페이스가 2'00\"/km 미만으로 너무 빠릅니다.");
    }
    if (data.paceMinPerKm > 20.0) {
      warnings.push("페이스가 20'00\"/km를 초과합니다.");
    }
  }

  if (data.runDate !== null) {
    const runDate = new Date(data.runDate);
    const now = new Date();
    const diffMs = now.getTime() - runDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours > 24) {
      warnings.push("당일 기록만 인정됩니다. 날짜를 확인해주세요.");
    }
    if (diffHours < -1) {
      warnings.push("미래 날짜입니다. 날짜를 확인해주세요.");
    }
  }

  const valid =
    data.distanceKm !== null &&
    data.durationSec !== null &&
    data.paceMinPerKm !== null &&
    warnings.length === 0;

  return { valid, warnings };
}

export interface SessionInput {
  userId: string;
  groupId: string;
  displayName: string;
  runDate: string;
  distanceKm: number;
  durationSec: number;
  paceMinPerKm: number;
  sourceApp?: string;
  eventId?: string;
}

export interface DuplicateRecord {
  distanceKm: number;
  durationSec: number;
  paceMinPerKm: number;
}

export async function checkDuplicate(
  userId: string,
  groupId: string,
  runDate: string
): Promise<DuplicateRecord | null> {
  const result = await pool.query(
    `SELECT distance_km, duration_sec, pace_min_per_km FROM running_sessions
     WHERE user_id = $1 AND group_id = $2 AND run_date = $3
     LIMIT 1`,
    [userId, groupId, runDate]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    distanceKm: parseFloat(row.distance_km),
    durationSec: parseInt(row.duration_sec),
    paceMinPerKm: parseFloat(row.pace_min_per_km),
  };
}

export async function saveSession(input: SessionInput): Promise<string> {
  const result = await pool.query(
    `INSERT INTO running_sessions
       (user_id, group_id, display_name, run_date, distance_km, duration_sec, pace_min_per_km, source_app, event_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING session_id`,
    [
      input.userId,
      input.groupId,
      input.displayName,
      input.runDate,
      input.distanceKm,
      input.durationSec,
      input.paceMinPerKm,
      input.sourceApp || null,
      input.eventId || null,
    ]
  );
  return result.rows[0].session_id;
}

export async function getPersonalStats(
  userId: string,
  groupId: string,
  year: number,
  month: number
): Promise<{
  totalDistance: number;
  avgPace: number;
  runCount: number;
  attendDays: number;
} | null> {
  const result = await pool.query(
    `SELECT
       COALESCE(SUM(distance_km), 0) AS total_distance,
       AVG(pace_min_per_km) AS avg_pace,
       COUNT(*) AS run_count,
       COUNT(DISTINCT run_date) FILTER (WHERE is_attendance = true) AS attend_days
     FROM running_sessions
     WHERE user_id = $1 AND group_id = $2
       AND EXTRACT(YEAR FROM run_date) = $3
       AND EXTRACT(MONTH FROM run_date) = $4`,
    [userId, groupId, year, month]
  );

  const row = result.rows[0];
  if (parseInt(row.run_count) === 0) return null;

  return {
    totalDistance: parseFloat(row.total_distance),
    avgPace: parseFloat(row.avg_pace),
    runCount: parseInt(row.run_count),
    attendDays: parseInt(row.attend_days),
  };
}
