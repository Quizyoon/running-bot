import { Client, MessageEvent, TextEventMessage } from "@line/bot-sdk";
import { getWeeklyRanking, getMonthlyRanking, getDailyPaceRanking, formatPace } from "../services/ranking";
import { getWeeklyPersonalStats } from "../services/running";
import {
  getWeeklyAttendance,
  getWeekStartDate,
} from "../services/attendance";
import {
  cancelEvent,
  getUpcomingEvents,
  getActiveEvent,
} from "../services/event";
import { buildRankingCard, buildEmptyRankingCard } from "../flex/rankingCard";
import { buildAttendanceCard } from "../flex/attendanceCard";
import { buildEventAnnouncementCard, buildEventResultCard, buildEventListCard, buildNoEventsCard, buildEventCreateCard } from "../flex/eventCard";
import { buildStatsCard, buildEmptyStatsCard } from "../flex/statsCard";
import { buildHelpCard } from "../flex/helpCard";
import { pendingRecords } from "./state";
import { buildConfirmCard } from "../flex/confirmCard";
import { validateRunData } from "../services/running";
import { Lang, t } from "../i18n";
import { todayString, nowKST } from "../utils/date";

// 관리자 목록 (환경변수에서 설정 가능)
const ADMIN_IDS = new Set((process.env.ADMIN_USER_IDS || "").split(",").filter(Boolean));

function isAdmin(userId: string): boolean {
  return ADMIN_IDS.has(userId);
}

export async function handleTextMessage(
  client: Client,
  event: MessageEvent
): Promise<void> {
  const message = event.message as TextEventMessage;
  const text = message.text.trim();
  const source = event.source;
  const userId = source.userId;
  const groupId = getGroupId(source);
  console.log(`[MSG] userId=${userId} groupId=${groupId} text="${text}" sourceType=${source.type}`);
  if (!userId) return;
  if (!groupId) return;

  // 수정 모드 입력 처리
  const correctionHandled = await handleCorrectionInput(client, event, userId, text);
  if (correctionHandled) return;

  // 명령어 처리 (영어 명령어 → en, 한국어 → ko)
  switch (true) {
    case text === "/랭킹":
      await handleRanking(client, event, userId, groupId, "ko");
      break;
    case text === "/ranking":
      await handleRanking(client, event, userId, groupId, "en");
      break;
    case text === "/내기록":
      await handleMyStats(client, event, userId, groupId, "ko");
      break;
    case text === "/mystats":
      await handleMyStats(client, event, userId, groupId, "en");
      break;
    case text === "/출석":
      await handleAttendance(client, event, userId, groupId, "ko");
      break;
    case text === "/attendance":
      await handleAttendance(client, event, userId, groupId, "en");
      break;
    case text === "/이벤트":
      await handleEventInfo(client, event, groupId, "ko");
      break;
    case text === "/event":
      await handleEventInfo(client, event, groupId, "en");
      break;
    case text === "/명령어":
      await handleHelp(client, event, groupId, "ko");
      break;
    case text === "/help":
      await handleHelp(client, event, groupId, "en");
      break;
    case text === "/이벤트만들기":
      await handleEventCreate(client, event, groupId, "ko");
      break;
    case text === "/createevent":
      await handleEventCreate(client, event, groupId, "en");
      break;
    case text === "/이벤트취소":
      await handleCancelEvent(client, event, userId, groupId, "ko");
      break;
    case text === "/cancelevent":
      await handleCancelEvent(client, event, userId, groupId, "en");
      break;
    case text === "/이벤트현황":
      await handleEventStatus(client, event, groupId, "ko");
      break;
    case text === "/eventstatus":
      await handleEventStatus(client, event, groupId, "en");
      break;
    default:
      break;
  }
}

