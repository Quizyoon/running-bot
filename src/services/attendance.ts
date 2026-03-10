import { pool } from "../db/client";

export type Badge = "🔥" | "⚡" | "🌟" | "👑";

export interface AttendanceStatus {
  days: boolean[]; // index 0=Mon ... 6=Sun
  totalDays: number;
}

export async function getWeeklyAttendance(
  userId: string,
  groupId: string,
  weekStart: Date
): Promise<AttendanceStatus> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const result = await pool.query(
    `SELECT DISTINCT run_date FROM running_sessions
     WHERE user_id = $1 AND group_id = $2
       AND is_attendance = true
       AND run_date >= $3 AND run_date <= $4
     ORDER BY run_date`,
    [userId, groupId, weekStart.toISOString().split("T")[0], weekEnd.toISOString().split("T")[0]]
  );

  const attendedDates = new Set(
    result.rows.map((r) => new Date(r.run_date).toISOString().split("T")[0])
  );

  const days: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(attendedDates.has(d.toISOString().split("T")[0]));
  }

  return { days, totalDays: attendedDates.size };
}

export async function getStreakDays(
  userId: string,
  groupId: string
): Promise<number> {
  const result = await pool.query(
    `SELECT DISTINCT run_date FROM running_sessions
     WHERE user_id = $1 AND group_id = $2 AND is_attendance = true
     ORDER BY run_date DESC
     LIMIT 60`,
    [userId, groupId]
  );

  if (result.rows.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let checkDate = new Date(today);

  for (const row of result.rows) {
    const runDate = new Date(row.run_date);
    runDate.setHours(0, 0, 0, 0);

    if (runDate.getTime() === checkDate.getTime()) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (
      runDate.getTime() === checkDate.getTime() - 86400000 &&
      streak === 0
    ) {
      // 오늘 아직 인증 안 했지만 어제까지 연속이면 카운트
      checkDate = new Date(runDate);
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export async function computeBadges(
  userId: string,
  groupId: string
): Promise<Badge[]> {
  const badges: Badge[] = [];
  const streak = await getStreakDays(userId, groupId);

  if (streak >= 3) badges.push("🔥");
  if (streak >= 7) badges.push("⚡");

  // 30일 누적 출석
  const result = await pool.query(
    `SELECT COUNT(DISTINCT run_date) AS total
     FROM running_sessions
     WHERE user_id = $1 AND group_id = $2 AND is_attendance = true`,
    [userId, groupId]
  );
  if (parseInt(result.rows[0].total) >= 30) badges.push("🌟");

  // 이번 달 개근 체크
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayOfMonth = now.getDate();

  const monthResult = await pool.query(
    `SELECT COUNT(DISTINCT run_date) AS month_total
     FROM running_sessions
     WHERE user_id = $1 AND group_id = $2 AND is_attendance = true
       AND EXTRACT(YEAR FROM run_date) = $3
       AND EXTRACT(MONTH FROM run_date) = $4`,
    [userId, groupId, year, month]
  );
  const monthTotal = parseInt(monthResult.rows[0].month_total);
  // 달이 끝났거나 현재까지 매일 출석이면 왕관
  if (monthTotal >= daysInMonth || (monthTotal >= dayOfMonth && dayOfMonth > 7)) {
    badges.push("👑");
  }

  return badges;
}

export async function updateMemberStats(
  userId: string,
  groupId: string,
  displayName: string
): Promise<void> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const stats = await pool.query(
    `SELECT
       COALESCE(SUM(distance_km), 0) AS total_dist,
       AVG(pace_min_per_km) AS avg_pace,
       COUNT(DISTINCT run_date) FILTER (WHERE is_attendance = true) AS attend
     FROM running_sessions
     WHERE user_id = $1 AND group_id = $2
       AND EXTRACT(YEAR FROM run_date) = $3
       AND EXTRACT(MONTH FROM run_date) = $4`,
    [userId, groupId, year, month]
  );

  const row = stats.rows[0];
  const streak = await getStreakDays(userId, groupId);
  const badges = await computeBadges(userId, groupId);

  // 주간 출석
  const weekStart = getWeekStartDate(now);
  const weeklyAttend = await getWeeklyAttendance(userId, groupId, weekStart);

  await pool.query(
    `INSERT INTO member_stats (user_id, group_id, display_name, monthly_distance_km, monthly_avg_pace, weekly_attendance, streak_days, badges, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
     ON CONFLICT (user_id, group_id) DO UPDATE SET
       display_name = $3,
       monthly_distance_km = $4,
       monthly_avg_pace = $5,
       weekly_attendance = $6,
       streak_days = $7,
       badges = $8,
       updated_at = now()`,
    [
      userId,
      groupId,
      displayName,
      parseFloat(row.total_dist),
      row.avg_pace ? parseFloat(row.avg_pace) : null,
      weeklyAttend.totalDays,
      streak,
      badges,
    ]
  );
}

export function getWeekStartDate(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getGroupWeeklyAttendance(
  groupId: string,
  weekStart: Date
): Promise<
  { displayName: string; userId: string; days: boolean[]; totalDays: number }[]
> {
  // 해당 그룹의 모든 멤버 가져오기
  const members = await pool.query(
    `SELECT DISTINCT user_id, display_name FROM member_stats
     WHERE group_id = $1`,
    [groupId]
  );

  const results = [];
  for (const member of members.rows) {
    const attendance = await getWeeklyAttendance(
      member.user_id,
      groupId,
      weekStart
    );
    results.push({
      displayName: member.display_name,
      userId: member.user_id,
      days: attendance.days,
      totalDays: attendance.totalDays,
    });
  }

  return results.sort((a, b) => b.totalDays - a.totalDays);
}
