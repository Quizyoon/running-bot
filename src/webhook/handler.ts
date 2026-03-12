import { Client, WebhookEvent, MessageEvent, PostbackEvent } from "@line/bot-sdk";
import { handleImageMessage } from "./image";
import { handleTextMessage } from "./message";
import { handlePostback } from "./postback";

export async function handleEvent(
  client: Client,
  event: WebhookEvent
): Promise<void> {
  try {
    switch (event.type) {
      case "message":
        if (event.message.type === "image") {
          await handleImageMessage(client, event as MessageEvent);
        } else if (event.message.type === "text") {
          await handleTextMessage(client, event as MessageEvent);
        }
        break;
      case "postback":
        await handlePostback(client, event as PostbackEvent);
        break;
    }
  } catch (error: any) {
    console.error("Event handling error:", error?.message, error?.stack);
    if (error?.response?.data) {
      console.error("LINE API error:", JSON.stringify(error.response.data));
    }
  }
}
