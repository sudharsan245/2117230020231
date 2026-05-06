export type NotificationType = "Event" | "Result" | "Placement" | "Reminder" | "Announcement";

export type NotificationLevel = "debug" | "info" | "warn" | "error" | "fatal";

export type LogStack = "backend" | "frontend";

export type LogPackage = "cache" | "controller" | "cron_job" | "db" | "domain" | "handler" | "repository" | "route" | "service" | "api" | "component" | "hook" | "page" | "state" | "style" | "auth" | "config" | "middleware" | "utils";

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

export interface LogPayload {
  stack: LogStack;
  level: NotificationLevel;
  package: LogPackage;
  message: string;
  timestamp: string;
  requestId: string;
}

export interface CreateNotificationsRequest {
  studentIds: number[];
  type: NotificationType;
  title: string;
  message: string;
  priorityScore?: number;
}

export interface UpdateReadStatusRequest {
  isRead: boolean;
}