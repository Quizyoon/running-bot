import { FlexMessage, FlexBubble } from "@line/bot-sdk";
import { RankingEntry } from "../services/ranking";
import { Lang, t } from "../i18n";

export function buildEventAnnouncementCard(
  eventDate: string,
  daysUntil: number,
  options?: { eventName?: string; prizeInfo?: string }
): FlexMessage {
  let emoji: string;
  let title: string;

  if (daysUntil === 3) {
    emoji = "🔔";
    title = `이번 주 ${formatDateKr(eventDate)}은 스피드 데이 이벤트!`;
  } else if (daysUntil === 1) {
    emoji = "⚡";
    title = "내일이 이벤트 당일! 컨디션 관리 잘 하세요";
  } else if (daysUntil === 0) {
    emoji = "🏁";
    title = "오늘이 하루 랭킹 이벤트 당일! 스크린샷 잊지 마세요";
  } else {
    emoji = "📢";
    title = `${formatDateKr(eventDate)} 하루 랭킹 이벤트 예정!`;
  }

  const bubble: FlexBubble = {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#FF6B35",
      paddingAll: "15px",
      contents: [
        {
          type: "text",
          text: `${emoji} 하루 페이스 랭킹 이벤트`,
          weight: "bold",
          size: "md",
          color: "#FFFFFF",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      paddingAll: "15px",
      contents: [
        { type: "text", text: title, size: "sm", wrap: true, weight: "bold" },
        {
          type: "text",
          text: `📅 날짜: ${eventDate}`,
          size: "sm",
          color: "#666666",
        },
        {
          type: "text",
          text: "🏆 당일 가장 빠른 페이스 1위가 우승!",
          size: "sm",
          color: "#666666",
        },
        ...(options?.prizeInfo
          ? [
              {
                type: "text" as const,
                text: `🎁 상품: ${options.prizeInfo}`,
                size: "sm" as const,
                color: "#666666",
              },
            ]
          : []),
        {
          type: "text",
          text: "📱 러닝 앱 스크린샷으로 자동 참여",
          size: "xs",
          color: "#999999",
        },
      ],
    },
  };

  return {
    type: "flex",
    altText: `${emoji} ${options?.eventName || title}`,
    contents: bubble,
  };
}

export function buildEventResultCard(
  eventDate: string,
  ranking: RankingEntry[],
  participantCount: number
): FlexMessage {
  const rows = ranking.slice(0, 10).map((entry) => {
    const medal =
      entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `${entry.rank}.`;
    return {
      type: "box" as const,
      layout: "horizontal" as const,
      margin: "sm" as const,
      contents: [
        {
          type: "text" as const,
          text: `${medal} ${entry.displayName}`,
          size: "sm" as const,
          flex: 4,
          maxLines: 1,
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
          text: `${entry.paceDisplay}/km`,
          size: "sm" as const,
          flex: 3,
          align: "end" as const,
        },
      ],
    };
  });

  const winner = ranking.length > 0 ? ranking[0] : null;

  const bubble: FlexBubble = {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#FFD700",
      paddingAll: "15px",
      contents: [
        {
          type: "text",
          text: "🏆 하루 랭킹 이벤트 결과",
          weight: "bold",
          size: "lg",
        },
        {
          type: "text",
          text: `${eventDate} | 참가자 ${participantCount}명`,
          size: "sm",
          color: "#666666",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "15px",
      contents: [
        ...(winner
          ? [
              {
                type: "text" as const,
                text: `🎉 우승: ${winner.displayName} (${winner.paceDisplay}/km)`,
                weight: "bold" as const,
                size: "md" as const,
                color: "#1DB446",
              },
              { type: "separator" as const, margin: "md" as const },
            ]
          : []),
        ...rows,
      ],
    },
  };

  return {
    type: "flex",
    altText: `🏆 ${eventDate} 하루 랭킹 결과${winner ? ` - 우승: ${winner.displayName}` : ""}`,
    contents: bubble,
  };
}

export function buildWeeklyAttendanceCard(
  weekLabel: string,
  members: { displayName: string; days: boolean[]; totalDays: number }[]
): FlexMessage {
  const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];

  const lines = members.map((m) => {
    const dayStr = m.days
      .map((d, i) => (d ? `✅${dayLabels[i]}` : `⬜${dayLabels[i]}`))
      .join(" ");
    const fire = m.totalDays === 7 ? " 🔥" : "";
    return `${m.displayName}   ${dayStr}   ${m.totalDays}/7${fire}`;
  });

  const text = `📅 이번 주 개근 현황 (${weekLabel})\n${"─".repeat(20)}\n${lines.join("\n")}\n${"─".repeat(20)}\n🏆 오늘도 달리면 개근에 한 발 더 가까워져요!`;

  return {
    type: "flex",
    altText: `📅 이번 주 개근 현황`,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text,
            size: "sm",
            wrap: true,
          },
        ],
      },
    },
  };
}

