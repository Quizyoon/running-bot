import { FlexMessage, FlexBubble } from "@line/bot-sdk";
import { RankingEntry } from "../services/ranking";
import { Lang, t } from "../i18n";

export const EVENT_METHODS: Record<string, string> = {
  fastest_pace: "페이스 1위 우승",
  longest_distance: "최장 거리 우승",
  most_runs: "최다 출석 우승",
};

export function getMethodLabel(method?: string): string {
  return EVENT_METHODS[method || "fastest_pace"] || EVENT_METHODS.fastest_pace;
}

export function buildEventAnnouncementCard(
  eventDate: string,
  daysUntil: number,
  options?: { eventName?: string; eventEndDate?: string; prizeInfo?: string; prizePrice?: number; prizeImageUrl?: string; eventMethod?: string }
): FlexMessage {
  const name = options?.eventName || "페이스 랭킹 이벤트";
  const dDayText = daysUntil === 0 ? "TODAY" : `D-${daysUntil}`;
  const period = options?.eventEndDate && options.eventEndDate !== eventDate
    ? `${eventDate} ~ ${options.eventEndDate}`
    : eventDate;

  const infoRows: any[] = [
    {
      type: "box" as const,
      layout: "horizontal" as const,
      contents: [
        { type: "text" as const, text: "이벤트", size: "14px" as any, color: "#999999", flex: 2 },
        { type: "text" as const, text: name, size: "14px" as any, color: "#111111", flex: 5 },
      ],
    },
    {
      type: "box" as const,
      layout: "horizontal" as const,
      contents: [
        { type: "text" as const, text: "기간", size: "14px" as any, color: "#999999", flex: 2 },
        { type: "text" as const, text: `${period} (${dDayText})`, size: "14px" as any, color: "#111111", flex: 5 },
      ],
    },
    {
      type: "box" as const,
      layout: "horizontal" as const,
      contents: [
        { type: "text" as const, text: "방식", size: "14px" as any, color: "#999999", flex: 2 },
        { type: "text" as const, text: getMethodLabel(options?.eventMethod), size: "14px" as any, color: "#111111", flex: 5 },
      ],
    },
  ];

  // 상품 썸네일 블록 (infoRows 밖, body 하단에 별도 배치)
  let prizeBlock: any = null;
  if (options?.prizeInfo) {
    if (options.prizeImageUrl) {
      prizeBlock = {
        type: "box" as const,
        layout: "horizontal" as const,
        margin: "12px" as any,
        spacing: "8px" as any,
        alignItems: "center" as const,
        contents: [
          {
            type: "box" as const,
            layout: "vertical" as const,
            width: "52px",
            height: "52px",
            cornerRadius: "6px",
            flex: 0,
            contents: [
              {
                type: "image" as const,
                url: options.prizeImageUrl,
                size: "full" as const,
                aspectRatio: "1:1",
                aspectMode: "cover" as const,
              },
            ],
          },
          {
            type: "text" as const,
            text: options.prizeInfo,
            size: "14px" as any,
            color: "#111111",
            flex: 1,
            maxLines: 1,
          },
        ],
      };
    } else {
      const prizeText = options.prizePrice
        ? `${options.prizeInfo} ($${options.prizePrice})`
        : options.prizeInfo;
      infoRows.push({
        type: "box" as const,
        layout: "horizontal" as const,
        contents: [
          { type: "text" as const, text: "상품", size: "14px" as any, color: "#999999", flex: 2 },
          { type: "text" as const, text: prizeText, size: "14px" as any, color: "#111111", flex: 5, wrap: true },
        ],
      });
    }
  }

  const bodyContents: any[] = [
    {
      type: "text",
      text: "New Event",
      size: "14px" as any,
      weight: "bold",
      color: "#333333",
    },
    {
      type: "text",
      text: "새 이벤트가 등록되었습니다",
      size: "20px" as any,
      weight: "bold",
      color: "#111111",
      margin: "4px" as any,
      wrap: true,
    },
    {
      type: "text",
      text: "러닝 앱 스크린샷으로 자동 참여!",
      size: "13px" as any,
      color: "#999999",
      margin: "8px" as any,
    },
  ];

  if (prizeBlock) {
    bodyContents.push(prizeBlock);
  }

  bodyContents.push({
    type: "box",
    layout: "vertical",
    spacing: "6px" as any,
    margin: "12px" as any,
    contents: infoRows,
  });

  const bubble: FlexBubble = {
    type: "bubble",
    size: "kilo",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      backgroundColor: "#FFFFFF",
      contents: bodyContents,
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
            label: "기록 등록하기",
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
              text: "기록 등록하기",
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
    altText: `📢 ${name}`,
    contents: bubble,
  };
}