async function handleCorrectionInput(
  client: Client,
  event: MessageEvent,
  userId: string,
  text: string
): Promise<boolean> {
  // 수정 대기 중인 레코드 찾기
  for (const [confirmId, record] of pendingRecords.entries()) {
    if (record.userId === userId && record.correctionField) {
      const field = record.correctionField;
      record.correctionField = undefined;

      switch (field) {
        case "distance":
          record.data.distanceKm = parseFloat(text);
          break;
        case "duration": {
          const parts = text.split(":").map(Number);
          if (parts.length === 3) {
            record.data.durationSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
            record.data.durationDisplay = text;
          } else if (parts.length === 2) {
            record.data.durationSec = parts[0] * 60 + parts[1];
            record.data.durationDisplay = text;
          }
          break;
        }
        case "pace": {
          const paceParts = text.split(":").map(Number);
          if (paceParts.length === 2) {
            record.data.paceMinPerKm = paceParts[0] + paceParts[1] / 60;
            record.data.paceDisplay = `${paceParts[0]}'${paceParts[1].toString().padStart(2, "0")}"`;
          }
          break;
        }
        case "date":
          record.data.runDate = text;
          break;
      }

      pendingRecords.set(confirmId, record);

      // 수정된 데이터로 다시 확인 메시지
      const validation = validateRunData(record.data);
      const confirmMessage = buildConfirmCard(
        confirmId,
        record.displayName,
        record.data,
        validation.warnings
      );
      await client.replyMessage(event.replyToken, confirmMessage);
      return true;
    }
  }
  return false;
}

async function handleRanking(
  client: Client,
  event: MessageEvent,
  userId: string,
  groupId: string,
  lang: Lang
): Promise<void> {
  const ranking = await getWeeklyRanking(groupId);

  if (ranking.length === 0) {
    let name = "Unknown";
    try {
      const src = event.source as any;
      if (src.type === "group" && src.groupId) {
        const p = await client.getGroupMemberProfile(src.groupId, userId);
        name = p.displayName;
      } else {
        const p = await client.getProfile(userId);
        name = p.displayName;
      }
    } catch {}
    await client.replyMessage(event.replyToken, buildEmptyRankingCard(name, lang));
    return;
  }

  await fillProfileUrls(client, event.source, ranking);

  let displayName = "Unknown";
  try {
    const source = event.source as any;
    if (source.type === "group" && source.groupId) {
      const p = await client.getGroupMemberProfile(source.groupId, userId);
      displayName = p.displayName;
    } else {
      const p = await client.getProfile(userId);
      displayName = p.displayName;
    }
  } catch {}

  const rankingCard = buildRankingCard(ranking, userId, displayName, { lang });
  await client.replyMessage(event.replyToken, rankingCard);
}

async function fillProfileUrls(
  client: Client,
  source: any,
  entries: { userId: string; profileUrl?: string }[]
): Promise<void> {
  await Promise.all(
    entries.map(async (entry) => {
      try {
        if (source.type === "group" && source.groupId) {
          const p = await client.getGroupMemberProfile(source.groupId, entry.userId);
          entry.profileUrl = p.pictureUrl;
        } else {
          const p = await client.getProfile(entry.userId);
          entry.profileUrl = p.pictureUrl;
        }
      } catch {
        // 프로필 못 가져오면 기본 아바타
      }
    })
  );
}

