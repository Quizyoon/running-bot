import { FlexMessage, FlexBubble } from "@line/bot-sdk";
import { formatPace, formatDuration } from "../services/ranking";

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
          text: `${displayName}${badgeStr}`,
          size: "26px" as any,
          weight: "bold",
          color: "#111111",
          margin: "4px" as any,
          maxLines: 1,
        },
        {
          type: "text",
          text: "기록 등록 완료!",
          size: "20px" as any,
          weight: "bold",
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
      paddingBottom: "10px",
      contents: [
        {
          type: "box" as const,
          layout: "vertical" as const,
          action: {
            type: "postback" as const,
            label: "내 랭킹 확인하기",
            data: "action=command&cmd=ranking",
          },
          backgroundColor: "#F5F5F5",
          cornerRadius: "8px",
          paddingAll: "14px",
          justifyContent: "center" as const,
          alignItems: "center" as const,
          contents: [
            {
              type: "text" as const,
              text: "내 랭킹 확인하기",
              size: "15px" as any,
              weight: "bold" as const,
              color: "#000000",
              align: "center" as const,
            },
          ],
        },
        {
          type: "box" as const,
          layout: "vertical" as const,
          action: {
            type: "postback" as const,
            label: "출석 확인하기",
            data: "action=command&cmd=attendance",
          },
          backgroundColor: "#FFFFFF",
          cornerRadius: "8px",
          paddingAll: "14px",
          justifyContent: "center" as const,
          alignItems: "center" as const,
          contents: [
            {
              type: "text" as const,
              text: "출석 확인하기",
              size: "15px" as any,
              weight: "bold" as const,
              color: "#000000",
              align: "center" as const,
            },
          ],
        },
      ],
    },
  };

  return {
    type: "flex",
    altText: `${displayName} 러닝 기록 등록 완료: ${distanceKm}km`,
    contents: bubble,
  };
}
