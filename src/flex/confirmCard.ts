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
          size: "13px" as any,
          color: "#FF0000",
          wrap: true,
          margin: "8px" as any,
        }))
      : [];

  const bubble: FlexBubble = {
    type: "bubble",
    size: "kilo",
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
          margin: "16px" as any,
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
      spacing: "8px" as any,
      paddingAll: "16px",
      paddingTop: "0px",
      paddingBottom: "10px",
      contents: [
        buildBoxButton("등록하기", {
          type: "postback",
          label: "등록하기",
          data: `action=confirm&id=${confirmId}`,
        }, "15px", "#F5F5F5"),
        buildBoxButton("수정하기", {
          type: "postback",
          label: "수정하기",
          data: `action=reject&id=${confirmId}`,
        }, "15px", undefined),
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
    size: "kilo",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "20px",
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
          text: `오늘 기록은\n이미 등록되어 있어요.`,
          size: "20px" as any,
          weight: "bold",
          color: "#111111",
          wrap: true,
          lineSpacing: "2px" as any,
          margin: "4px" as any,
        },
        {
          type: "text",
          text: "동일 날짜에는 1건만 인정됩니다.",
          size: "13px" as any,
          color: "#FF0000",
          margin: "8px" as any,
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
        buildBoxButton("내 랭킹 확인하기", {
          type: "postback",
          label: "내 랭킹 확인하기",
          data: "action=command&cmd=ranking",
        }, "15px", "#F5F5F5"),
        buildBoxButton("출석 확인하기", {
          type: "postback",
          label: "출석 확인하기",
          data: "action=command&cmd=attendance",
        }, "15px", undefined),
      ],
    },
  };

  return {
    type: "flex",
    altText: "오늘 기록은 이미 등록되어 있어요.",
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
    size: "kilo",
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
          text: `오늘의 기록만 등록할 수 있어요.\n${runDateTimestamp}`,
          size: "13px" as any,
          color: "#FF0000",
          wrap: true,
          margin: "8px" as any,
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "6px" as any,
          margin: "16px" as any,
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
      paddingBottom: "10px",
      contents: [
        buildBoxButton("다시 등록하기", {
          type: "uri",
          label: "다시 등록하기",
          uri: "https://line.me/R/nv/cameraRoll/single",
        }, "15px", "#F5F5F5"),
      ],
    },
  };

  return {
    type: "flex",
    altText: "오늘의 기록만 등록할 수 있어요.",
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
        color: "#000000",
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

export function buildCorrectionPrompt(confirmId: string): FlexMessage {
  const bubble: FlexBubble = {
    type: "bubble",
    size: "kilo",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "20px",
      paddingBottom: "16px",
      backgroundColor: "#FFFFFF",
      contents: [
        {
          type: "text",
          text: "기록 수정",
          weight: "bold",
          size: "14px" as any,
          color: "#333333",
        },
        {
          type: "text",
          text: "어떤 항목을 수정할까요?",
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
        buildBoxButton("거리", {
          type: "postback",
          label: "거리",
          data: `action=correct&id=${confirmId}&field=distance`,
        }, "15px", "#F5F5F5"),
        buildBoxButton("시간", {
          type: "postback",
          label: "시간",
          data: `action=correct&id=${confirmId}&field=duration`,
        }, "15px", "#F5F5F5"),
        buildBoxButton("페이스", {
          type: "postback",
          label: "페이스",
          data: `action=correct&id=${confirmId}&field=pace`,
        }, "15px", "#F5F5F5"),
      ],
    },
  };

  return {
    type: "flex",
    altText: "수정할 항목을 선택해주세요",
    contents: bubble,
  };
}
