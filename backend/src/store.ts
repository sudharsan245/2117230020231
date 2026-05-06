import { randomUUID } from "node:crypto";
import type { CreateNotificationsRequest, Notification } from "./types.js";

const baseTimestamp = Date.now();

const seededNotifications: Notification[] = [
  {
    id: randomUUID(),
    studentId: 1042,
    type: "Placement",
    title: "Placement drive shortlisted",
    message: "You are shortlisted for the final interview round.",
    priorityScore: 100,
    createdAt: new Date(baseTimestamp - 1000 * 60 * 15).toISOString(),
    isRead: false,
    source: "seed"
  },
  {
    id: randomUUID(),
    studentId: 1042,
    type: "Result",
    title: "Assessment score published",
    message: "Your backend assessment score is now available.",
    priorityScore: 92,
    createdAt: new Date(baseTimestamp - 1000 * 60 * 45).toISOString(),
    isRead: false,
    source: "seed"
  },
  {
    id: randomUUID(),
    studentId: 1042,
    type: "Event",
    title: "Webinar reminder",
    message: "The developer webinar starts in 2 hours.",
    priorityScore: 60,
    createdAt: new Date(baseTimestamp - 1000 * 60 * 90).toISOString(),
    isRead: true,
    source: "seed"
  }
];

export class NotificationStore {
  private notifications: Notification[] = [...seededNotifications];

  list(filters: { studentId?: number; isRead?: boolean; type?: string; limit?: number }) {
    const items = this.notifications.filter((notification) => {
      if (typeof filters.studentId === "number" && notification.studentId !== filters.studentId) {
        return false;
      }

      if (typeof filters.isRead === "boolean" && notification.isRead !== filters.isRead) {
        return false;
      }

      if (filters.type && notification.type !== filters.type) {
        return false;
      }

      return true;
    });

    const sorted = items.sort((left, right) => {
      if (left.priorityScore !== right.priorityScore) {
        return right.priorityScore - left.priorityScore;
      }

      return right.createdAt.localeCompare(left.createdAt);
    });

    if (typeof filters.limit === "number") {
      return sorted.slice(0, filters.limit);
    }

    return sorted;
  }

  getById(id: string) {
    return this.notifications.find((notification) => notification.id === id);
  }

  markRead(id: string, isRead: boolean) {
    const notification = this.getById(id);

    if (!notification) {
      return undefined;
    }

    notification.isRead = isRead;

    return notification;
  }

  bulkCreate(request: CreateNotificationsRequest) {
    const created = request.studentIds.map((studentId) => ({
      id: randomUUID(),
      studentId,
      type: request.type,
      title: request.title,
      message: request.message,
      priorityScore: request.priorityScore ?? 50,
      createdAt: new Date().toISOString(),
      isRead: false,
      source: "seed" as const
    }));

    this.notifications.unshift(...created);

    return created;
  }

  replaceAll(items: Notification[]) {
    this.notifications = [...items];
  }
}

export const notificationStore = new NotificationStore();