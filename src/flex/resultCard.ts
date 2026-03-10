import { FlexMessage, FlexBubble } from "@line/bot-sdk";
import { formatPace, formatDuration } from "../services/ranking";

export function buildResultCard(
  displayName: string,
  distanceKm: number,
  durationSec: number,
  paceMinPerKm: number,
  runDate: string,
  badges: string[]
): FlexMessage {
  const badgeStr = badges.length > 0 ? ` ${badges.join("")}` : "";

  const bubble: FlexBubble = {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#4CAF50",
      paddingAll: "15px",
      contents: [
        {
          type: "text",
          text: "✅ 러닝 기록 저장 완료!",
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
          text: `🏃 ${displayName}${badgeStr}`,
          weight: "bold",
          size: "md",
        },
        { type: "separator", margin: "sm" },
        buildRow("📏 거리", `${distanceKm} km`),
        buildRow("⏱ 시간", formatDuration(durationSec)),
        buildRow("🏃 페이스", `${formatPace(paceMinPerKm)}/km`),
        buildRow("📅 날짜", runDate),
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "출석 체크 완료! /랭킹 으로 순위를 확인하세요",
          size: "xs",
          color: "#999999",
          align: "center",
        },
      ],
    },
  };

  return {
    type: "flex",
    altText: `✅ ${displayName} 러닝 기록: ${distanceKm}km`,
    contents: bubble,
  };
}

function buildRow(label: string, value: string) {
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
