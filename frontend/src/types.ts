export type NotificationType = "Event" | "Result" | "Placement" | "Reminder" | "Announcement";

export interface Notification {
  id: string;
  studentId: number;
  type: NotificationType;
  title: string;
  message: string;
  priorityScore: number;
  createdAt: string;
  isRead: boolean;
  source: "live" | "seed";
}