import type { Notification } from "./types";

export async function fetchNotifications() {
  const response = await fetch("/api/notifications");

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.status}`);
  }

  return (await response.json()) as Notification[];
}

export async function markNotificationRead(id: string, isRead: boolean) {
  const response = await fetch(`/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ isRead })
  });

  if (!response.ok) {
    throw new Error(`Failed to update notification ${id}`);
  }

  return (await response.json()) as Notification;
}