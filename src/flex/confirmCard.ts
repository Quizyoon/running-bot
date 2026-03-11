import { FlexMessage, FlexBubble } from "@line/bot-sdk";
import { OcrResult } from "../ocr/claude";

function formatTimestamp(): string {
  const now = new Date();
  return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

export function buildConfirmCard(
  confirmId: string,
  displayName: string,
  data: OcrResult,
  warnings: string[]
): FlexMessage {
  const timestamp = formatTimestamp();

  const warningTexts =
    warnings.length > 0
      ? warnings.map((w) => ({
          type: "text" as const,
          text: w,
          size: "xs" as const,
          color: "#FF0000",
          wrap: true,
          margin: "sm" as const,
        }))
      : [];

  const bubble: FlexBubble = {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      paddingBottom: "10px",
      backgroundColor: "#FFFFFF",
      contents: [
        {
          type: "text",
          text: "Today's Run",
          size: "sm",
          weight: "bold",
          color: "#333333",
        },
        {
          type: "text",
          text: displayName,
          size: "xxl",
          weight: "bold",
          color: "#111111",
          margin: "sm",
        },
        {
          type: "text",
          text: timestamp,
          size: "xs",
          color: "#AAAAAA",
          margin: "sm",
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "xs",
          margin: "lg",
          contents: [
            buildInfoRow("거리", data.distanceKm ? `${data.distanceKm}km` : "-"),
            buildInfoRow("시간", data.durationDisplay ?? "-"),
            buildInfoRow("페이스", data.paceDisplay ? `${data.paceDisplay}/km` : "-"),
            ...warningTexts,
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "16px",
      paddingTop: "0px",
      contents: [
        {
          type: "button",
          action: {
            type: "postback",
            label: "등록하기",
            data: `action=confirm&id=${confirmId}`,
          },
          style: "secondary",
          height: "sm",
        },
        {
          type: "button",
          action: {
            type: "postback",
            label: "수정하기",
            data: `action=reject&id=${confirmId}`,
          },
          style: "link",
          color: "#000000",
          height: "sm",
        },
      ],
    },
  };

  return {
    type: "flex",
    altText: `${displayName}님의 러닝 기록: ${data.distanceKm ?? 0}km`,
    contents: bubble,
  };
}

/** 중복 등록 시 카드 */
export function buildDuplicateCard(displayName: string): FlexMessage {
  const bubble: FlexBubble = {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "20px",
      backgroundColor: "#FFFFFF",
      contents: [
        {
          type: "text",
          text: `오늘 ${displayName}님의\n기록은 등록되어 있어요.`,
          size: "lg",
          weight: "bold",
          color: "#111111",
          wrap: true,
        },
        {
          type: "text",
          text: "동일 날짜에는 1건만 인정됩니다.",
          size: "xs",
          color: "#999999",
          margin: "sm",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "16px",
      paddingTop: "0px",
      contents: [
        {
          type: "button",
          action: {
            type: "postback",
            label: "내 랭킹 확인하기",
            data: "action=command&cmd=ranking",
          },
          style: "secondary",
          height: "sm",
        },
        {
          type: "button",
          action: {
            type: "postback",
            label: "출석체크 하기",
            data: "action=command&cmd=attendance",
          },
          style: "link",
          color: "#000000",
          height: "sm",
        },
      ],
    },
  };

  return {
    type: "flex",
    altText: `오늘 ${displayName}님의 기록은 이미 등록되어 있습니다.`,
    contents: bubble,
  };
}

/** 날짜 오류 시 카드 */
export function buildDateErrorCard(
  displayName: string,
  data: OcrResult,
  runDateTimestamp: string
): FlexMessage {
  const bubble: FlexBubble = {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      paddingBottom: "10px",
      backgroundColor: "#FFFFFF",
      contents: [
        {
          type: "text",
          text: "Today's Run",
          size: "sm",
          weight: "bold",
          color: "#333333",
        },
        {
          type: "text",
          text: displayName,
          size: "xxl",
          weight: "bold",
          color: "#111111",
          margin: "sm",
        },
        {
          type: "text",
          text: `오늘의 기록만 등록할 수 있어요.\n${runDateTimestamp}`,
          size: "xs",
          color: "#FF0000",
          wrap: true,
          margin: "sm",
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "xs",
          margin: "lg",
          contents: [
            buildInfoRow("거리", data.distanceKm ? `${data.distanceKm}km` : "-"),
            buildInfoRow("시간", data.durationDisplay ?? "-"),
            buildInfoRow("페이스", data.paceDisplay ? `${data.paceDisplay}/km` : "-"),
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      paddingTop: "0px",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "다시 등록하기",
            uri: "https://line.me/R/nv/cameraRoll/single",
          },
          style: "secondary",
          height: "sm",
        },
      ],
    },
  };

  return {
    type: "flex",
    altText: "오늘의 기록만 등록할 수 있어요.",
    contents: bubble,
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
        size: "sm" as const,
        flex: 2,
        color: "#999999",
      },
      {
        type: "text" as const,
        text: value,
        size: "sm" as const,
        flex: 5,
        color: "#111111",
      },
    ],
  };
}

export function buildCorrectionPrompt(confirmId: string): FlexMessage {
  const bubble: FlexBubble = {
    type: "bubble",
    size: "kilo",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      paddingAll: "20px",
      contents: [
        {
          type: "text",
          text: "어떤 항목을 수정할까요?",
          weight: "bold",
          size: "md",
          color: "#333333",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "16px",
      contents: [
        {
          type: "button",
          action: {
            type: "postback",
            label: "거리",
            data: `action=correct&id=${confirmId}&field=distance`,
          },
          style: "secondary",
          height: "sm",
        },
        {
          type: "button",
          action: {
            type: "postback",
            label: "시간",
            data: `action=correct&id=${confirmId}&field=duration`,
          },
          style: "secondary",
          height: "sm",
        },
        {
          type: "button",
          action: {
            type: "postback",
            label: "페이스",
            data: `action=correct&id=${confirmId}&field=pace`,
          },
          style: "secondary",
          height: "sm",
        },
      ],
    },
  };

  return {
    type: "flex",
    altText: "수정할 항목을 선택해주세요",
    contents: bubble,
  };
}
