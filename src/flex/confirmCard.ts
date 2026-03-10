import { FlexMessage, FlexBubble } from "@line/bot-sdk";
import { OcrResult } from "../ocr/claude";

export function buildConfirmCard(
  confirmId: string,
  displayName: string,
  data: OcrResult,
  warnings: string[]
): FlexMessage {
  const warningTexts =
    warnings.length > 0
      ? warnings.map((w) => ({
          type: "text" as const,
          text: `⚠️ ${w}`,
          size: "xs" as const,
          color: "#FF6B6B",
          wrap: true,
        }))
      : [];

  const bubble: FlexBubble = {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#27ACB2",
      paddingAll: "15px",
      contents: [
        {
          type: "text",
          text: "📊 기록을 확인해주세요!",
          weight: "bold",
          size: "md",
          color: "#FFFFFF",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "15px",
      contents: [
        {
          type: "text",
          text: `🏃 러너: ${displayName}`,
          size: "sm",
          weight: "bold",
        },
        { type: "separator", margin: "sm" },
        buildInfoRow("📏 거리", data.distanceKm ? `${data.distanceKm} km` : "-"),
        buildInfoRow("⏱ 시간", data.durationDisplay ?? "-"),
        buildInfoRow("🏃 페이스", data.paceDisplay ? `${data.paceDisplay}/km` : "-"),
        buildInfoRow("📅 날짜", data.runDate ?? "-"),
        ...(data.sourceApp
          ? [buildInfoRow("📱 앱", data.sourceApp)]
          : []),
        ...warningTexts,
      ],
    },
    footer: {
      type: "box",
      layout: "horizontal",
      spacing: "sm",
      paddingAll: "15px",
      contents: [
        {
          type: "button",
          action: {
            type: "postback",
            label: "✅ 맞아요",
            data: `action=confirm&id=${confirmId}`,
          },
          style: "primary",
          color: "#4CAF50",
          height: "sm",
        },
        {
          type: "button",
          action: {
            type: "postback",
            label: "❌ 틀려요",
            data: `action=reject&id=${confirmId}`,
          },
          style: "secondary",
          height: "sm",
        },
      ],
    },
  };

  return {
    type: "flex",
    altText: `러닝 기록 확인: ${data.distanceKm ?? 0}km`,
    contents: bubble,
  };
}

function buildInfoRow(label: string, value: string) {
  return {
    type: "box" as const,
    layout: "horizontal" as const,
    margin: "sm" as const,
    contents: [
      { type: "text" as const, text: label, size: "sm" as const, flex: 3, color: "#666666" },
      { type: "text" as const, text: value, size: "sm" as const, flex: 4, weight: "bold" as const },
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
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: "어떤 항목이 잘못됐나요?",
          weight: "bold",
          size: "md",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          action: {
            type: "postback",
            label: "1️⃣ 거리",
            data: `action=correct&id=${confirmId}&field=distance`,
          },
          style: "secondary",
          height: "sm",
        },
        {
          type: "button",
          action: {
            type: "postback",
            label: "2️⃣ 시간",
            data: `action=correct&id=${confirmId}&field=duration`,
          },
          style: "secondary",
          height: "sm",
        },
        {
          type: "button",
          action: {
            type: "postback",
            label: "3️⃣ 페이스",
            data: `action=correct&id=${confirmId}&field=pace`,
          },
          style: "secondary",
          height: "sm",
        },
        {
          type: "button",
          action: {
            type: "postback",
            label: "4️⃣ 날짜",
            data: `action=correct&id=${confirmId}&field=date`,
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
