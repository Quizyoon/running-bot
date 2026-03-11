const TZ = process.env.TZ_OVERRIDE || "Asia/Seoul";

/** 설정된 타임존 기준 현재 Date 객체 (로컬 시간처럼 동작) */
export function nowKST(): Date {
  const s = new Date().toLocaleString("en-US", { timeZone: TZ });
  return new Date(s);
}

/** 설정된 타임존 기준 오늘 날짜 "YYYY-MM-DD" */
export function todayString(): string {
  const d = nowKST();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
