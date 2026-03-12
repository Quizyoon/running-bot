import { pool } from "../db/client";

export interface EventRecord {
  eventId: string;
  groupId: string;
  eventType: "WEEKLY_ATTENDANCE" | "DAILY_RACE";
  eventName: string | null;
  eventDate: string | null;
  eventEndDate: string | null;
  weekStart: string | null;
  createdBy: string;
  prizeInfo: string | null;
  prizeProductId: string | null;
  prizeImageUrl: string | null;
  prizePrice: number | null;
  eventMethod: string;
  status: string;
  winnerUserId: string | null;
}

export async function createDailyRaceEvent(
  groupId: string,
  eventDate: string,
  createdBy: string,
  options?: { eventName?: string; prizeInfo?: string; eventEndDate?: string; prizeProductId?: string; prizeImageUrl?: string; prizePrice?: number; eventMethod?: string }
): Promise<string> {
  const endDate = options?.eventEndDate || eventDate;

  const result = await pool.query(
    `INSERT INTO events (group_id, event_type, event_name, event_date, event_end_date, created_by, prize_info, prize_product_id, prize_image_url, prize_price, event_method, status)
     VALUES ($1, 'DAILY_RACE', $2, $3, $4, $5, $6, $7, $8, $9, $10, 'SCHEDULED')
     RETURNING event_id`,
    [groupId, options?.eventName || null, eventDate, endDate, createdBy, options?.prizeInfo || null, options?.prizeProductId || null, options?.prizeImageUrl || null, options?.prizePrice || null, options?.eventMethod || "fastest_pace"]
  );
  return result.rows[0].event_id;
}

export async function cancelEvent(
  groupId: string,
  eventId?: string
): Promise<boolean> {
  let query: string;
  let params: any[];

  if (eventId) {
    query = `UPDATE events SET status = 'CANCELLED' WHERE event_id = $1 AND group_id = $2 RETURNING event_id`;
    params = [eventId, groupId];
  } else {
    // 가장 최근 예약된 이벤트 취소
    query = `UPDATE events SET status = 'CANCELLED'
             WHERE event_id = (
               SELECT event_id FROM events
               WHERE group_id = $1 AND status = 'SCHEDULED'
               ORDER BY event_date ASC LIMIT 1
             ) AND group_id = $1 RETURNING event_id`;
    params = [groupId];
  }

  const result = await pool.query(query, params);
  return result.rows.length > 0;
}

export async function getActiveEvent(
  groupId: string,
  date: string
): Promise<EventRecord | null> {
  const result = await pool.query(
    `SELECT * FROM events
     WHERE group_id = $1
       AND event_type = 'DAILY_RACE'
       AND status IN ('SCHEDULED', 'ACTIVE')
       AND event_date <= $2
       AND COALESCE(event_end_date, event_date) >= $2
     LIMIT 1`,
    [groupId, date]
  );

  if (result.rows.length === 0) return null;
  return mapEventRow(result.rows[0]);
}

/** 종료일이 지난 이벤트 찾기 (아직 CLOSED 아닌 것) */
export async function getExpiredEvents(
  groupId: string,
  todayDate: string
): Promise<EventRecord[]> {
  const result = await pool.query(
    `SELECT * FROM events
     WHERE group_id = $1
       AND event_type = 'DAILY_RACE'
       AND status IN ('SCHEDULED', 'ACTIVE')
       AND COALESCE(event_end_date, event_date) < $2
     ORDER BY event_date ASC`,
    [groupId, todayDate]
  );
  return result.rows.map(mapEventRow);
}

export async function getUpcomingEvents(
  groupId: string
): Promise<EventRecord[]> {
  const result = await pool.query(
    `SELECT * FROM events
     WHERE group_id = $1 AND status IN ('SCHEDULED', 'ACTIVE')
       AND COALESCE(event_end_date, event_date) >= CURRENT_DATE
     ORDER BY event_date ASC
     LIMIT 5`,
    [groupId]
  );
  return result.rows.map(mapEventRow);
}

