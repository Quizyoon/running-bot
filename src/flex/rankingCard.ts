import { FlexMessage, FlexBubble } from "@line/bot-sdk";
import { RankingEntry } from "../services/ranking";

function getMedalEmoji(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `  ${rank}위`;
}

export function buildRankingCard(
  ranking: RankingEntry[],
  year: number,
  month: number
): FlexMessage {
  const rows = ranking.slice(0, 20).map((entry) => ({
    type: "box" as const,
    layout: "horizontal" as const,
    margin: "sm" as const,
    contents: [
      {
        type: "text" as const,
        text: `${getMedalEmoji(entry.rank)} ${entry.displayName} ${entry.badges.join("")}`,
        size: "sm" as const,
        flex: 5,
      },
      {
        type: "text" as const,
        text: `${entry.totalDistance}km`,
        size: "sm" as const,
        flex: 2,
        align: "end" as const,
      },
      {
        type: "text" as const,
        text: entry.paceDisplay,
        size: "sm" as const,
        flex: 2,
        align: "end" as const,
      },
    ],
  }));

  const lastDay = new Date(year, month, 0).getDate();

  const bubble: FlexBubble = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#1DB446",
      paddingAll: "15px",
      contents: [
        {
          type: "text",
          text: `🏆 이번 달 러닝 랭킹`,
          weight: "bold",
          size: "lg",
          color: "#FFFFFF",
        },
        {
          type: "text",
          text: `${year}년 ${month}월`,
          size: "sm",
          color: "#DDFFDD",
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
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text" as const, text: "이름", size: "xs" as const, color: "#999999", flex: 5 },
            { type: "text" as const, text: "거리", size: "xs" as const, color: "#999999", flex: 2, align: "end" as const },
            { type: "text" as const, text: "페이스", size: "xs" as const, color: "#999999", flex: 2, align: "end" as const },
          ],
        },
        { type: "separator", margin: "sm" },
        ...rows,
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `📅 마감: ${month}월 ${lastDay}일  |  /랭킹 으로 확인`,
          size: "xs",
          color: "#999999",
          align: "center",
        },
      ],
    },
  };

  return {
    type: "flex",
    altText: `🏆 ${year}년 ${month}월 러닝 랭킹`,
    contents: bubble,
  };
}
