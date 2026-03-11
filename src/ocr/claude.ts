import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export interface OcrResult {
  distanceKm: number | null;
  durationSec: number | null;
  durationDisplay: string | null;
  paceMinPerKm: number | null;
  paceDisplay: string | null;
  runDate: string | null;
}

export async function extractRunDataFromImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<OcrResult> {
  const base64Image = imageBuffer.toString("base64");
  const mediaType = mimeType as
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp";

  const today = new Date().toISOString().split("T")[0];

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Image },
          },
          {
            type: "text",
            text: `이 러닝 앱 스크린샷에서 다음 정보를 추출해주세요.
반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):

{
  "distanceKm": 숫자 (km 단위, 소수점 2자리),
  "durationSec": 숫자 (총 소요시간을 초 단위로 변환),
  "durationDisplay": "HH:MM:SS" 또는 "MM:SS" 형식 문자열,
  "paceMinPerKm": 숫자 (페이스를 분 단위 소수로, 예: 5분30초 = 5.5),
  "paceDisplay": "M'SS\\"" 형식 문자열 (예: 5'30"),
  "runDate": "YYYY-MM-DD" 형식 문자열
}

정보를 찾을 수 없으면 해당 필드를 null로 설정하세요.
날짜가 없으면 오늘 날짜(${today})를 사용하세요.
페이스가 없으면 거리와 시간으로 계산하세요.`,
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]) as OcrResult;
  } catch {
    console.error("Failed to parse OCR response:", text);
    return {
      distanceKm: null,
      durationSec: null,
      durationDisplay: null,
      paceMinPerKm: null,
      paceDisplay: null,
      runDate: null,
    };
  }
}
