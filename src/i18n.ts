export type Lang = "ko" | "en";

const texts = {
  // 출석 카드
  dayLabels: { ko: ["월", "화", "수", "목", "금", "토", "일"], en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  runningStreak: { ko: (days: number) => `${days}일째 달리는 중!`, en: (days: number) => `On a ${days}-day streak!` },
  perfectAttendance: { ko: "7일 개근 달성!", en: "7-day perfect!" },
  attendanceCount: { ko: (total: number) => `출석 ${total}/7일`, en: (total: number) => `Attendance ${total}/7 days` },
  daysRemaining: { ko: (n: number) => `개근까지 ${n}일 남았어요`, en: (n: number) => `${n} days left for perfect attendance` },
  attendanceFailed: { ko: "이번 주는\n개근 달성 실패 😢", en: "Perfect attendance\nnot achieved 😢" },
  checkMyRanking: { ko: "내 랭킹 확인하기", en: "Check My Ranking" },
  checkPrizes: { ko: "상품 확인하기", en: "Check Prizes" },
  attendanceAlt: { ko: (total: number) => `출석 현황: ${total}/7일`, en: (total: number) => `Attendance: ${total}/7 days` },

  // 랭킹 카드
  emptyRankingTitle: { ko: "지금 등록하면 1등이에요!", en: "Register now to be #1!" },
  noRecordsYet: { ko: "아직 등록된 기록이 없어요.", en: "No records yet." },
  emptyRankingAlt: { ko: "Weekly Ranking - 아직 기록이 없어요", en: "Weekly Ranking - No records yet" },
  rankTitle: { ko: (rank: number) => `오늘 ${rank}위에요`, en: (rank: number) => `#${rank} today` },
  registerPrompt: { ko: "기록을 등록해보세요!", en: "Register your record!" },
  checkAttendance: { ko: "출석 확인하기", en: "Check Attendance" },
  registerMyRecord: { ko: "기록 등록하기", en: "Register My Record" },

  // 확인 카드
  distance: { ko: "거리", en: "Distance" },
  duration: { ko: "시간", en: "Time" },
  pace: { ko: "페이스", en: "Pace" },
  register: { ko: "등록하기", en: "Register" },
  edit: { ko: "수정하기", en: "Edit" },
  confirmAlt: { ko: (name: string, km: number) => `${name}님의 러닝 기록: ${km}km`, en: (name: string, km: number) => `${name}'s running log: ${km}km` },

  // 중복 카드
  duplicateTitle: { ko: "오늘 기록은\n이미 등록되어 있어요.", en: "Today's record\nis already registered." },
  duplicateDesc: { ko: "동일 날짜에는 1건만 인정됩니다.", en: "Only 1 record per day is accepted." },
  duplicateAlt: { ko: "오늘 기록은 이미 등록되어 있어요.", en: "Today's record is already registered." },

  // 날짜 오류 카드
  dateErrorDesc: { ko: (ts: string) => `오늘의 기록만 등록할 수 있어요.\n${ts}`, en: (ts: string) => `Only today's record is accepted.\n${ts}` },
  dateErrorAlt: { ko: "오늘의 기록만 등록할 수 있어요.", en: "Only today's record is accepted." },
  registerAgain: { ko: "다시 등록하기", en: "Register Again" },

  // 수정 카드
  correctionTitle: { ko: "기록 수정", en: "Edit Record" },
  correctionPrompt: { ko: "어떤 항목을 수정할까요?", en: "Which field to edit?" },
  correctionAlt: { ko: "수정할 항목을 선택해주세요", en: "Select a field to edit" },

  // 텍스트 메시지
  noStatsThisMonth: { ko: "📊 이번 달 기록이 없습니다. 러닝 스크린샷을 업로드해보세요!", en: "📊 No records this month. Upload a running screenshot!" },
  myStatsTitle: { ko: (y: number, m: number) => `📊 ${y}년 ${m}월 내 기록`, en: (y: number, m: number) => `📊 My Stats — ${y}/${m}` },
  totalDistance: { ko: (d: string) => `📏 총 거리: ${d} km`, en: (d: string) => `📏 Total Distance: ${d} km` },
  avgPace: { ko: (p: string) => `🏃 평균 페이스: ${p}/km`, en: (p: string) => `🏃 Avg Pace: ${p}/km` },
  runCount: { ko: (n: number) => `🔢 러닝 횟수: ${n}회`, en: (n: number) => `🔢 Runs: ${n}` },
  attendDays: { ko: (n: number) => `📅 출석 일수: ${n}일`, en: (n: number) => `📅 Attendance: ${n} days` },

  noEvents: { ko: "📢 현재 예정된 이벤트가 없습니다.\n\n🗓 매주 진행되는 주간 개근 챌린지는 항상 진행 중!\n7일 모두 러닝 인증하면 선물을 받을 수 있어요.", en: "📢 No upcoming events.\n\n🗓 Weekly perfect attendance challenge is always on!\nRun all 7 days to win a prize." },
  dailyPaceRanking: { ko: "하루 페이스 랭킹", en: "Daily Pace Ranking" },
  weeklyChallenge: { ko: "🗓 주간 개근 챌린지도 진행 중!", en: "🗓 Weekly attendance challenge is also on!" },
  upcomingEvents: { ko: "📢 예정된 이벤트", en: "📢 Upcoming Events" },

  helpText: {
    ko: `📖 러닝 챗봇 명령어 안내\n\n📸 스크린샷 업로드 → 러닝 인증 + 출석\n/내기록 → 개인 월간 통계\n/랭킹 → 이번 달 전체 랭킹\n/출석 → 이번 주 출석 현황\n/이벤트 → 진행 중인 이벤트 안내\n/명령어 → 이 메시지\n\n👑 관리자 전용\n/이벤트생성 [날짜] → 하루 랭킹 이벤트 생성\n/이벤트취소 → 예약 이벤트 취소\n/이벤트현황 → 당일 실시간 랭킹`,
    en: `📖 Running Bot Commands\n\n📸 Upload screenshot → Log run + attendance\n/mystats → Monthly personal stats\n/ranking → Weekly ranking\n/attendance → Weekly attendance\n/event → Upcoming events\n/help → This message\n\n👑 Admin only\n/createevent [date] → Create daily ranking event\n/cancelevent → Cancel upcoming event\n/eventstatus → Today's live ranking`,
  },

  adminOnly: { ko: "⚠️ 관리자만 이벤트를 생성할 수 있습니다.", en: "⚠️ Only admins can create events." },
  adminOnlyCancel: { ko: "⚠️ 관리자만 이벤트를 취소할 수 있습니다.", en: "⚠️ Only admins can cancel events." },
  dateFormat: { ko: "📅 날짜를 YYYY-MM-DD 형식으로 입력해주세요.\n예: /이벤트생성 2025-03-15", en: "📅 Please enter a date in YYYY-MM-DD format.\nExample: /createevent 2025-03-15" },
  eventCancelled: { ko: "✅ 가장 가까운 예약 이벤트가 취소되었습니다.", en: "✅ The nearest scheduled event has been cancelled." },
  noEventToCancel: { ko: "⚠️ 취소할 예약 이벤트가 없습니다.", en: "⚠️ No scheduled event to cancel." },
  noEventToday: { ko: "📊 오늘은 하루 랭킹 이벤트가 없습니다.", en: "📊 No daily ranking event today." },
  noParticipants: { ko: "📊 아직 참가자가 없습니다. 스크린샷을 업로드하여 참여하세요!", en: "📊 No participants yet. Upload a screenshot to join!" },
  confirmExpired: { ko: "⏰ 확인 시간이 만료되었습니다. 이미지를 다시 업로드해주세요.", en: "⏰ Confirmation expired. Please upload the image again." },
  correctionInput: {
    ko: { distance: "거리 (예: 5.2)", duration: "시간 (예: 28:14 또는 1:28:14)", pace: "페이스 (예: 5:30)", date: "날짜 (예: 2025-03-10)" },
    en: { distance: "distance (e.g. 5.2)", duration: "time (e.g. 28:14 or 1:28:14)", pace: "pace (e.g. 5:30)", date: "date (e.g. 2025-03-10)" },
  },
  correctionInputPrompt: { ko: (field: string) => `✏️ 올바른 ${field}을(를) 입력해주세요.`, en: (field: string) => `✏️ Please enter the correct ${field}.` },

  // 내기록 카드
  myStatsCardTitle: { ko: (weekLabel: string) => `${weekLabel} 기록`, en: (weekLabel: string) => `${weekLabel} Stats` },
  noStatsTitle: { ko: "이번 주 기록이\n아직 없어요.", en: "No records\nthis week yet." },
  noStatsDesc: { ko: "러닝 스크린샷을 업로드해보세요!", en: "Upload a running screenshot!" },
  noStatsAlt: { ko: "이번 주 기록이 없습니다", en: "No records this week" },
  myStatsAlt: { ko: (weekLabel: string) => `${weekLabel} 내 기록`, en: (weekLabel: string) => `My Stats — ${weekLabel}` },
  totalDistanceLabel: { ko: "총 거리", en: "Total Distance" },
  avgPaceLabel: { ko: "평균 페이스", en: "Avg Pace" },
  runCountLabel: { ko: "러닝 횟수", en: "Runs" },
  attendDaysLabel: { ko: "출석 일수", en: "Attendance" },

  // 명령어 카드
  helpCardTitle: { ko: "명령어 안내", en: "Commands" },
  helpAlt: { ko: "러닝 챗봇 명령어 안내", en: "Running Bot Commands" },

  // 이벤트 목록 카드
  noEventsTitle: { ko: "예정된 이벤트가\n없어요.", en: "No upcoming\nevents." },
  noEventsDesc: { ko: "주간 개근 챌린지는 항상 진행 중!", en: "Weekly attendance challenge is always on!" },
  noEventsAlt: { ko: "예정된 이벤트 없음", en: "No upcoming events" },
  eventsAlt: { ko: "예정된 이벤트", en: "Upcoming Events" },
} as const;

export function t(key: keyof typeof texts, lang: Lang): any {
  return texts[key][lang];
}