export function buildEventResultCard(
  eventDate: string,
  ranking: RankingEntry[],
  participantCount: number,
  groupId?: string
): FlexMessage {
  const winner = ranking.length > 0 ? ranking[0] : null;

  const rows: any[] = ranking.slice(0, 10).map((entry, index) => {
    const isWinner = index === 0;
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
              text: isWinner ? `👑 ${entry.displayName}` : entry.displayName,
              size: "14px" as any,
              weight: "bold" as const,
              color: "#111111",
              maxLines: 1,
            },
            {
              type: "text" as const,
              text: `${entry.totalDistance}km · ${entry.paceDisplay}/km`,
              size: "12px" as any,
              color: "#999999",
              margin: "2px" as any,
            },
          ],
        },
      ],
    };
  });

  const liffId = process.env.LIFF_ID || "";
  const liffUrl = groupId
    ? `https://liff.line.me/${liffId}/${groupId}`
    : `https://liff.line.me/${liffId}`;

  const bubble: FlexBubble = {
    type: "bubble",
    size: "kilo",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      paddingBottom: "12px",
      backgroundColor: "#FFFFFF",
      contents: [
        {
          type: "text",
          text: "Event Result",
          size: "14px" as any,
          weight: "bold",
          color: "#333333",
        },
        {
          type: "text",
          text: winner ? `${winner.displayName} 우승!` : "이벤트 결과",
          size: "20px" as any,
          weight: "bold",
          color: "#111111",
          margin: "4px" as any,
          wrap: true,
        },
        {
          type: "text",
          text: `${eventDate} · 참가자 ${participantCount}명`,
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
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "8px" as any,
      paddingAll: "16px",
      paddingTop: "0px",
      paddingBottom: "16px",
      contents: [
        {
          type: "box" as const,
          layout: "vertical" as const,
          action: {
            type: "uri" as const,
            label: "새 이벤트 만들기",
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
              text: "새 이벤트 만들기",
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
    altText: `🏆 ${eventDate} 이벤트 결과${winner ? ` - 우승: ${winner.displayName}` : ""}`,
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

export function buildEventCreateCard(lang: Lang = "ko", groupId?: string): FlexMessage {
  const liffId = process.env.LIFF_ID || "";
  const liffUrl = groupId
    ? `https://liff.line.me/${liffId}/${groupId}`
    : `https://liff.line.me/${liffId}`;

  const title = lang === "ko" ? "새 이벤트 만들기" : "Create New Event";
  const desc = lang === "ko"
    ? "러닝 이벤트를 만들어보세요!\n방식과 상품을 선택할 수 있어요."
    : "Create a running event!\nChoose the method and prize.";
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
      paddingBottom: "16px",
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
  events: { eventDate: string; daysUntil: number; eventName?: string | null; prizeInfo?: string | null; prizeImageUrl?: string | null; prizePrice?: number | null; eventMethod?: string | null }[],
  lang: Lang = "ko"
): FlexMessage {
  const registerLabel = t("registerMyRecord", lang) as string;
  const subLabel = lang === "ko" ? "러닝 앱 스크린샷으로 자동 참여!" : "Auto-join by uploading running screenshots!";

  const rows: any[] = [];
  events.forEach((e, idx) => {
    const dDayText = e.daysUntil === 0 ? "TODAY" : `D-${e.daysUntil}`;
    const eventName = e.eventName || e.eventDate;

    // 상품 썸네일을 정보 행 위에 배치
    if (e.prizeInfo) {
      if (e.prizeImageUrl) {
        rows.push({
          type: "box" as const,
          layout: "horizontal" as const,
          margin: idx === 0 ? "0px" as any : undefined,
          spacing: "10px" as any,
          alignItems: "center" as const,
          contents: [
            {
              type: "box" as const,
              layout: "vertical" as const,
              width: "44px",
              height: "44px",
              cornerRadius: "6px",
              flex: 0,
              contents: [
                {
                  type: "image" as const,
                  url: e.prizeImageUrl,
                  size: "full" as const,
                  aspectRatio: "1:1",
                  aspectMode: "cover" as const,
                },
              ],
            },
            {
              type: "text" as const,
              text: e.prizeInfo,
              size: "14px" as any,
              color: "#111111",
              flex: 1,
              maxLines: 1,
            },
          ],
        });
      } else {
        rows.push({
          type: "box" as const,
          layout: "horizontal" as const,
          contents: [
            { type: "text" as const, text: "상품", size: "14px" as any, color: "#999999", flex: 2 },
            { type: "text" as const, text: e.prizeInfo, size: "14px" as any, color: "#111111", flex: 5 },
          ],
        });
      }
    }

    rows.push({
      type: "box" as const,
      layout: "horizontal" as const,
      margin: e.prizeInfo && e.prizeImageUrl ? "12px" as any : undefined,
      contents: [
        { type: "text" as const, text: "이벤트", size: "14px" as any, color: "#999999", flex: 2 },
        { type: "text" as const, text: eventName, size: "14px" as any, color: "#111111", flex: 5, maxLines: 1 },
      ],
    });
    rows.push({
      type: "box" as const,
      layout: "horizontal" as const,
      contents: [
        { type: "text" as const, text: "기간", size: "14px" as any, color: "#999999", flex: 2 },
        { type: "text" as const, text: `${e.eventDate} (${dDayText})`, size: "14px" as any, color: "#111111", flex: 5 },
      ],
    });
    rows.push({
      type: "box" as const,
      layout: "horizontal" as const,
      contents: [
        { type: "text" as const, text: "방식", size: "14px" as any, color: "#999999", flex: 2 },
        { type: "text" as const, text: getMethodLabel(e.eventMethod || undefined), size: "14px" as any, color: "#111111", flex: 5 },
      ],
    });

    if (idx < events.length - 1) {
      rows.push({
        type: "box" as const,
        layout: "vertical" as const,
        margin: "12px" as any,
        paddingBottom: "12px" as any,
        contents: [{ type: "separator" as const }],
      });
    }
  });


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
          text: subLabel,
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

export function buildNoEventsCard(lang: Lang = "ko", groupId?: string): FlexMessage {
  const btnLabel = lang === "ko" ? "새 이벤트 만들기" : "Create New Event";
  const liffId = process.env.LIFF_ID || "";
  const liffUrl = groupId
    ? `https://liff.line.me/${liffId}/${groupId}`
    : `https://liff.line.me/${liffId}`;

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
    altText: t("noEventsAlt", lang) as string,
    contents: bubble,
  };
}
