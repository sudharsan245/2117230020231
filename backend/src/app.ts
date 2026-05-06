import express from "express";
import cors from "cors";
import { loggingMiddleware, logApplicationError } from "./logging.js";
import { createNotifications, fetchNotifications, syncFromNotificationApi, topNotifications, updateReadStatus } from "./notification-service.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(loggingMiddleware);

  app.get("/health", (_request, response) => {
    response.json({ ok: true, service: "notification-backend" });
  });

  app.get("/api/notifications", async (request, response, next) => {
    try {
      const studentId = request.query.studentId ? Number(request.query.studentId) : undefined;
      const isRead = typeof request.query.isRead === "string" ? request.query.isRead === "true" : undefined;
      const type = typeof request.query.type === "string" ? request.query.type : undefined;
      const limit = request.query.limit ? Number(request.query.limit) : undefined;

      response.json(
        fetchNotifications({
          ...(studentId !== undefined ? { studentId } : {}),
          ...(isRead !== undefined ? { isRead } : {}),
          ...(type !== undefined ? { type } : {}),
          ...(limit !== undefined ? { limit } : {})
        })
      );
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/notifications/top", (request, response) => {
    const studentId = request.query.studentId ? Number(request.query.studentId) : undefined;
    const limit = request.query.limit ? Number(request.query.limit) : 10;

    response.json(topNotifications(limit, studentId));
  });

  app.post("/api/notifications/bulk", (request, response) => {
    const payload = request.body as { studentIds?: number[]; type?: string; title?: string; message?: string; priorityScore?: number };

    if (!payload.studentIds?.length || !payload.type || !payload.title || !payload.message) {
      response.status(400).json({ message: "studentIds, type, title and message are required" });
      return;
    }

    const created = createNotifications({
      studentIds: payload.studentIds,
      type: payload.type as any,
      title: payload.title,
      message: payload.message,
      ...(payload.priorityScore !== undefined ? { priorityScore: payload.priorityScore } : {})
    });

    response.status(201).json({ createdCount: created.length, notifications: created });
  });

  app.patch("/api/notifications/:id/read", (request, response) => {
    const payload = request.body as { isRead?: boolean };
    const updated = updateReadStatus(request.params.id, Boolean(payload.isRead));

    if (!updated) {
      response.status(404).json({ message: "Notification not found" });
      return;
    }

    response.json(updated);
  });

  app.post("/api/notifications/sync", async (request, response, next) => {
    try {
      const apiUrl = typeof request.body?.apiUrl === "string" ? request.body.apiUrl : process.env.NOTIFICATION_API_URL;

      if (!apiUrl) {
        response.status(400).json({ message: "apiUrl is required" });
        return;
      }

      const items = await syncFromNotificationApi(apiUrl);
      response.json({ syncedCount: items.length, notifications: items });
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, request: express.Request, response: express.Response) => {
    const requestId = request.header("x-request-id") ?? "unknown";
    logApplicationError(error, requestId);
    response.status(500).json({ message: "Internal Server Error" });
  });

  return app;
}