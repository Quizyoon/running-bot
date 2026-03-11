import { Client, PostbackEvent } from "@line/bot-sdk";
import { pendingRecords } from "./state";
import { saveSession } from "../services/running";
import { updateMemberStats, computeBadges, getWeeklyAttendance, getWeekStartDate } from "../services/attendance";
import { buildResultCard } from "../flex/resultCard";
import { buildCorrectionPrompt } from "../flex/confirmCard";
import { getMonthlyRanking } from "../services/ranking";
import { buildRankingCard } from "../flex/rankingCard";

export async function handlePostback(
  client: Client,
  event: PostbackEvent
): Promise<void> {
  const params = new URLSearchParams(event.postback.data);
  const action = params.get("action");

  // 카드 버튼에서 호출하는 커맨드 처리 (confirmId 불필요)
  if (action === "command") {
    await handleCommand(client, event, params.get("cmd") || "");
    return;
  }

  const confirmId = params.get("id");
  if (!confirmId) return;

  const record = pendingRecords.get(confirmId);
  if (!record) {
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "⏰ 확인 시간이 만료되었습니다. 이미지를 다시 업로드해주세요.",
    });
    return;
  }

  // 본인만 확인/취소 가능
  if (event.source.userId !== record.userId) return;

  switch (action) {
    case "confirm":
      await handleConfirm(client, event, confirmId, record);
      break;
    case "reject":
      await handleReject(client, event, confirmId);
      break;
    case "correct":
      await handleCorrectSelect(client, event, confirmId, params.get("field") || "");
      break;
    default:
      break;
  }
}

async function handleConfirm(
  client: Client,
  event: PostbackEvent,
  confirmId: string,
  record: typeof pendingRecords extends Map<string, infer V> ? V : never
): Promise<void> {
  pendingRecords.delete(confirmId);

  const data = record.data;
  const runDate = data.runDate ?? new Date().toISOString().split("T")[0];

  // DB 저장
  await saveSession({
    userId: record.userId,
    groupId: record.groupId,
    displayName: record.displayName,
    runDate,
    distanceKm: data.distanceKm!,
    durationSec: data.durationSec ?? 0,
    paceMinPerKm: data.paceMinPerKm ?? 0,
    sourceApp: undefined,
    eventId: record.eventId,
  });

  // 출석 + 배지 업데이트
  await updateMemberStats(record.userId, record.groupId, record.displayName);
  const badges = await computeBadges(record.userId, record.groupId);

  // 결과 카드 전송
  const resultMessage = buildResultCard(
    record.displayName,
    data.distanceKm!,
    data.durationSec ?? 0,
    data.paceMinPerKm ?? 0,
    runDate,
    badges
  );

  await client.replyMessage(event.replyToken, resultMessage);
}

async function handleReject(
  client: Client,
  event: PostbackEvent,
  confirmId: string
): Promise<void> {
  // 수정 항목 선택 프롬프트 전송
  const correctionPrompt = buildCorrectionPrompt(confirmId);
  await client.replyMessage(event.replyToken, correctionPrompt);
}

async function handleCorrectSelect(
  client: Client,
  event: PostbackEvent,
  confirmId: string,
  field: string
): Promise<void> {
  const record = pendingRecords.get(confirmId);
  if (!record) return;

  const fieldNames: Record<string, string> = {
    distance: "거리 (예: 5.2)",
    duration: "시간 (예: 28:14 또는 1:28:14)",
    pace: "페이스 (예: 5:30)",
    date: "날짜 (예: 2025-03-10)",
  };

  record.correctionField = field as any;
  pendingRecords.set(confirmId, record);

  await client.replyMessage(event.replyToken, {
    type: "text",
    text: `✏️ 올바른 ${fieldNames[field] || field}을(를) 입력해주세요.`,
  });
}

async function handleCommand(
  client: Client,
  event: PostbackEvent,
  cmd: string
): Promise<void> {
  const userId = event.source.userId;
  if (!userId) return;

  const source = event.source as any;
  const groupId = source.groupId || source.roomId || userId;

  switch (cmd) {
    case "ranking": {
      const now = new Date();
      const ranking = await getMonthlyRanking(groupId, now.getFullYear(), now.getMonth() + 1);
      if (ranking.length === 0) {
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: `📊 ${now.getFullYear()}년 ${now.getMonth() + 1}월 랭킹\n\n아직 기록이 없습니다.`,
        });
      } else {
        const rankingCard = buildRankingCard(ranking, now.getFullYear(), now.getMonth() + 1);
        await client.replyMessage(event.replyToken, rankingCard);
      }
      break;
    }
    case "attendance": {
      const weekStart = getWeekStartDate(new Date());
      const attendance = await getWeeklyAttendance(userId, groupId, weekStart);
      const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];
      const dayStr = attendance.days
        .map((d: boolean, i: number) => (d ? `✅${dayLabels[i]}` : `⬜${dayLabels[i]}`))
        .join(" ");
      const remaining = 7 - attendance.totalDays;
      await client.replyMessage(event.replyToken, {
        type: "text",
        text: `📋 이번 주 출석 현황\n\n${dayStr}\n\n출석: ${attendance.totalDays}/7일` +
          (remaining > 0 ? `\n개근까지 ${remaining}일 남았습니다! 💪` : `\n🎉 7일 개근 달성! 축하합니다!`),
      });
      break;
    }
    default:
      break;
  }
}