export function buildWeeklyWinnersCard(
  winners: { displayName: string }[]
): FlexMessage {
  if (winners.length === 0) {
    return {
      type: "flex",
      altText: "주간 개근 결과",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "📅 이번 주 7일 개근 달성자가 없습니다.\n다음 주에 도전해보세요! 💪",
              wrap: true,
              size: "sm",
            },
          ],
        },
      },
    };
  }

  const names = winners.map((w) => `🎉 ${w.displayName}`).join("\n");
  return {
    type: "flex",
    altText: `🎉 주간 개근 달성!`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#FF6B35",
        paddingAll: "15px",
        contents: [
          {
            type: "text",
            text: "🏆 주간 개근 챌린지 달성!",
            weight: "bold",
            size: "md",
            color: "#FFFFFF",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "15px",
        contents: [
          {
            type: "text",
            text: `7일 개근 달성을 축하합니다!\n\n${names}\n\n🎁 선물이 DM으로 발송될 예정입니다.`,
            wrap: true,
            size: "sm",
          },
        ],
      },
    },
  };
}

export function buildEventCreateCard(lang: Lang = "ko"): FlexMessage {
  const liffId = process.env.LIFF_ID || "";
  const liffUrl = `https://liff.line.me/${liffId}`;

  const title = lang === "ko" ? "새 이벤트 만들기" : "Create New Event";
  const desc = lang === "ko"
    ? "하루 페이스 랭킹 이벤트를 만들어보세요!\n당일 가장 빠른 페이스 1위가 우승합니다."
    : "Create a daily pace ranking event!\nThe fastest pace on the day wins.";
  const btnLabel = lang === "ko" ? "이벤트 만들기" : "Create Event";

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
          text: "Events",
          size: "14px" as any,
          weight: "bold",
          color: "#333333",
        },
        {
          type: "text",
          text: title,
          size: "20px" as any,
          weight: "bold",
          color: "#111111",
          margin: "4px" as any,
        },
        {
          type: "text",
          text: desc,
          size: "13px" as any,
          color: "#999999",
          margin: "8px" as any,
          wrap: true,
          lineSpacing: "2px" as any,
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
            type: "uri" as const,
            label: btnLabel,
            uri: liffUrl,
          },
          backgroundColor: "#111111",
          cornerRadius: "8px",
          paddingAll: "14px",
          justifyContent: "center" as const,
          alignItems: "center" as const,
          contents: [
            {
              type: "text" as const,
              text: btnLabel,
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
    altText: lang === "ko" ? "이벤트 만들기" : "Create Event",
    contents: bubble,
  };
}

function formatDateKr(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
}

export function buildEventListCard(
  events: { eventDate: string; daysUntil: number; eventName?: string | null; prizeInfo?: string | null }[],
  lang: Lang = "ko"
): FlexMessage {
  const registerLabel = t("registerMyRecord", lang) as string;
  const paceLabel = t("dailyPaceRanking", lang) as string;

  const rows: any[] = [];
  events.forEach((e) => {
    rows.push({
      type: "box" as const,
      layout: "horizontal" as const,
      contents: [
        {
          type: "text" as const,
          text: `⚡ ${e.eventName || e.eventDate}`,
          size: "14px" as any,
          flex: 4,
          color: "#111111",
          maxLines: 1,
        },
        {
          type: "text" as const,
          text: e.daysUntil === 0 ? "TODAY" : `D-${e.daysUntil}`,
          size: "14px" as any,
          flex: 1,
          color: e.daysUntil === 0 ? "#FF6B35" : "#999999",
          align: "end" as const,
        },
      ],
    });
    if (e.eventName) {
      rows.push({
        type: "text" as const,
        text: `📅 ${e.eventDate}${e.prizeInfo ? ` · 🎁 ${e.prizeInfo}` : ""}`,
        size: "12px" as any,
        color: "#AAAAAA",
        margin: "2px" as any,
      });
    }
  });

  const challengeText = t("weeklyChallenge", lang) as string;

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
          text: "Events",
          size: "14px" as any,
          weight: "bold",
          color: "#333333",
        },
        {
          type: "text",
          text: lang === "ko" ? "예정된 이벤트" : "Upcoming Events",
          size: "20px" as any,
          weight: "bold",
          color: "#111111",
          margin: "4px" as any,
        },
        {
          type: "text",
          text: paceLabel,
          size: "12px" as any,
          color: "#AAAAAA",
          margin: "8px" as any,
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "8px" as any,
          margin: "12px" as any,
          contents: rows,
        },
        {
          type: "text",
          text: challengeText,
          size: "13px" as any,
          color: "#999999",
          margin: "12px" as any,
          wrap: true,
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
    altText: t("eventsAlt", lang) as string,
    contents: bubble,
  };
}

export function buildNoEventsCard(lang: Lang = "ko"): FlexMessage {
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
          text: "Events",
          size: "14px" as any,
          weight: "bold",
          color: "#333333",
        },
        {
          type: "text",
          text: t("noEventsTitle", lang) as string,
          size: "20px" as any,
          weight: "bold",
          color: "#111111",
          margin: "4px" as any,
          wrap: true,
          lineSpacing: "2px" as any,
        },
        {
          type: "text",
          text: t("noEventsDesc", lang) as string,
          size: "13px" as any,
          color: "#999999",
          margin: "8px" as any,
          wrap: true,
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
    altText: t("noEventsAlt", lang) as string,
    contents: bubble,
  };
}
