import { FlexMessage, FlexBubble } from "@line/bot-sdk";
import { RankingEntry, getWeekRange } from "../services/ranking";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function buildRankRow(entry: RankingEntry): any {
  const profileImage = {
    type: "box" as const,
    layout: "vertical" as const,
    width: "40px",
    height: "40px",
    cornerRadius: "20px",
    flex: 0,
    contents: entry.profileUrl
      ? [
          {
            type: "image" as const,
            url: entry.profileUrl,
            size: "full" as const,
            aspectRatio: "1:1",
            aspectMode: "cover" as const,
          },
        ]
      : ([] as any[]),
    backgroundColor: entry.profileUrl ? undefined : "#CCCCCC",
  };

  return {
    type: "box" as const,
    layout: "horizontal" as const,
    alignItems: "center" as const,
    spacing: "4px" as any,
    paddingAll: "10px" as any,
    paddingStart: "4px" as any,
    contents: [
      {
        type: "box" as const,
        layout: "vertical" as const,
        width: "20px",
        flex: 0,
        contents: [
          {
            type: "text" as const,
            text: String(entry.rank),
            size: "14px" as any,
            weight: "bold" as const,
            color: "#111111",
            align: "start" as const,
          },
        ],
      },
      profileImage,
      {
        type: "box" as const,
        layout: "vertical" as const,
        flex: 1,
        paddingStart: "12px",
        contents: [
          {
            type: "text" as const,
            text: entry.displayName,
            size: "14px" as any,
            weight: "bold" as const,
            color: "#111111",
            wrap: true,
          },
          {
            type: "text" as const,
            text: `${entry.totalDistance}km, ${entry.paceDisplay}/km`,
            size: "12px" as any,
            color: "#999999",
            margin: "2px" as any,
          },
        ],
      },
    ],
  };
}

export function buildRankingCard(
  ranking: RankingEntry[],
  userId?: string
): FlexMessage {
  const { week, year } = getWeekRange();
  const top5 = ranking.slice(0, 5);

  const rows: any[] = [];
  top5.forEach((entry, i) => {
    if (i > 0) {
      rows.push({ type: "separator" as const, color: "#F0F0F0" });
    }
    rows.push(buildRankRow(entry));
  });

  // 본인이 5위 밖인 경우 추가 표시
  const userInTop5 = userId ? top5.some((e) => e.userId === userId) : true;
  const userEntry = userId ? ranking.find((e) => e.userId === userId) : undefined;

  if (!userInTop5 && userEntry) {
    rows.push({ type: "separator" as const, color: "#F0F0F0" });
    rows.push(buildRankRow(userEntry));
  }

  // 등록 전이면 버튼 추가
  const hasFooter = userId && !userEntry;

  const bubble: FlexBubble = {
    type: "bubble",
    size: "kilo",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "20px",
      paddingBottom: "6px",
      backgroundColor: "#FFFFFF",
      contents: [
        {
          type: "text",
          text: "Weekly Ranking",
          size: "14px" as any,
          weight: "bold",
          color: "#333333",
        },
        {
          type: "text",
          text: `${ordinal(week)} week ${year}`,
          size: "12px" as any,
          color: "#AAAAAA",
          margin: "4px" as any,
        },
        {
          type: "box",
          layout: "vertical",
          margin: "6px" as any,
          contents: rows,
        },
      ],
    },
    ...(hasFooter
      ? {
          footer: {
            type: "box" as const,
            layout: "vertical" as const,
            paddingAll: "16px",
            paddingTop: "0px",
            contents: [
              {
                type: "box" as const,
                layout: "vertical" as const,
                action: {
                  type: "uri" as const,
                  label: "내 기록 등록하기",
                  uri: "https://line.me/R/nv/cameraRoll/single",
                },
                backgroundColor: "#F5F5F5",
                cornerRadius: "8px",
                paddingAll: "14px",
                justifyContent: "center" as const,
                alignItems: "center" as const,
                contents: [
                  {
                    type: "text" as const,
                    text: "내 기록 등록하기",
                    size: "14px" as any,
                    weight: "bold" as const,
                    color: "#000000",
                    align: "center" as const,
                  },
                ],
              },
            ],
          },
        }
      : {}),
  };

  return {
    type: "flex",
    altText: `🏆 Weekly Ranking - ${ordinal(week)} week ${year}`,
    contents: bubble,
  };
}
