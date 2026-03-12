import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { middleware, Client, MiddlewareConfig, ClientConfig } from "@line/bot-sdk";
import { handleEvent } from "./webhook/handler";
import { initDatabase } from "./db/client";
import { setupScheduler } from "./scheduler/cron";
import { createDailyRaceEvent } from "./services/event";
import { buildEventAnnouncementCard } from "./flex/eventCard";
import { fetchBrandProducts } from "./services/giftshop";

const middlewareConfig: MiddlewareConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
};

const clientConfig: ClientConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
};

const LIFF_ID = process.env.LIFF_ID || "";

const client = new Client(clientConfig);
const app = express();

// LINE webhook (must come before express.json middleware)
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

// JSON body parser for API routes
app.use(express.json());

// LIFF page — inject LIFF_ID and groupId at runtime
app.get("/liff/event/:groupId?", (req, res) => {
  const htmlPath = path.join(__dirname, "../public/liff/event.html");
  let html = fs.readFileSync(htmlPath, "utf-8");
  html = html.replace("__LIFF_ID__", LIFF_ID);
  html = html.replace("__GROUP_ID__", (req.params as any).groupId || "");
  res.type("html").send(html);
});

// API: Create event from LIFF
app.post("/api/event/create", async (req, res) => {
  try {
    const { groupId, eventDate, eventEndDate, userId, eventName, prizeInfo, prizeProductId } = req.body;
    console.log(`[LIFF] Event create: groupId=${groupId} date=${eventDate}~${eventEndDate} user=${userId} name=${eventName} prize=${prizeProductId}`);

    if (!groupId || !eventDate || !userId) {
      res.status(400).json({ error: "필수 항목이 누락되었습니다" });
      return;
    }

    const eventId = await createDailyRaceEvent(groupId, eventDate, userId, {
      eventName: eventName || undefined,
      prizeInfo: prizeInfo || undefined,
      prizeProductId: prizeProductId || undefined,
      eventEndDate: eventEndDate || undefined,
    });

    // 그룹에 이벤트 공지 푸시 (실패해도 이벤트 생성은 유지)
    try {
      const daysUntil = Math.ceil(
        (new Date(eventDate).getTime() - Date.now()) / 86400000
      );
      const announcement = buildEventAnnouncementCard(eventDate, daysUntil, {
        eventName: eventName || undefined,
        prizeInfo: prizeInfo || undefined,
      });
      await client.pushMessage(groupId, announcement);
    } catch (pushErr: any) {
      console.error("Event push failed:", pushErr?.message);
    }

    res.json({ ok: true, eventId });
  } catch (err: any) {
    console.error("Event create error:", err?.message);
    res.status(409).json({ error: err.message });
  }
});

// API: Gift shop products
app.get("/api/gifts/products", async (req, res) => {
  try {
    const brandId = (req.query.brand as string) || "10000340";
    const products = await fetchBrandProducts(brandId);
    res.json({ ok: true, products });
  } catch (err: any) {
    console.error("Gift fetch error:", err?.message);
    res.status(500).json({ error: "상품 목록을 가져올 수 없습니다" });
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
