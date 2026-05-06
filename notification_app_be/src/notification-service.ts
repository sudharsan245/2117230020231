import { randomUUID } from "node:crypto";
import type { CreateNotificationsRequest, Notification } from "./types.js";
import { notificationStore } from "./store.js";

const typeWeight: Record<Notification["type"], number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
  Reminder: 1,
  Announcement: 1
};

function score(notification: Notification) {
  const freshness = Date.parse(notification.createdAt);
  return notification.priorityScore * 10_000 + typeWeight[notification.type] * 1_000 + freshness;
}

export function fetchNotifications(filters: { studentId?: number; isRead?: boolean; type?: string; limit?: number }) {
  return notificationStore.list(filters);
}

export function topNotifications(limit: number, studentId?: number) {
  return notificationStore
    .list({ ...(studentId !== undefined ? { studentId } : {}) })
    .sort((left, right) => score(right) - score(left))
    .slice(0, limit);
}

export function createNotifications(request: CreateNotificationsRequest) {
  return notificationStore.bulkCreate(request).map((notification) => ({
    ...notification,
    trackingId: randomUUID()
  }));
}

export function updateReadStatus(id: string, isRead: boolean) {
  return notificationStore.markRead(id, isRead);
}

export async function syncFromNotificationApi(apiUrl: string, authToken?: string) {
  const authorizationToken = authToken ?? process.env.AUTHORIZATION_TOKEN;
  const response = await fetch(apiUrl, {
    headers: {
      ...(authorizationToken ? { "Authorization": `Bearer ${authorizationToken}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`Notification API failed with ${response.status}`);
  }

  const payload = (await response.json()) as Array<Partial<Notification> & { id?: string }>;

  const mapped = payload
    .filter((item) => item.studentId !== undefined && item.type !== undefined)
    .map((item) => ({
      id: item.id ?? randomUUID(),
      studentId: Number(item.studentId),
      type: item.type ?? "Event",
      title: item.title ?? "Untitled notification",
      message: item.message ?? "",
      priorityScore: Number(item.priorityScore ?? 50),
      createdAt: item.createdAt ?? new Date().toISOString(),
      isRead: Boolean(item.isRead),
      source: "live" as const
    }));

  notificationStore.replaceAll(mapped);
  return mapped;
}