export async function closeEventAndDetermineWinner(
  eventId: string,
  groupId: string
): Promise<{ winnerId: string; winnerName: string } | null> {
  const event = await pool.query(
    `SELECT event_date, event_end_date, event_method FROM events WHERE event_id = $1`,
    [eventId]
  );
  if (event.rows.length === 0) return null;

  const { event_date, event_end_date, event_method } = event.rows[0];
  const startDate = event_date;
  const endDate = event_end_date || event_date;
  const method = event_method || "fastest_pace";

  let query: string;
  let params: any[];

  switch (method) {
    case "longest_distance":
      query = `SELECT user_id, display_name
               FROM running_sessions
               WHERE group_id = $1 AND run_date >= $2 AND run_date <= $3
               ORDER BY distance_km DESC, created_at ASC
               LIMIT 1`;
      params = [groupId, startDate, endDate];
      break;
    case "most_runs":
      query = `SELECT user_id, MAX(display_name) AS display_name, COUNT(DISTINCT run_date) AS cnt
               FROM running_sessions
               WHERE group_id = $1 AND run_date >= $2 AND run_date <= $3
               GROUP BY user_id
               ORDER BY cnt DESC, MIN(created_at) ASC
               LIMIT 1`;
      params = [groupId, startDate, endDate];
      break;
    case "fastest_pace":
    default:
      query = `SELECT user_id, display_name
               FROM running_sessions
               WHERE group_id = $1 AND run_date >= $2 AND run_date <= $3
               ORDER BY pace_min_per_km ASC, created_at ASC
               LIMIT 1`;
      params = [groupId, startDate, endDate];
      break;
  }

  const sessions = await pool.query(query, params);

  if (sessions.rows.length === 0) {
    await pool.query(
      `UPDATE events SET status = 'CLOSED' WHERE event_id = $1`,
      [eventId]
    );
    return null;
  }

  const winner = sessions.rows[0];
  await pool.query(
    `UPDATE events SET status = 'CLOSED', winner_user_id = $1 WHERE event_id = $2`,
    [winner.user_id, eventId]
  );

  return { winnerId: winner.user_id, winnerName: winner.display_name };
}

export async function getWeeklyPerfectAttendees(
  groupId: string,
  weekStart: Date
): Promise<{ userId: string; displayName: string }[]> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const result = await pool.query(
    `SELECT user_id, MAX(display_name) AS display_name, COUNT(DISTINCT run_date) AS days
     FROM running_sessions
     WHERE group_id = $1
       AND is_attendance = true
       AND run_date >= $2
       AND run_date <= $3
     GROUP BY user_id
     HAVING COUNT(DISTINCT run_date) = 7`,
    [groupId, weekStart.toISOString().split("T")[0], weekEnd.toISOString().split("T")[0]]
  );

  return result.rows.map((r) => ({
    userId: r.user_id,
    displayName: r.display_name,
  }));
}

export async function getEventById(eventId: string): Promise<EventRecord | null> {
  const result = await pool.query(`SELECT * FROM events WHERE event_id = $1`, [eventId]);
  if (result.rows.length === 0) return null;
  return mapEventRow(result.rows[0]);
}

function mapEventRow(row: any): EventRecord {
  return {
    eventId: row.event_id,
    groupId: row.group_id,
    eventType: row.event_type,
    eventName: row.event_name || null,
    eventDate: row.event_date
      ? new Date(row.event_date).toISOString().split("T")[0]
      : null,
    eventEndDate: row.event_end_date
      ? new Date(row.event_end_date).toISOString().split("T")[0]
      : null,
    weekStart: row.week_start
      ? new Date(row.week_start).toISOString().split("T")[0]
      : null,
    createdBy: row.created_by,
    prizeInfo: row.prize_info || null,
    prizeProductId: row.prize_product_id || null,
    prizeImageUrl: row.prize_image_url || null,
    prizePrice: row.prize_price ? Number(row.prize_price) : null,
    eventMethod: row.event_method || "fastest_pace",
    status: row.status,
    winnerUserId: row.winner_user_id,
  };
}