async function handleMyStats(
  client: Client,
  event: MessageEvent,
  userId: string,
  groupId: string,
  lang: Lang
): Promise<void> {
  const now = nowKST();
  const weekStart = getWeekStartDate(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const startM = weekStart.getMonth() + 1;
  const startD = weekStart.getDate();
  const endM = weekEnd.getMonth() + 1;
  const endD = weekEnd.getDate();
  const weekLabel = lang === "ko"
    ? `${startM}/${startD}~${endM}/${endD}`
    : `${startM}/${startD}–${endM}/${endD}`;

  let displayName = "Unknown";
  try {
    const src = event.source as any;
    if (src.type === "group" && src.groupId) {
      const p = await client.getGroupMemberProfile(src.groupId, userId);
      displayName = p.displayName;
    } else {
      const p = await client.getProfile(userId);
      displayName = p.displayName;
    }
  } catch {}

  const stats = await getWeeklyPersonalStats(userId, groupId, weekStart);

  if (!stats) {
    await client.replyMessage(event.replyToken, buildEmptyStatsCard(displayName, lang));
    return;
  }

  await client.replyMessage(event.replyToken, buildStatsCard(
    displayName,
    weekLabel,
    {
      totalDistance: stats.totalDistance,
      avgPace: formatPace(stats.avgPace),
      attendDays: stats.attendDays,
    },
    lang
  ));
}

async function handleAttendance(
  client: Client,
  event: MessageEvent,
  userId: string,
  groupId: string,
  lang: Lang
): Promise<void> {
  const weekStart = getWeekStartDate(nowKST());
  const attendance = await getWeeklyAttendance(userId, groupId, weekStart);

  let displayName = "Unknown";
  try {
    const src = event.source as any;
    if (src.type === "group" && src.groupId) {
      const p = await client.getGroupMemberProfile(src.groupId, userId);
      displayName = p.displayName;
    } else {
      const p = await client.getProfile(userId);
      displayName = p.displayName;
    }
  } catch {}

  const attendanceCard = buildAttendanceCard(
    displayName,
    attendance.days,
    attendance.totalDays,
    lang
  );
  await client.replyMessage(event.replyToken, attendanceCard);
}

async function handleEventInfo(
  client: Client,
  event: MessageEvent,
  groupId: string,
  lang: Lang
): Promise<void> {
  const upcoming = await getUpcomingEvents(groupId);

  if (upcoming.length === 0) {
    await client.replyMessage(event.replyToken, buildNoEventsCard(lang, groupId));
    return;
  }

  const now = nowKST();
  const events = upcoming.map((e) => {
    const eventTime = new Date(e.eventDate!).getTime();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const daysUntil = Math.ceil((eventTime - todayStart) / 86400000);
    return { eventDate: e.eventDate!, daysUntil, eventName: e.eventName, prizeInfo: e.prizeInfo, prizeImageUrl: e.prizeImageUrl, prizePrice: e.prizePrice, eventMethod: e.eventMethod };
  });

  await client.replyMessage(event.replyToken, buildEventListCard(events, lang));
}

async function handleHelp(
  client: Client,
  event: MessageEvent,
  groupId: string | null,
  lang: Lang
): Promise<void> {
  await client.replyMessage(event.replyToken, buildHelpCard(lang, groupId || undefined));
}

async function handleEventCreate(
  client: Client,
  event: MessageEvent,
  groupId: string | null,
  lang: Lang
): Promise<void> {
  await client.replyMessage(event.replyToken, buildEventCreateCard(lang, groupId || undefined));
}

async function handleCancelEvent(
  client: Client,
  event: MessageEvent,
  userId: string,
  groupId: string,
  lang: Lang
): Promise<void> {
  if (!isAdmin(userId)) {
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: t("adminOnlyCancel", lang) as string,
    });
    return;
  }

  const cancelled = await cancelEvent(groupId);
  await client.replyMessage(event.replyToken, {
    type: "text",
    text: cancelled
      ? t("eventCancelled", lang) as string
      : t("noEventToCancel", lang) as string,
  });
}

async function handleEventStatus(
  client: Client,
  event: MessageEvent,
  groupId: string,
  lang: Lang
): Promise<void> {
  const today = todayString();
  const activeEvent = await getActiveEvent(groupId, today);

  if (!activeEvent) {
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: t("noEventToday", lang) as string,
    });
    return;
  }

  const ranking = await getDailyPaceRanking(groupId, today);

  if (ranking.length === 0) {
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: t("noParticipants", lang) as string,
    });
    return;
  }

  const resultCard = buildEventResultCard(today, ranking, ranking.length);
  await client.replyMessage(event.replyToken, resultCard);
}

function getGroupId(source: any): string | null {
  if (source.type === "group") return source.groupId;
  if (source.type === "room") return source.roomId;
  return source.userId;
}
