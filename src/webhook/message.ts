import { Client, MessageEvent, TextEventMessage } from "@line/bot-sdk";
import { getWeeklyRanking, getMonthlyRanking, getDailyPaceRanking, formatPace } from "../services/ranking";
import { getPersonalStats } from "../services/running";
import {
  getWeeklyAttendance,
  getWeekStartDate,
} from "../services/attendance";
import {
  createDailyRaceEvent,
  cancelEvent,
  getUpcomingEvents,
  getActiveEvent,
} from "../services/event";
import { buildRankingCard, buildEmptyRankingCard } from "../flex/rankingCard";
import { buildAttendanceCard } from "../flex/attendanceCard";
import { buildEventAnnouncementCard, buildEventResultCard } from "../flex/eventCard";
import { pendingRecords } from "./state";
import { buildConfirmCard } from "../flex/confirmCard";
import { validateRunData } from "../services/running";

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
  if (!userId) return;

  const groupId = getGroupId(source);
  if (!groupId) return;

  // 수정 모드 입력 처리
  const correctionHandled = await handleCorrectionInput(client, event, userId, text);
  if (correctionHandled) return;

  // 명령어 처리
  switch (true) {
    case text === "/랭킹" || text === "/ranking":
      await handleRanking(client, event, userId, groupId);
      break;
    case text === "/내기록" || text === "/mystats":
      await handleMyStats(client, event, userId, groupId);
      break;
    case text === "/출석" || text === "/attendance":
      await handleAttendance(client, event, userId, groupId);
      break;
    case text === "/이벤트" || text === "/event":
      await handleEventInfo(client, event, groupId);
      break;
    case text === "/도움말" || text === "/help":
      await handleHelp(client, event);
      break;
    case text.startsWith("/이벤트생성") || text.startsWith("/createevent"):
      await handleCreateEvent(client, event, userId, groupId, text);
      break;
    case text === "/이벤트취소" || text === "/cancelevent":
      await handleCancelEvent(client, event, userId, groupId);
      break;
    case text === "/이벤트현황" || text === "/eventstatus":
      await handleEventStatus(client, event, groupId);
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
  groupId: string
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
    await client.replyMessage(event.replyToken, buildEmptyRankingCard(name));
    return;
  }

  // 프로필 이미지 가져오기
  await fillProfileUrls(client, event.source, ranking);

  // 유저 이름 가져오기
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

  const rankingCard = buildRankingCard(ranking, userId, displayName);
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
  groupId: string
): Promise<void> {
  const now = new Date();
  const stats = await getPersonalStats(userId, groupId, now.getFullYear(), now.getMonth() + 1);

  if (!stats) {
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "📊 이번 달 기록이 없습니다. 러닝 스크린샷을 업로드해보세요!",
    });
    return;
  }

  await client.replyMessage(event.replyToken, {
    type: "text",
    text: `📊 ${now.getFullYear()}년 ${now.getMonth() + 1}월 내 기록\n\n` +
      `📏 총 거리: ${stats.totalDistance.toFixed(1)} km\n` +
      `🏃 평균 페이스: ${formatPace(stats.avgPace)}/km\n` +
      `🔢 러닝 횟수: ${stats.runCount}회\n` +
      `📅 출석 일수: ${stats.attendDays}일`,
  });
}

async function handleAttendance(
  client: Client,
  event: MessageEvent,
  userId: string,
  groupId: string
): Promise<void> {
  const weekStart = getWeekStartDate(new Date());
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
    attendance.totalDays
  );
  await client.replyMessage(event.replyToken, attendanceCard);
}

async function handleEventInfo(
  client: Client,
  event: MessageEvent,
  groupId: string
): Promise<void> {
  const upcoming = await getUpcomingEvents(groupId);

  if (upcoming.length === 0) {
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "📢 현재 예정된 이벤트가 없습니다.\n\n🗓 매주 진행되는 주간 개근 챌린지는 항상 진행 중!\n7일 모두 러닝 인증하면 선물을 받을 수 있어요.",
    });
    return;
  }

  const eventList = upcoming
    .map((e) => {
      const daysUntil = Math.ceil(
        (new Date(e.eventDate!).getTime() - Date.now()) / 86400000
      );
      return `⚡ ${e.eventDate} (D-${daysUntil}) - 하루 페이스 랭킹`;
    })
    .join("\n");

  await client.replyMessage(event.replyToken, {
    type: "text",
    text: `📢 예정된 이벤트\n\n${eventList}\n\n🗓 주간 개근 챌린지도 진행 중!`,
  });
}

async function handleHelp(
  client: Client,
  event: MessageEvent
): Promise<void> {
  await client.replyMessage(event.replyToken, {
    type: "text",
    text:
      `📖 러닝 챗봇 명령어 안내\n\n` +
      `📸 스크린샷 업로드 → 러닝 인증 + 출석\n` +
      `/내기록 → 개인 월간 통계\n` +
      `/랭킹 → 이번 달 전체 랭킹\n` +
      `/출석 → 이번 주 출석 현황\n` +
      `/이벤트 → 진행 중인 이벤트 안내\n` +
      `/도움말 → 이 메시지\n\n` +
      `👑 관리자 전용\n` +
      `/이벤트생성 [날짜] → 하루 랭킹 이벤트 생성\n` +
      `/이벤트취소 → 예약 이벤트 취소\n` +
      `/이벤트현황 → 당일 실시간 랭킹`,
  });
}

async function handleCreateEvent(
  client: Client,
  event: MessageEvent,
  userId: string,
  groupId: string,
  text: string
): Promise<void> {
  if (!isAdmin(userId)) {
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "⚠️ 관리자만 이벤트를 생성할 수 있습니다.",
    });
    return;
  }

  const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  if (!dateMatch) {
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "📅 날짜를 YYYY-MM-DD 형식으로 입력해주세요.\n예: /이벤트생성 2025-03-15",
    });
    return;
  }

  const eventDate = dateMatch[0];
  try {
    await createDailyRaceEvent(groupId, eventDate, userId);

    const daysUntil = Math.ceil(
      (new Date(eventDate).getTime() - Date.now()) / 86400000
    );
    const announcement = buildEventAnnouncementCard(eventDate, daysUntil);
    await client.replyMessage(event.replyToken, announcement);
  } catch (err: any) {
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: `⚠️ ${err.message}`,
    });
  }
}

async function handleCancelEvent(
  client: Client,
  event: MessageEvent,
  userId: string,
  groupId: string
): Promise<void> {
  if (!isAdmin(userId)) {
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "⚠️ 관리자만 이벤트를 취소할 수 있습니다.",
    });
    return;
  }

  const cancelled = await cancelEvent(groupId);
  await client.replyMessage(event.replyToken, {
    type: "text",
    text: cancelled
      ? "✅ 가장 가까운 예약 이벤트가 취소되었습니다."
      : "⚠️ 취소할 예약 이벤트가 없습니다.",
  });
}

async function handleEventStatus(
  client: Client,
  event: MessageEvent,
  groupId: string
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const activeEvent = await getActiveEvent(groupId, today);

  if (!activeEvent) {
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "📊 오늘은 하루 랭킹 이벤트가 없습니다.",
    });
    return;
  }

  const ranking = await getDailyPaceRanking(groupId, today);

  if (ranking.length === 0) {
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "📊 아직 참가자가 없습니다. 스크린샷을 업로드하여 참여하세요!",
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
