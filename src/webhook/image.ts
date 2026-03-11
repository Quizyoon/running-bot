import { Client, MessageEvent } from "@line/bot-sdk";
import { extractRunDataFromImage, OcrResult } from "../ocr/claude";
import { validateRunData, checkDuplicate } from "../services/running";
import { getActiveEvent } from "../services/event";
import { buildConfirmCard, buildDuplicateCard, buildDateErrorCard } from "../flex/confirmCard";
import { pendingRecords, PendingRecord } from "./state";

export async function handleImageMessage(
  client: Client,
  event: MessageEvent
): Promise<void> {
  const source = event.source;
  if (!source.userId) return;

  const groupId = getGroupId(source);
  if (!groupId) return;

  // LINE에서 이미지 다운로드
  const stream = await client.getMessageContent(event.message.id);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  const imageBuffer = Buffer.concat(chunks);

  // Claude Vision OCR
  const ocrResult = await extractRunDataFromImage(imageBuffer, "image/jpeg");

  // 러닝 데이터가 아닌 이미지는 무시
  if (!ocrResult.distanceKm) return;

  // 이상치 검증
  const validation = validateRunData(ocrResult);

  // 프로필 이름 (날짜 오류 카드에도 필요하므로 먼저 가져옴)
  const displayName = await getDisplayName(client, source);

  // 당일 기록만 인정
  const today = new Date().toISOString().split("T")[0];
  const runDate = ocrResult.runDate ?? today;
  if (runDate !== today) {
    const runDateTimestamp = ocrResult.runDate
      ? ocrResult.runDate.replace(/-/g, ".")
      : runDate.replace(/-/g, ".");
    const dateErrorCard = buildDateErrorCard(displayName, ocrResult, runDateTimestamp);
    await client.replyMessage(event.replyToken, dateErrorCard);
    return;
  }

  // 중복 체크
  const isDuplicate = await checkDuplicate(source.userId, groupId, runDate);
  if (isDuplicate) {
    const duplicateCard = buildDuplicateCard(displayName);
    await client.replyMessage(event.replyToken, duplicateCard);
    return;
  }

  // 하루 이벤트 참여 여부 확인
  const activeEvent = await getActiveEvent(groupId, runDate);

  // 확인 대기 저장
  const confirmId = `${source.userId}_${Date.now()}`;
  const pending: PendingRecord = {
    userId: source.userId,
    groupId,
    displayName,
    data: ocrResult,
    imageMessageId: event.message.id,
    eventId: activeEvent?.eventId,
  };
  pendingRecords.set(confirmId, pending);

  // 5분 후 자동 만료
  setTimeout(() => pendingRecords.delete(confirmId), 5 * 60 * 1000);

  // 확인 메시지 전송 (DM 권장이지만, 그룹에서도 작동)
  const confirmMessage = buildConfirmCard(
    confirmId,
    displayName,
    ocrResult,
    validation.warnings
  );

  await client.replyMessage(event.replyToken, confirmMessage);
}

function getGroupId(source: any): string | null {
  if (source.type === "group") return source.groupId;
  if (source.type === "room") return source.roomId;
  return source.userId;
}

async function getDisplayName(client: Client, source: any): Promise<string> {
  try {
    if (source.type === "group" && source.groupId) {
      const profile = await client.getGroupMemberProfile(source.groupId, source.userId);
      return profile.displayName;
    }
    const profile = await client.getProfile(source.userId);
    return profile.displayName;
  } catch {
    return "Unknown";
  }
}
