import { FlexMessage, FlexBubble } from "@line/bot-sdk";
import { Lang, t } from "../i18n";

export function buildAttendanceCard(
  displayName: string,
  days: boolean[],
  totalDays: number,
  lang: Lang = "ko"
): FlexMessage {
  const dayLabels: string[] = t("dayLabels", lang);
  const remaining = 7 - totalDays;

  // 오늘이 이번 주 몇 번째 날인지 (0=월 ~ 6=일)
  const now = new Date();
  const todayDow = now.getDay() === 0 ? 6 : now.getDay() - 1;

  const dayCircles = days.map((checked, i) => {
    const isPast = i < todayDow;
    const missed = !checked && isPast;

    return {
      type: "box" as const,
      layout: "vertical" as const,
      width: "28px",
      alignItems: "center" as const,
      spacing: "4px" as any,
      contents: [
        {
          type: "box" as const,
          layout: "vertical" as const,
          width: "28px",
          height: "28px",
          cornerRadius: "14px",
          backgroundColor: checked ? "#A5FF05" : "#F0F0F0",
          justifyContent: "center" as const,
          alignItems: "center" as const,
          contents: checked
            ? [
                {
                  type: "text" as const,
                  text: "✓",
                  size: "12px" as any,
                  color: "#111111",
                  align: "center" as const,
                },
              ]
            : missed
            ? [
                {
                  type: "text" as const,
                  text: "✕",
                  size: "12px" as any,
                  color: "#999999",
                  align: "center" as const,
                },
              ]
            : ([] as any[]),
        },
        {
          type: "text" as const,
          text: dayLabels[i],
          size: "11px" as any,
          color: checked ? "#111111" : "#AAAAAA",
          align: "center" as const,
        },
      ],
    };
  });

  const titleText = remaining > 0
    ? (t("runningStreak", lang) as (name: string, days: number) => string)(displayName, totalDays)
    : (t("perfectAttendance", lang) as (name: string) => string)(displayName);

  const countText = (t("attendanceCount", lang) as (total: number) => string)(totalDays);
  const registerLabel = t("registerMyRecord", lang) as string;
  const checkRanking = t("checkMyRanking", lang) as string;
  const checkPrize = t("checkPrizes", lang) as string;
  const todayChecked = days[todayDow] === true;

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
          text: "Weekly Attendance",
          size: "14px" as any,
          weight: "bold",
          color: "#333333",
        },
        {
          type: "text",
          text: titleText,
          size: "20px" as any,
          weight: "bold",
          color: "#111111",
          margin: "4px" as any,
          wrap: true,
          lineSpacing: "2px" as any,
        },
        {
          type: "text",
          text: remaining > 0
            ? `${countText} · ${(t("daysRemaining", lang) as (n: number) => string)(remaining)}`
            : countText,
          size: "12px" as any,
          color: "#AAAAAA",
          margin: "8px" as any,
        },
        {
          type: "box",
          layout: "horizontal",
          margin: "16px" as any,
          justifyContent: "space-between" as any,
          contents: dayCircles as any,
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
      contents: todayChecked
        ? [
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
                type: "uri" as const,
                label: checkPrize,
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
                  text: checkPrize,
                  size: "15px" as any,
                  weight: "bold" as const,
                  color: "#000000",
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
            {
              type: "box" as const,
              layout: "vertical" as const,
              action: {
                type: "postback" as const,
                label: checkRanking,
                data: `action=command&cmd=ranking&lang=${lang}`,
              },
              backgroundColor: "#FFFFFF",
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
                  color: "#000000",
                  align: "center" as const,
                },
              ],
            },
            {
              type: "box" as const,
              layout: "vertical" as const,
              action: {
                type: "uri" as const,
                label: checkPrize,
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
                  text: checkPrize,
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
    altText: (t("attendanceAlt", lang) as (total: number) => string)(totalDays),
    contents: bubble,
  };
}
