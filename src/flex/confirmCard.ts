import { FlexMessage, FlexBubble } from "@line/bot-sdk";
import { OcrResult } from "../ocr/claude";
import { DuplicateRecord } from "../services/running";
import { formatPace } from "../services/ranking";
import { Lang, t } from "../i18n";

function formatTimestamp(): string {
  const now = new Date();
  return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

export function buildConfirmCard(
  confirmId: string,
  displayName: string,
  data: OcrResult,
  warnings: string[],
  lang: Lang = "ko"
): FlexMessage {
  const timestamp = formatTimestamp();
  const distLabel = t("distance", lang) as string;
  const timeLabel = t("duration", lang) as string;
  const paceLabel = t("pace", lang) as string;
  const registerBtn = t("register", lang) as string;
  const editBtn = t("edit", lang) as string;

  const warningTexts =
    warnings.length > 0
      ? warnings.map((w) => ({
          type: "text" as const,
          text: w,
          size: "13px" as any,
          color: "#FF0000",
          wrap: true,
          margin: "8px" as any,
        }))
      : [];

  const CONFIRM_HERO_URL = "https://raw.githubusercontent.com/Quizyoon/running-bot/main/img/confirm-hero.jpg";

  const bubble: FlexBubble = {
    type: "bubble",
    size: "kilo",
    hero: {
      type: "image",
      url: CONFIRM_HERO_URL,
      size: "full",
      aspectRatio: "4:3",
      aspectMode: "cover",
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      backgroundColor: "#FFFFFF",
      contents: [
        {
          type: "text",
          text: "Today's Running Log",
          size: "14px" as any,
          weight: "bold",
          color: "#333333",
        },
        {
          type: "text",
          text: displayName,
          size: "26px" as any,
          weight: "bold",
          color: "#111111",
          margin: "4px" as any,
        },
        {
          type: "text",
          text: timestamp,
          size: "13px" as any,
          color: "#AAAAAA",
          margin: "8px" as any,
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "6px" as any,
          margin: "12px" as any,
          contents: [
            buildInfoRow(distLabel, data.distanceKm ? `${data.distanceKm}km` : "-"),
            buildInfoRow(timeLabel, data.durationDisplay ?? "-"),
            buildInfoRow(paceLabel, data.paceDisplay ? `${data.paceDisplay}/km` : "-"),
            ...warningTexts,
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "8px" as any,
      paddingAll: "16px",
      paddingTop: "0px",
      paddingBottom: "10px",
      contents: [
        buildBoxButton(registerBtn, {
          type: "postback",
          label: registerBtn,
          data: `action=confirm&id=${confirmId}`,
        }, "15px", "#111111"),
        buildBoxButton(editBtn, {
          type: "postback",
          label: editBtn,
          data: `action=reject&id=${confirmId}`,
        }, "15px", undefined),
      ],
    },
  };

  return {
    type: "flex",
    altText: (t("confirmAlt", lang) as (name: string, km: number) => string)(displayName, data.distanceKm ?? 0),
    contents: bubble,
  };
}

/** 중복 등록 시 카드 */
export function buildDuplicateCard(displayName: string, lang: Lang = "ko", record?: DuplicateRecord): FlexMessage {
  const rankingBtn = t("checkMyRanking", lang) as string;
  const attendBtn = t("checkAttendance", lang) as string;
  const distLabel = t("distance", lang) as string;
  const timeLabel = t("duration", lang) as string;
  const paceLabel = t("pace", lang) as string;

  const fmtDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
  };

  const recordRows: any[] = record
    ? [
        {
          type: "box" as const,
          layout: "vertical" as const,
          spacing: "6px" as any,
          margin: "12px" as any,
          contents: [
            buildInfoRow(distLabel, `${record.distanceKm}km`),
            buildInfoRow(timeLabel, fmtDuration(record.durationSec)),
            buildInfoRow(paceLabel, `${formatPace(record.paceMinPerKm)}/km`),
          ],
        },
      ]
    : [];

  const bubble: FlexBubble = {
    type: "bubble",
    size: "kilo",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      paddingBottom: "16px",
      backgroundColor: "#FFFFFF",
      contents: [
        {
          type: "text",
          text: "Today's Running Log",
          size: "14px" as any,
          weight: "bold",
          color: "#333333",
        },
        {
          type: "text",
          text: t("duplicateTitle", lang) as string,
          size: "20px" as any,
          weight: "bold",
          color: "#111111",
          wrap: true,
          lineSpacing: "2px" as any,
          margin: "4px" as any,
        },
        {
          type: "text",
          text: t("duplicateDesc", lang) as string,
          size: "13px" as any,
          color: "#FF0000",
          margin: "8px" as any,
        },
        ...recordRows,
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "8px" as any,
      paddingAll: "16px",
      paddingTop: "0px",
      paddingBottom: "10px",
      contents: [
        buildBoxButton(rankingBtn, {
          type: "postback",
          label: rankingBtn,
          data: "action=command&cmd=ranking",
        }, "15px", "#111111"),
        buildBoxButton(attendBtn, {
          type: "postback",
          label: attendBtn,
          data: "action=command&cmd=attendance",
        }, "15px", undefined),
      ],
    },
  };

  return {
    type: "flex",
    altText: t("duplicateAlt", lang) as string,
    contents: bubble,
  };
}

/** 날짜 오류 시 카드 */
export function buildDateErrorCard(
  displayName: string,
  data: OcrResult,
  runDateTimestamp: string,
  lang: Lang = "ko"
): FlexMessage {
  const distLabel = t("distance", lang) as string;
  const timeLabel = t("duration", lang) as string;
  const paceLabel = t("pace", lang) as string;
  const retryBtn = t("registerAgain", lang) as string;

  const DATEERROR_HERO_URL = "https://raw.githubusercontent.com/Quizyoon/running-bot/main/img/dateerror-hero.png";

  const bubble: FlexBubble = {
    type: "bubble",
    size: "kilo",
    hero: {
      type: "image",
      url: DATEERROR_HERO_URL,
      size: "full",
      aspectRatio: "4:3",
      aspectMode: "cover",
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      paddingBottom: "10px",
      backgroundColor: "#FFFFFF",
      contents: [
        {
          type: "text",
          text: "Today's Running Log",
          size: "14px" as any,
          weight: "bold",
          color: "#333333",
        },
        {
          type: "text",
          text: displayName,
          size: "26px" as any,
          weight: "bold",
          color: "#111111",
          margin: "4px" as any,
        },
        {
          type: "text",
          text: (t("dateErrorDesc", lang) as (ts: string) => string)(runDateTimestamp),
          size: "13px" as any,
          color: "#FF0000",
          wrap: true,
          margin: "8px" as any,
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "6px" as any,
          margin: "12px" as any,
          contents: [
            buildInfoRow(distLabel, data.distanceKm ? `${data.distanceKm}km` : "-"),
            buildInfoRow(timeLabel, data.durationDisplay ?? "-"),
            buildInfoRow(paceLabel, data.paceDisplay ? `${data.paceDisplay}/km` : "-"),
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      paddingTop: "0px",
      paddingBottom: "10px",
      contents: [
        buildBoxButton(retryBtn, {
          type: "uri",
          label: retryBtn,
          uri: "https://line.me/R/nv/cameraRoll/single",
        }, "15px", "#111111"),
      ],
    },
  };

  return {
    type: "flex",
    altText: t("dateErrorAlt", lang) as string,
    contents: bubble,
  };
}

/** box + text로 만든 커스텀 버튼 (폰트 사이즈 지정 가능) */
function buildBoxButton(
  text: string,
  action: any,
  fontSize: string,
  bgColor: string | undefined
) {
  return {
    type: "box" as const,
    layout: "vertical" as const,
    action,
    backgroundColor: bgColor || "#FFFFFF",
    cornerRadius: "8px",
    paddingAll: "14px",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    contents: [
      {
        type: "text" as const,
        text,
        size: fontSize as any,
        weight: "bold" as const,
        color: bgColor === "#111111" ? "#FFFFFF" : "#000000",
        align: "center" as const,
      },
    ],
  };
}

function buildInfoRow(label: string, value: string) {
  return {
    type: "box" as const,
    layout: "horizontal" as const,
    contents: [
      {
        type: "text" as const,
        text: label,
        size: "14px" as any,
        flex: 2,
        color: "#999999",
      },
      {
        type: "text" as const,
        text: value,
        size: "14px" as any,
        flex: 5,
        color: "#111111",
      },
    ],
  };
}

export function buildCorrectionPrompt(confirmId: string, lang: Lang = "ko"): FlexMessage {
  const titleText = t("correctionTitle", lang) as string;
  const promptText = t("correctionPrompt", lang) as string;
  const distLabel = t("distance", lang) as string;
  const timeLabel = t("duration", lang) as string;
  const paceLabel = t("pace", lang) as string;

  const bubble: FlexBubble = {
    type: "bubble",
    size: "kilo",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      paddingBottom: "16px",
      backgroundColor: "#FFFFFF",
      contents: [
        {
          type: "text",
          text: titleText,
          weight: "bold",
          size: "14px" as any,
          color: "#333333",
        },
        {
          type: "text",
          text: promptText,
          weight: "bold",
          size: "20px" as any,
          color: "#111111",
          margin: "4px" as any,
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "8px" as any,
      paddingAll: "16px",
      paddingTop: "0px",
      paddingBottom: "16px",
      contents: [
        buildBoxButton(distLabel, {
          type: "postback",
          label: distLabel,
          data: `action=correct&id=${confirmId}&field=distance`,
        }, "15px", "#F5F5F5"),
        buildBoxButton(timeLabel, {
          type: "postback",
          label: timeLabel,
          data: `action=correct&id=${confirmId}&field=duration`,
        }, "15px", "#F5F5F5"),
        buildBoxButton(paceLabel, {
          type: "postback",
          label: paceLabel,
          data: `action=correct&id=${confirmId}&field=pace`,
        }, "15px", "#F5F5F5"),
      ],
    },
  };

  return {
    type: "flex",
    altText: t("correctionAlt", lang) as string,
    contents: bubble,
  };
}
