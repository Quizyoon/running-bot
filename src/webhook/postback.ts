import { Client, PostbackEvent } from "@line/bot-sdk";
import { pendingRecords } from "./state";
import { saveSession } from "../services/running";
import { updateMemberStats, getWeeklyAttendance, getWeekStartDate } from "../services/attendance";
import { buildCorrectionPrompt } from "../flex/confirmCard";
import { getWeeklyRanking } from "../services/ranking";
import { buildRankingCard, buildEmptyRankingCard } from "../flex/rankingCard";
import { buildAttendanceCard } from "../flex/attendanceCard";
import { Lang, t } from "../i18n";
import { todayString, nowKST } from "../utils/date";

export async function handlePostback(
  client: Client,
  event: PostbackEvent
): Promise<void> {
  const params = new URLSearchParams(event.postback.data);
  const action = params.get("action");

  if (action === "command") {
    const lang = (params.get("lang") as Lang) || "ko";
    await handleCommand(client, event, params.get("cmd") || "", lang);
    return;
  }

  const confirmId = params.get("id");
  if (!confirmId) return;

  const record = pendingRecords.get(confirmId);
  if (!record) {
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: t("confirmExpired", "ko") as string,
    });
    return;
  }

  if (event.source.userId !== record.userId) return;

  switch (action) {
    case "confirm":
      await handleConfirm(client, event, confirmId, record);
      break;
    case "reject":
      await handleReject(client, event, confirmId, record);
      break;
    case "correct":
      await handleCorrectSelect(client, event, confirmId, params.get("field") || "", record);
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
  const lang = record.lang ?? "ko";

  const data = record.data;
  const runDate = data.runDate ?? todayString();

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

  await updateMemberStats(record.userId, record.groupId, record.displayName);

  const ranking = await getWeeklyRanking(record.groupId);

  if (ranking.length === 0) {
    await client.replyMessage(event.replyToken, buildEmptyRankingCard(record.displayName, lang));
    return;
  }

  await Promise.all(
    ranking.map(async (entry) => {
      try {
        const src = event.source as any;
        if (src.type === "group" && src.groupId) {
          const p = await client.getGroupMemberProfile(src.groupId, entry.userId);
          entry.profileUrl = p.pictureUrl;
        } else {
          const p = await client.getProfile(entry.userId);
          entry.profileUrl = p.pictureUrl;
        }
      } catch {}
    })
  );

  const rankingCard = buildRankingCard(ranking, record.userId, record.displayName, {
    headerTitle: "Today's Run Complete!",
    lang,
  });
  await client.replyMessage(event.replyToken, rankingCard);
}

async function handleReject(
  client: Client,
  event: PostbackEvent,
  confirmId: string,
  record: typeof pendingRecords extends Map<string, infer V> ? V : never
): Promise<void> {
  const lang = record.lang ?? "ko";
  const correctionPrompt = buildCorrectionPrompt(confirmId, lang);
  await client.replyMessage(event.replyToken, correctionPrompt);
}

async function handleCorrectSelect(
  client: Client,
  event: PostbackEvent,
  confirmId: string,
  field: string,
  record: typeof pendingRecords extends Map<string, infer V> ? V : never
): Promise<void> {
  const lang = record.lang ?? "ko";
  const fieldNames = t("correctionInput", lang) as Record<string, string>;

  record.correctionField = field as any;
  pendingRecords.set(confirmId, record);

  const prompt = (t("correctionInputPrompt", lang) as (field: string) => string)(fieldNames[field] || field);
  await client.replyMessage(event.replyToken, {
    type: "text",
    text: prompt,
  });
}

async function handleCommand(
  client: Client,
  event: PostbackEvent,
  cmd: string,
  lang: Lang = "ko"
): Promise<void> {
  const userId = event.source.userId;
  if (!userId) return;

  const source = event.source as any;
  const groupId = source.groupId || source.roomId || userId;

  switch (cmd) {
    case "ranking": {
      const ranking = await getWeeklyRanking(groupId);
      if (ranking.length === 0) {
        let name = "Unknown";
        try {
          const s = event.source as any;
          if (s.type === "group" && s.groupId) {
            const p = await client.getGroupMemberProfile(s.groupId, userId);
            name = p.displayName;
          } else {
            const p = await client.getProfile(userId);
            name = p.displayName;
          }
        } catch {}
        await client.replyMessage(event.replyToken, buildEmptyRankingCard(name, lang));
      } else {
        await Promise.all(
          ranking.map(async (entry) => {
            try {
              const src = event.source as any;
              if (src.type === "group" && src.groupId) {
                const p = await client.getGroupMemberProfile(src.groupId, entry.userId);
                entry.profileUrl = p.pictureUrl;
              } else {
                const p = await client.getProfile(entry.userId);
                entry.profileUrl = p.pictureUrl;
              }
            } catch {}
          })
        );

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
        const rankingCard = buildRankingCard(ranking, userId, displayName, { lang });
        await client.replyMessage(event.replyToken, rankingCard);
      }
      break;
    }
    case "attendance": {
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
      break;
    }
    default:
      break;
  }
}
