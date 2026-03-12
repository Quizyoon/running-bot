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

function buildCommandButton(label: string, action: { type: "message"; text: string } | { type: "uri"; uri: string }) {
  const btnAction = action.type === "message"
    ? { type: "message" as const, label, text: action.text }
    : { type: "uri" as const, label, uri: action.uri };
  return {
    type: "box" as const,
    layout: "vertical" as const,
    action: btnAction,
    backgroundColor: "#F5F5F5",
    cornerRadius: "8px",
    paddingAll: "14px",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    contents: [
      {
        type: "text" as const,
        text: label,
        size: "15px" as any,
        weight: "bold" as const,
        color: "#000000",
        align: "center" as const,
      },
    ],
  };
}

export function buildHelpCard(lang: Lang = "ko", groupId?: string): FlexMessage {
  const isKo = lang === "ko";

  const commands = isKo
    ? [
        { cmd: "📸 스크린샷", desc: "러닝 인증 + 출석" },
        { cmd: "/내기록", desc: "주간 개인 통계" },
        { cmd: "/랭킹", desc: "주간 랭킹" },
        { cmd: "/출석", desc: "이번 주 출석 현황" },
        { cmd: "/이벤트", desc: "진행 중인 이벤트" },
        { cmd: "/이벤트만들기", desc: "이벤트 생성" },
        { cmd: "/명령어", desc: "명령어 안내" },
      ]
    : [
        { cmd: "📸 Screenshot", desc: "Log run + attendance" },
        { cmd: "/mystats", desc: "Weekly personal stats" },
        { cmd: "/ranking", desc: "Weekly ranking" },
        { cmd: "/attendance", desc: "Weekly attendance" },
        { cmd: "/event", desc: "Upcoming events" },
        { cmd: "/createevent", desc: "Create event" },
        { cmd: "/help", desc: "This guide" },
      ];

  const buttons: { label: string; action: { type: "message"; text: string } | { type: "uri"; uri: string } }[] = isKo
    ? [
        { label: "기록 등록하기", action: { type: "uri", uri: "https://line.me/R/nv/cameraRoll/single" } },
        { label: "내 기록 보기", action: { type: "message", text: "/내기록" } },
        { label: "랭킹 보기", action: { type: "message", text: "/랭킹" } },
        { label: "출석 확인하기", action: { type: "message", text: "/출석" } },
        { label: "이벤트 확인하기", action: { type: "message", text: "/이벤트" } },
        { label: "이벤트 만들기", action: { type: "uri", uri: `https://liff.line.me/${process.env.LIFF_ID || ""}${groupId ? `?groupId=${encodeURIComponent(groupId)}` : ""}` } },
      ]
    : [
        { label: "Register Record", action: { type: "uri", uri: "https://line.me/R/nv/cameraRoll/single" } },
        { label: "My Stats", action: { type: "message", text: "/mystats" } },
        { label: "View Ranking", action: { type: "message", text: "/ranking" } },
        { label: "Check Attendance", action: { type: "message", text: "/attendance" } },
        { label: "Check Events", action: { type: "message", text: "/event" } },
        { label: "Create Event", action: { type: "uri", uri: `https://liff.line.me/${process.env.LIFF_ID || ""}${groupId ? `?groupId=${encodeURIComponent(groupId)}` : ""}` } },
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
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "8px" as any,
      paddingAll: "16px",
      paddingTop: "0px",
      paddingBottom: "16px",
      contents: buttons.map((b) => buildCommandButton(b.label, b.action)),
    },
  };

  return {
    type: "flex",
    altText: t("helpAlt", lang) as string,
    contents: bubble,
  };
}
