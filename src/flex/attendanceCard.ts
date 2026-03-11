import { FlexMessage, FlexBubble } from "@line/bot-sdk";

export function buildAttendanceCard(
  displayName: string,
  days: boolean[],
  totalDays: number
): FlexMessage {
  const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];
  const remaining = 7 - totalDays;

  const dayCircles = days.map((checked, i) => ({
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
        contents: [
          {
            type: "text" as const,
            text: checked ? "✓" : "",
            size: "12px" as any,
            color: "#111111",
            align: "center" as const,
          },
        ],
      },
      {
        type: "text" as const,
        text: dayLabels[i],
        size: "11px" as any,
        color: checked ? "#111111" : "#AAAAAA",
        align: "center" as const,
      },
    ],
  }));

  const titleText = remaining > 0
    ? `${displayName}이\n${totalDays}일째 달리는 중!`
    : `${displayName}이\n7일 개근 달성!`;

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
          text: `출석 ${totalDays}/7일`,
          size: "12px" as any,
          color: "#AAAAAA",
          margin: "4px" as any,
        },
        {
          type: "box",
          layout: "horizontal",
          margin: "16px" as any,
          justifyContent: "space-between" as any,
          contents: dayCircles as any,
        },
        ...(remaining > 0
          ? [
              {
                type: "text" as const,
                text: `개근까지 ${remaining}일 남았어요`,
                size: "13px" as any,
                color: "#999999",
                margin: "12px" as any,
                align: "center" as const,
              },
            ]
          : []),
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
            label: "내 랭킹 확인하기",
            data: "action=command&cmd=ranking",
          },
          backgroundColor: "#111111",
          cornerRadius: "8px",
          paddingAll: "14px",
          justifyContent: "center" as const,
          alignItems: "center" as const,
          contents: [
            {
              type: "text" as const,
              text: "내 랭킹 확인하기",
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
            label: "상품 확인하기",
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
              text: "상품 확인하기",
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
    altText: `출석 현황: ${totalDays}/7일`,
    contents: bubble,
  };
}
