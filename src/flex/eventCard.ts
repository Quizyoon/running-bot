import { FlexMessage, FlexBubble } from "@line/bot-sdk";
import { RankingEntry } from "../services/ranking";

export function buildEventAnnouncementCard(
  eventDate: string,
  daysUntil: number
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
    altText: `${emoji} ${title}`,
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

function formatDateKr(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
}
