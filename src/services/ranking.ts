import { pool } from "../db/client";

export interface RankingEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalDistance: number;
  avgPace: number;
  paceDisplay: string;
  score: number;
  badges: string[];
}

export async function getMonthlyRanking(
  groupId: string,
  year: number,
  month: number
): Promise<RankingEntry[]> {
  const result = await pool.query(
    `SELECT
       user_id,
       display_name,
       SUM(distance_km) AS total_distance,
       AVG(pace_min_per_km) AS avg_pace,
       COUNT(*) AS run_count
     FROM running_sessions
     WHERE group_id = $1
       AND EXTRACT(YEAR FROM run_date) = $2
       AND EXTRACT(MONTH FROM run_date) = $3
     GROUP BY user_id, display_name
     ORDER BY total_distance DESC`,
    [groupId, year, month]
  );

  if (result.rows.length === 0) return [];

  // 정규화를 위한 최대/최소값
  const maxDistance = Math.max(...result.rows.map((r: Record<string, any>) => parseFloat(r.total_distance)));
  const minPace = Math.min(...result.rows.map((r: Record<string, any>) => parseFloat(r.avg_pace)));

  // 배지 조회
  const badgeResult = await pool.query(
    `SELECT user_id, badges FROM member_stats WHERE group_id = $1`,
    [groupId]
  );
  const badgeMap = new Map<string, string[]>();
  for (const row of badgeResult.rows as Record<string, any>[]) {
    badgeMap.set(row.user_id, row.badges || []);
  }

  const entries: RankingEntry[] = result.rows.map((row: Record<string, any>) => {
    const totalDistance = parseFloat(row.total_distance);
    const avgPace = parseFloat(row.avg_pace);

    // 종합 점수 = (정규화 거리 × 0.6) + (정규화 페이스 점수 × 0.4)
    const normalizedDistance = maxDistance > 0 ? (totalDistance / maxDistance) * 100 : 0;
    const paceScore = avgPace > 0 ? (minPace / avgPace) * 100 : 0;
    const score = normalizedDistance * 0.6 + paceScore * 0.4;

    return {
      rank: 0,
      userId: row.user_id,
      displayName: row.display_name,
      totalDistance: Math.round(totalDistance * 100) / 100,
      avgPace: Math.round(avgPace * 100) / 100,
      paceDisplay: formatPace(avgPace),
      score: Math.round(score * 10) / 10,
      badges: badgeMap.get(row.user_id) || [],
    };
  });

  // 점수 기준 정렬 및 순위 부여
  entries.sort((a, b) => b.score - a.score);
  entries.forEach((e, i) => (e.rank = i + 1));

  return entries;
}

export async function getDailyPaceRanking(
  groupId: string,
  date: string
): Promise<RankingEntry[]> {
  const result = await pool.query(
    `SELECT user_id, display_name, distance_km, pace_min_per_km, created_at
     FROM running_sessions
     WHERE group_id = $1 AND run_date = $2
     ORDER BY pace_min_per_km ASC, created_at ASC`,
    [groupId, date]
  );

  return result.rows.map((row: Record<string, any>, i: number) => ({
    rank: i + 1,
    userId: row.user_id,
    displayName: row.display_name,
    totalDistance: parseFloat(row.distance_km),
    avgPace: parseFloat(row.pace_min_per_km),
    paceDisplay: formatPace(parseFloat(row.pace_min_per_km)),
    score: 0,
    badges: [],
  }));
}

export function formatPace(paceMin: number): string {
  const mins = Math.floor(paceMin);
  const secs = Math.round((paceMin - mins) * 60);
  return `${mins}'${secs.toString().padStart(2, "0")}"`;
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}시간 ${m}분 ${s}초`;
  }
  return `${m}분 ${s}초`;
}
