import "dotenv/config";
import express from "express";
import { middleware, Client, MiddlewareConfig, ClientConfig } from "@line/bot-sdk";
import { handleEvent } from "./webhook/handler";
import { initDatabase } from "./db/client";
import { setupScheduler } from "./scheduler/cron";

const middlewareConfig: MiddlewareConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
};

const clientConfig: ClientConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
};

const client = new Client(clientConfig);
const app = express();

// LINE webhook
app.post("/webhook", middleware(middlewareConfig), async (req, res) => {
  try {
    const events = req.body.events;
    await Promise.allSettled(
      events.map((event: any) => handleEvent(client, event))
    );
    res.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

async function main() {
  await initDatabase();
  setupScheduler(client);
  app.listen(PORT, () => {
    console.log(`Running bot server listening on port ${PORT}`);
  });
}

main().catch(console.error);
