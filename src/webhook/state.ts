import { OcrResult } from "../ocr/claude";
import { Lang } from "../i18n";

export interface PendingRecord {
  userId: string;
  groupId: string;
  displayName: string;
  data: OcrResult;
  imageMessageId: string;
  eventId?: string;
  lang?: Lang;
  // 수정 모드용
  correctionField?: "distance" | "duration" | "pace" | "date";
}

// 확인 대기 중인 레코드 (메모리 기반 — 프로덕션에서는 Redis 권장)
export const pendingRecords = new Map<string, PendingRecord>();
