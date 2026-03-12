import { FlexMessage, FlexBubble } from "@line/bot-sdk";
import { Lang, t } from "../i18n";

function buildCommandRow(cmd: string, desc: string) {
  return {
    type: "box" as const,
    layout: "horizontal" as const,
    contents: [
      {
        type: "text" as const,
        text: cmd,
        size: "13px" as any,
        flex: 3,
        color: "#111111",
        weight: "bold" as const,
      },
      {
        type: "text" as const,
        text: desc,
        size: "13px" as any,
        flex: 5,
        color: "#999999",
        wrap: true,
      },
    ],
  };
}

export function buildHelpCard(lang: Lang = "ko"): FlexMessage {
  const isKo = lang === "ko";

  const commands = isKo
    ? [
        { cmd: "📸 스크린샷", desc: "러닝 인증 + 출석" },
        { cmd: "/내기록", desc: "개인 월간 통계" },
        { cmd: "/랭킹", desc: "주간 랭킹" },
        { cmd: "/출석", desc: "이번 주 출석 현황" },
        { cmd: "/이벤트", desc: "진행 중인 이벤트" },
        { cmd: "/도움말", desc: "명령어 안내" },
      ]
    : [
        { cmd: "📸 Screenshot", desc: "Log run + attendance" },
        { cmd: "/mystats", desc: "Monthly personal stats" },
        { cmd: "/ranking", desc: "Weekly ranking" },
        { cmd: "/attendance", desc: "Weekly attendance" },
        { cmd: "/event", desc: "Upcoming events" },
        { cmd: "/help", desc: "This guide" },
      ];

  const adminCommands = isKo
    ? [
        { cmd: "/이벤트생성", desc: "하루 랭킹 이벤트 생성" },
        { cmd: "/이벤트취소", desc: "예약 이벤트 취소" },
        { cmd: "/이벤트현황", desc: "당일 실시간 랭킹" },
      ]
    : [
        { cmd: "/createevent", desc: "Create daily event" },
        { cmd: "/cancelevent", desc: "Cancel event" },
        { cmd: "/eventstatus", desc: "Today's live ranking" },
      ];

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
          text: "Running Bot",
          size: "14px" as any,
          weight: "bold",
          color: "#333333",
        },
        {
          type: "text",
          text: t("helpCardTitle", lang) as string,
          size: "20px" as any,
          weight: "bold",
          color: "#111111",
          margin: "4px" as any,
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "8px" as any,
          margin: "16px" as any,
          contents: commands.map((c) => buildCommandRow(c.cmd, c.desc)),
        },
        {
          type: "text",
          text: isKo ? "👑 관리자 전용" : "👑 Admin Only",
          size: "13px" as any,
          weight: "bold",
          color: "#333333",
          margin: "16px" as any,
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "8px" as any,
          margin: "8px" as any,
          contents: adminCommands.map((c) => buildCommandRow(c.cmd, c.desc)),
        },
      ],
    },
  };

  return {
    type: "flex",
    altText: t("helpAlt", lang) as string,
    contents: bubble,
  };
}
