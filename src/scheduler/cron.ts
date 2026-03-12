import cron from "node-cron";
import { Client } from "@line/bot-sdk";
import { pool } from "../db/client";
import { nowKST, todayString } from "../utils/date";
import {
  getWeekStartDate,
  getGroupWeeklyAttendance,
} from "../services/attendance";
import {
  getActiveEvent,
  getEventById,
  closeEventAndDetermineWinner,
  getUpcomingEvents,
  getWeeklyPerfectAttendees,
} from "../services/event";
import { getDailyPaceRanking } from "../services/ranking";
import {
  buildWeeklyAttendanceCard,
  buildEventAnnouncementCard,
  buildEventResultCard,
  buildWeeklyWinnersCard,
  buildPrizeDeliveryCard,
} from "../flex/eventCard";

export function setupScheduler(client: Client): void {
  const tz = { timezone: "Asia/Seoul" };

  // 매일 저녁 8시 (KST) - 주간 개근 현황 발송
  cron.schedule("0 20 * * *", () => sendWeeklyStatus(client), tz);

  // 매일 오전 9시 (KST) - 이벤트 공지 (D-3, D-1) + 전일 이벤트 결과
  cron.schedule("0 9 * * *", () => sendEventNotifications(client), tz);

  // 매일 자정 (KST) - 당일 이벤트 공지
  cron.schedule("0 0 * * *", () => sendDayOfEventNotice(client), tz);

  // 매일 18시 (KST) - 이벤트 중간 순위
  cron.schedule("0 18 * * *", () => sendMidDayRanking(client), tz);

  // 매주 월요일 오전 9시 (KST) - 주간 개근 달성자 발표
  cron.schedule("0 9 * * 1", () => announceWeeklyWinners(client), tz);

  console.log("Scheduler initialized");
}

async function getAllGroupIds(): Promise<string[]> {
  const result = await pool.query(
    `SELECT DISTINCT group_id FROM member_stats`
  );
  return result.rows.map((r) => r.group_id);
}

async function sendWeeklyStatus(client: Client): Promise<void> {
  try {
    const groupIds = await getAllGroupIds();
    const weekStart = getWeekStartDate(nowKST());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekLabel = `${formatShortDate(weekStart)} 월 ~ ${formatShortDate(weekEnd)} 일`;

    for (const groupId of groupIds) {
      const attendance = await getGroupWeeklyAttendance(groupId, weekStart);
      if (attendance.length === 0) continue;

      const card = buildWeeklyAttendanceCard(weekLabel, attendance);
      await client.pushMessage(groupId, card);
    }
  } catch (error) {
    console.error("Weekly status error:", error);
  }
}

async function sendEventNotifications(client: Client): Promise<void> {
  try {
    const groupIds = await getAllGroupIds();
    const today = nowKST();
    today.setHours(0, 0, 0, 0);

    for (const groupId of groupIds) {
      const events = await getUpcomingEvents(groupId);

      for (const evt of events) {
        if (!evt.eventDate) continue;
        const eventDate = new Date(evt.eventDate);
        eventDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.round(
          (eventDate.getTime() - today.getTime()) / 86400000
        );

        if (daysUntil === 3 || daysUntil === 1) {
          const card = buildEventAnnouncementCard(evt.eventDate, daysUntil);
          await client.pushMessage(groupId, card);
        }
      }

      // 전일 이벤트 결과 발표
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yy = yesterday.getFullYear();
      const ym = String(yesterday.getMonth() + 1).padStart(2, "0");
      const yd = String(yesterday.getDate()).padStart(2, "0");
      const yesterdayStr = `${yy}-${ym}-${yd}`;
      const yesterdayEvent = await getActiveEvent(groupId, yesterdayStr);

      if (yesterdayEvent && yesterdayEvent.status !== "CLOSED") {
        const winner = await closeEventAndDetermineWinner(
          yesterdayEvent.eventId,
          groupId
        );
        const ranking = await getDailyPaceRanking(groupId, yesterdayStr);
        const resultCard = buildEventResultCard(
          yesterdayStr,
          ranking,
          ranking.length
        );
        await client.pushMessage(groupId, resultCard);

        // 우승자가 있고 상품이 설정된 경우, 이벤트 생성자에게 상품 전달 DM 발송
        if (winner) {
          try {
            const closedEvent = await getEventById(yesterdayEvent.eventId);
            if (closedEvent && closedEvent.createdBy && closedEvent.prizeProductId) {
              const deliveryCard = buildPrizeDeliveryCard({
                eventName: closedEvent.eventName || yesterdayStr,
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
    }
  } catch (error) {
    console.error("Event notification error:", error);
  }
}

async function sendDayOfEventNotice(client: Client): Promise<void> {
  try {
    const groupIds = await getAllGroupIds();
    const today = todayString();

    for (const groupId of groupIds) {
      const activeEvent = await getActiveEvent(groupId, today);
      if (activeEvent) {
        const card = buildEventAnnouncementCard(today, 0);
        await client.pushMessage(groupId, card);

        // 상태를 ACTIVE로 변경
        await pool.query(
          `UPDATE events SET status = 'ACTIVE' WHERE event_id = $1`,
          [activeEvent.eventId]
        );
      }
    }
  } catch (error) {
    console.error("Day-of event notice error:", error);
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

async function announceWeeklyWinners(client: Client): Promise<void> {
  try {
    const groupIds = await getAllGroupIds();
    // 지난주 월~일
    const lastWeekStart = getWeekStartDate(nowKST());
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    for (const groupId of groupIds) {
      const winners = await getWeeklyPerfectAttendees(groupId, lastWeekStart);
      const card = buildWeeklyWinnersCard(winners);
      await client.pushMessage(groupId, card);
    }
  } catch (error) {
    console.error("Weekly winners error:", error);
  }
}

function formatShortDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
