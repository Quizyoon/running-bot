import cron from "node-cron";
import { Client } from "@line/bot-sdk";
import { pool } from "../db/client";
import { nowKST, todayString } from "../utils/date";
import {
  getActiveEvent,
  getEventById,
  getExpiredEvents,
  closeEventAndDetermineWinner,
  getUpcomingEvents,
} from "../services/event";
import { getDailyPaceRanking } from "../services/ranking";
import {
  buildEventAnnouncementCard,
  buildEventResultCard,
  buildPrizeDeliveryCard,
} from "../flex/eventCard";

export function setupScheduler(client: Client): void {
  const tz = { timezone: "Asia/Seoul" };

  // 매일 오전 9시 (KST) - 이벤트 공지 (D-3, D-1) + 종료된 이벤트 결과 발표
  cron.schedule("0 9 * * *", () => sendEventNotifications(client), tz);

  // 매일 자정 (KST) - 종료일 지난 이벤트 마감 + 생성자 DM + 당일 이벤트 공지
  cron.schedule("0 0 * * *", () => midnightTasks(client), tz);

  // 매일 18시 (KST) - 이벤트 중간 순위
  cron.schedule("0 18 * * *", () => sendMidDayRanking(client), tz);

  // 14분마다 self-ping → Render free tier sleep 방지
  const APP_URL = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
  if (APP_URL) {
    cron.schedule("*/14 * * * *", async () => {
      try {
        const res = await fetch(`${APP_URL}/health`);
        console.log(`[keep-alive] ${res.status}`);
      } catch (err: any) {
        console.error("[keep-alive] failed:", err?.message);
      }
    });
  }

  console.log("Scheduler initialized");
}

async function getAllGroupIds(): Promise<string[]> {
  const result = await pool.query(
    `SELECT DISTINCT group_id FROM member_stats`
  );
  return result.rows.map((r) => r.group_id);
}

/** 자정: 종료일 지난 이벤트 마감 + 생성자 DM + 당일 이벤트 공지 */
async function midnightTasks(client: Client): Promise<void> {
  try {
    const groupIds = await getAllGroupIds();
    const today = todayString(); // 자정 기준 오늘 날짜

    for (const groupId of groupIds) {
      // 1) 종료일이 지난 이벤트 마감 (event_end_date < today)
      const expired = await getExpiredEvents(groupId, today);
      for (const evt of expired) {
        const winner = await closeEventAndDetermineWinner(evt.eventId, groupId);

        // 우승자가 있고 상품이 설정된 경우, 생성자에게 상품 전달 DM
        if (winner) {
          try {
            const closedEvent = await getEventById(evt.eventId);
            if (closedEvent && closedEvent.createdBy && closedEvent.prizeProductId) {
              const deliveryCard = buildPrizeDeliveryCard({
                eventName: closedEvent.eventName || evt.eventDate || "이벤트",
                winnerName: winner.winnerName,
                eventMethod: closedEvent.eventMethod,
                productId: closedEvent.prizeProductId,
              });
              await client.pushMessage(closedEvent.createdBy, deliveryCard);
            }
          } catch (dmErr: any) {
            console.error("Prize delivery DM failed:", dmErr?.message);
          }
        }
      }

      // 2) 당일 시작하는 이벤트 공지
      const activeEvent = await getActiveEvent(groupId, today);
      if (activeEvent && activeEvent.status !== "CLOSED") {
        const card = buildEventAnnouncementCard(today, 0, {
          eventName: activeEvent.eventName || undefined,
          eventEndDate: activeEvent.eventEndDate || undefined,
          prizeInfo: activeEvent.prizeInfo || undefined,
          prizeImageUrl: activeEvent.prizeImageUrl || undefined,
          eventMethod: activeEvent.eventMethod || undefined,
          groupId,
        });
        await client.pushMessage(groupId, card);

        // 상태를 ACTIVE로 변경
        await pool.query(
          `UPDATE events SET status = 'ACTIVE' WHERE event_id = $1`,
          [activeEvent.eventId]
        );
      }
    }
  } catch (error) {
    console.error("Midnight tasks error:", error);
  }
}

/** 오전 9시: 이벤트 D-3/D-1 공지 + 전일 종료된 이벤트 결과 발표 */
async function sendEventNotifications(client: Client): Promise<void> {
  try {
    const groupIds = await getAllGroupIds();
    const todayStr = todayString();
    const todayDate = new Date(todayStr + "T00:00:00");

    for (const groupId of groupIds) {
      // D-3, D-1 공지
      const events = await getUpcomingEvents(groupId);
      for (const evt of events) {
        if (!evt.eventDate) continue;
        const eventDate = new Date(evt.eventDate + "T00:00:00");
        const daysUntil = Math.round(
          (eventDate.getTime() - todayDate.getTime()) / 86400000
        );

        if (daysUntil === 3 || daysUntil === 1) {
          const card = buildEventAnnouncementCard(evt.eventDate, daysUntil, {
            eventName: evt.eventName || undefined,
            eventEndDate: evt.eventEndDate || undefined,
            prizeInfo: evt.prizeInfo || undefined,
            prizeImageUrl: evt.prizeImageUrl || undefined,
            eventMethod: evt.eventMethod || undefined,
            groupId,
          });
          await client.pushMessage(groupId, card);
        }
      }

      // 자정에 마감된 이벤트의 결과 카드 발표 (CLOSED 상태, 어제 종료)
      const yesterdayDate = new Date(todayDate);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, "0")}-${String(yesterdayDate.getDate()).padStart(2, "0")}`;

      const result = await pool.query(
        `SELECT * FROM events
         WHERE group_id = $1
           AND status = 'CLOSED'
           AND COALESCE(event_end_date, event_date) = $2
         ORDER BY event_date ASC`,
        [groupId, yesterdayStr]
      );

      for (const row of result.rows) {
        const evt = row;
        const startDate = evt.event_date ? new Date(evt.event_date).toISOString().split("T")[0] : yesterdayStr;
        const endDate = evt.event_end_date ? new Date(evt.event_end_date).toISOString().split("T")[0] : startDate;
        const ranking = await getDailyPaceRanking(groupId, endDate);
        const period = startDate === endDate ? startDate : `${startDate} ~ ${endDate}`;
        const resultCard = buildEventResultCard(period, ranking, ranking.length, groupId);
        await client.pushMessage(groupId, resultCard);

        // 결과 발표 완료 → 재발송 방지
        await pool.query(
          `UPDATE events SET status = 'RESULT_SENT' WHERE event_id = $1`,
          [evt.event_id]
        );
      }
    }
  } catch (error) {
    console.error("Event notification error:", error);
  }
}

async function sendMidDayRanking(client: Client): Promise<void> {
  try {
    const groupIds = await getAllGroupIds();
    const today = todayString();

    for (const groupId of groupIds) {
      const activeEvent = await getActiveEvent(groupId, today);
      if (!activeEvent) continue;

      const ranking = await getDailyPaceRanking(groupId, today);
      if (ranking.length === 0) continue;

      const resultCard = buildEventResultCard(
        `${today} 중간 순위`,
        ranking,
        ranking.length
      );
      await client.pushMessage(groupId, resultCard);
    }
  } catch (error) {
    console.error("Mid-day ranking error:", error);
  }
}
