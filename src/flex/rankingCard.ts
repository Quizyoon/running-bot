import { FlexMessage, FlexBubble } from "@line/bot-sdk";
import { RankingEntry, getWeekRange } from "../services/ranking";
import { Lang, t } from "../i18n";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function nameWithParticle(name: string, particle: string, lang: Lang): any {
  if (lang === "ko") {
    return {
      type: "box" as const,
      layout: "horizontal" as const,
      margin: "4px" as any,
      contents: [
        {
          type: "text" as const,
          text: name,
          size: "20px" as any,
          weight: "bold" as const,
          color: "#111111",
          maxLines: 1,
          flex: 0,
          wrap: false,
        },
        {
          type: "text" as const,
          text: particle,
          size: "20px" as any,
          weight: "bold" as const,
          color: "#111111",
          flex: 0,
        },
      ],
    };
  }
  return {
    type: "text" as const,
    text: `${name},`,
    size: "20px" as any,
    weight: "bold" as const,
    color: "#111111",
    margin: "4px" as any,
    maxLines: 1,
  };
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
    paddingAll: "8px" as any,
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
            maxLines: 1,
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

export function buildEmptyRankingCard(displayName?: string, lang: Lang = "ko"): FlexMessage {
  const { week, year } = getWeekRange();
  const registerLabel = t("registerMyRecord", lang) as string;
  const prizeLabel = t("checkPrizes", lang) as string;

  const RANKING_HERO_URL = "https://raw.githubusercontent.com/Quizyoon/running-bot/main/img/ranking-hero.jpg";

  const bubble: FlexBubble = {
    type: "bubble",
    size: "kilo",
    hero: {
      type: "image",
      url: RANKING_HERO_URL,
      size: "full",
      aspectRatio: "4:3",
      aspectMode: "cover",
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      paddingBottom: "16px",
      backgroundColor: "#FFFFFF",
      contents: [
        {
          type: "text",
          text: "Weekly Ranking",
          size: "14px" as any,
          weight: "bold",
          color: "#333333",
        },
        ...(displayName
          ? [
              nameWithParticle(displayName, "님,", lang),
              {
                type: "text" as const,
                text: t("emptyRankingTitle", lang) as string,
                size: "20px" as any,
                weight: "bold" as const,
                color: "#111111",
              },
            ]
          : [
              {
                type: "text" as const,
                text: t("noRecordsYet", lang) as string,
                size: "20px" as any,
                weight: "bold" as const,
                color: "#111111",
                margin: "4px" as any,
              },
            ]),
        {
          type: "text",
          text: `${ordinal(week)} week ${year}`,
          size: "12px" as any,
          color: "#AAAAAA",
          margin: "8px" as any,
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      paddingTop: "0px",
      paddingBottom: "10px",
      spacing: "8px" as any,
      contents: [
        {
          type: "box" as const,
          layout: "vertical" as const,
          action: {
            type: "uri" as const,
            label: registerLabel,
            uri: "https://line.me/R/nv/cameraRoll/single",
          },
          backgroundColor: "#111111",
          cornerRadius: "8px",
          paddingAll: "14px",
          justifyContent: "center" as const,
          alignItems: "center" as const,
          contents: [
            {
              type: "text" as const,
              text: registerLabel,
              size: "15px" as any,
              weight: "bold" as const,
              color: "#FFFFFF",
              align: "center" as const,
            },
          ],
        },
        {
          type: "box" as const,
          layout: "vertical" as const,
          action: {
            type: "uri" as const,
            label: prizeLabel,
            uri: "https://giftshop-tw.line.me/voucher/322460139",
          },
          backgroundColor: "#FFFFFF",
          cornerRadius: "8px",
          paddingAll: "14px",
          justifyContent: "center" as const,
          alignItems: "center" as const,
          contents: [
            {
              type: "text" as const,
              text: prizeLabel,
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
    altText: t("emptyRankingAlt", lang) as string,
    contents: bubble,
  };
}

export function buildRankingCard(
  ranking: RankingEntry[],
  userId?: string,
  displayName?: string,
  options?: { headerTitle?: string; lang?: Lang }
): FlexMessage {
  const lang = options?.lang ?? "ko";
  const { week, year } = getWeekRange();
  const top5 = ranking.slice(0, 3);

  const rows: any[] = [];
  top5.forEach((entry) => {
    rows.push(buildRankRow(entry));
  });

  const userInTop3 = userId ? top5.some((e) => e.userId === userId) : true;
  const userEntry = userId ? ranking.find((e) => e.userId === userId) : undefined;

  if (!userInTop3 && userEntry) {
    rows.push(buildRankRow(userEntry));
  }

  const hasFooter = !!userId;
  const attendLabel = t("checkAttendance", lang) as string;
  const registerLabel = t("registerMyRecord", lang) as string;
  const prizeLabel = t("checkPrizes", lang) as string;

  const RANKING_HERO_URL = "https://raw.githubusercontent.com/Quizyoon/running-bot/main/img/ranking-hero.jpg";

  const bubble: FlexBubble = {
    type: "bubble",
    size: "kilo",
    hero: {
      type: "image",
      url: RANKING_HERO_URL,
      size: "full",
      aspectRatio: "4:3",
      aspectMode: "cover",
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      paddingBottom: "16px",
      backgroundColor: "#FFFFFF",
      contents: [
        {
          type: "text",
          text: options?.headerTitle ?? "Weekly Ranking",
          size: "14px" as any,
          weight: "bold",
          color: "#333333",
        },
        ...(userEntry && displayName
          ? [
              nameWithParticle(displayName, "이", lang),
              {
                type: "text" as const,
                text: (t("rankTitle", lang) as (rank: number) => string)(userEntry.rank),
                size: "20px" as any,
                weight: "bold" as const,
                color: "#111111",
              },
            ]
          : !userEntry && displayName
          ? [
              nameWithParticle(displayName, "님,", lang),
              {
                type: "text" as const,
                text: t("registerPrompt", lang) as string,
                size: "20px" as any,
                weight: "bold" as const,
                color: "#111111",
              },
            ]
          : []),
        {
          type: "text",
          text: `${ordinal(week)} week ${year}`,
          size: "12px" as any,
          color: "#AAAAAA",
          margin: "8px" as any,
        },
        {
          type: "box",
          layout: "vertical",
          margin: "8px" as any,
          contents: rows,
        },
      ],
    },
    ...(hasFooter
      ? {
          footer: {
            type: "box" as const,
            layout: "vertical" as const,
            spacing: "8px" as any,
            paddingAll: "16px",
            paddingTop: "0px",
            paddingBottom: "10px",
            contents: [
              ...(userEntry
                ? [
                    {
                      type: "box" as const,
                      layout: "vertical" as const,
                      action: {
                        type: "postback" as const,
                        label: attendLabel,
                        data: `action=command&cmd=attendance&lang=${lang}`,
                      },
                      backgroundColor: "#111111",
                      cornerRadius: "8px",
                      paddingAll: "14px",
                      justifyContent: "center" as const,
                      alignItems: "center" as const,
                      contents: [
                        {
                          type: "text" as const,
                          text: attendLabel,
                          size: "15px" as any,
                          weight: "bold" as const,
                          color: "#FFFFFF",
                          align: "center" as const,
                        },
                      ],
                    },
                  ]
                : [
                    {
                      type: "box" as const,
                      layout: "vertical" as const,
                      action: {
                        type: "uri" as const,
                        label: registerLabel,
                        uri: "https://line.me/R/nv/cameraRoll/single",
                      },
                      backgroundColor: "#111111",
                      cornerRadius: "8px",
                      paddingAll: "14px",
                      justifyContent: "center" as const,
                      alignItems: "center" as const,
                      contents: [
                        {
                          type: "text" as const,
                          text: registerLabel,
                          size: "15px" as any,
                          weight: "bold" as const,
                          color: "#FFFFFF",
                          align: "center" as const,
                      },
                    ],
                  },
                ]),
              {
                type: "box" as const,
                layout: "vertical" as const,
                action: {
                  type: "uri" as const,
                  label: prizeLabel,
                  uri: "https://giftshop-tw.line.me/voucher/322460139",
                },
                backgroundColor: "#FFFFFF",
                cornerRadius: "8px",
                paddingAll: "14px",
                justifyContent: "center" as const,
                alignItems: "center" as const,
                contents: [
                  {
                    type: "text" as const,
                    text: prizeLabel,
                    size: "15px" as any,
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
