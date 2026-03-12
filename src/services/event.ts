import { pool } from "../db/client";

export interface EventRecord {
  eventId: string;
  groupId: string;
  eventType: "WEEKLY_ATTENDANCE" | "DAILY_RACE";
  eventDate: string | null;
  weekStart: string | null;
  createdBy: string;
  status: string;
  winnerUserId: string | null;
}

export async function createDailyRaceEvent(
  groupId: string,
  eventDate: string,
  createdBy: string
): Promise<string> {
  // 같은 날짜에 이미 이벤트가 있는지 확인
  const existing = await pool.query(
    `SELECT event_id FROM events
     WHERE group_id = $1 AND event_date = $2 AND event_type = 'DAILY_RACE'
       AND status != 'CANCELLED'`,
    [groupId, eventDate]
  );
  if (existing.rows.length > 0) {
    throw new Error("해당 날짜에 이미 이벤트가 있습니다.");
  }

  const result = await pool.query(
    `INSERT INTO events (group_id, event_type, event_date, created_by, status)
     VALUES ($1, 'DAILY_RACE', $2, $3, 'SCHEDULED')
     RETURNING event_id`,
    [groupId, eventDate, createdBy]
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
     WHERE group_id = $1 AND event_date = $2
       AND event_type = 'DAILY_RACE'
       AND status IN ('SCHEDULED', 'ACTIVE')
     LIMIT 1`,
    [groupId, date]
  );

  if (result.rows.length === 0) return null;
  return mapEventRow(result.rows[0]);
}

export async function getUpcomingEvents(
  groupId: string
): Promise<EventRecord[]> {
  const result = await pool.query(
    `SELECT * FROM events
     WHERE group_id = $1 AND status = 'SCHEDULED'
       AND event_date >= CURRENT_DATE
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
  // 가장 빠른 페이스의 참가자 찾기
  const event = await pool.query(
    `SELECT event_date FROM events WHERE event_id = $1`,
    [eventId]
  );
  if (event.rows.length === 0) return null;

  const sessions = await pool.query(
    `SELECT user_id, display_name, pace_min_per_km, created_at
     FROM running_sessions
     WHERE group_id = $1 AND run_date = $2
     ORDER BY pace_min_per_km ASC, created_at ASC
     LIMIT 1`,
    [groupId, event.rows[0].event_date]
  );

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

function mapEventRow(row: any): EventRecord {
  return {
    eventId: row.event_id,
    groupId: row.group_id,
    eventType: row.event_type,
    eventDate: row.event_date
      ? new Date(row.event_date).toISOString().split("T")[0]
      : null,
    weekStart: row.week_start
      ? new Date(row.week_start).toISOString().split("T")[0]
      : null,
    createdBy: row.created_by,
    status: row.status,
    winnerUserId: row.winner_user_id,
  };
}
