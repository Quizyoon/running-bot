import { FlexMessage, FlexBubble } from "@line/bot-sdk";
import { Lang, t } from "../i18n";

interface StatsData {
  totalDistance: number;
  avgPace: string;
  runCount: number;
  attendDays: number;
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
        flex: 3,
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

export function buildStatsCard(
  displayName: string,
  year: number,
  month: number,
  stats: StatsData,
  lang: Lang = "ko"
): FlexMessage {
  const subtitle = (t("myStatsCardTitle", lang) as (y: number, m: number) => string)(year, month);
  const distLabel = t("totalDistanceLabel", lang) as string;
  const paceLabel = t("avgPaceLabel", lang) as string;
  const runsLabel = t("runCountLabel", lang) as string;
  const attendLabel = t("attendDaysLabel", lang) as string;
  const checkRanking = t("checkMyRanking", lang) as string;
  const checkAttend = t("checkAttendance", lang) as string;

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
          text: "My Running Stats",
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
          maxLines: 1,
        },
        {
          type: "text",
          text: subtitle,
          size: "12px" as any,
          color: "#AAAAAA",
          margin: "8px" as any,
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "6px" as any,
          margin: "12px" as any,
          contents: [
            buildInfoRow(distLabel, `${stats.totalDistance.toFixed(1)} km`),
            buildInfoRow(paceLabel, `${stats.avgPace}/km`),
            buildInfoRow(runsLabel, lang === "ko" ? `${stats.runCount}회` : `${stats.runCount}`),
            buildInfoRow(attendLabel, lang === "ko" ? `${stats.attendDays}일` : `${stats.attendDays} days`),
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
        {
          type: "box" as const,
          layout: "vertical" as const,
          action: {
            type: "postback" as const,
            label: checkRanking,
            data: `action=command&cmd=ranking&lang=${lang}`,
          },
          backgroundColor: "#111111",
          cornerRadius: "8px",
          paddingAll: "14px",
          justifyContent: "center" as const,
          alignItems: "center" as const,
          contents: [
            {
              type: "text" as const,
              text: checkRanking,
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
            type: "postback" as const,
            label: checkAttend,
            data: `action=command&cmd=attendance&lang=${lang}`,
          },
          backgroundColor: "#FFFFFF",
          cornerRadius: "8px",
          paddingAll: "14px",
          justifyContent: "center" as const,
          alignItems: "center" as const,
          contents: [
            {
              type: "text" as const,
              text: checkAttend,
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
    altText: (t("myStatsAlt", lang) as (y: number, m: number) => string)(year, month),
    contents: bubble,
  };
}

export function buildEmptyStatsCard(
  displayName: string,
  lang: Lang = "ko"
): FlexMessage {
  const registerLabel = t("registerMyRecord", lang) as string;

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
          text: "My Running Stats",
          size: "14px" as any,
          weight: "bold",
          color: "#333333",
        },
        {
          type: "text",
          text: (t("noStatsTitle", lang) as string),
          size: "20px" as any,
          weight: "bold",
          color: "#111111",
          margin: "4px" as any,
          wrap: true,
          lineSpacing: "2px" as any,
        },
        {
          type: "text",
          text: (t("noStatsDesc", lang) as string),
          size: "13px" as any,
          color: "#999999",
          margin: "8px" as any,
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      paddingTop: "0px",
      paddingBottom: "16px",
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
      ],
    },
  };

  return {
    type: "flex",
    altText: t("noStatsAlt", lang) as string,
    contents: bubble,
  };
}
