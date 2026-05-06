import type { Notification } from "./types";

const typeWeight: Record<Notification["type"], number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
  Reminder: 1,
  Announcement: 1
};

function rank(notification: Notification) {
  const recency = Date.parse(notification.createdAt);
  return notification.priorityScore * 10_000 + typeWeight[notification.type] * 1_000 + recency;
}

export function getTopNotifications(notifications: Notification[], limit: number) {
  const items = [...notifications];
  items.sort((left, right) => rank(right) - rank(left));
  return items.slice(0, limit);
}