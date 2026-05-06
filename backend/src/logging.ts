import type { Request, Response, NextFunction } from "express";
import type { LogPackage, LogPayload, LogStack, NotificationLevel } from "./types.js";

const logServerUrl = process.env.LOG_SERVER_URL ?? "http://20.207.122.201/evaluation-service/logs";
const packageName: LogPackage = (process.env.LOG_PACKAGE_NAME as LogPackage | undefined) ?? "middleware";
const stackName: LogStack = (process.env.LOG_STACK_NAME as LogStack | undefined) ?? "backend";

export async function Log(stack: LogStack, level: NotificationLevel, logPackage: LogPackage, message: string, requestId: string) {
  const payload: LogPayload = {
    stack,
    level,
    package: logPackage,
    message,
    timestamp: new Date().toISOString(),
    requestId
  };

  try {
    await fetch(logServerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.log(JSON.stringify({ ...payload, message: `${message} | log delivery failed` }));
    console.error(error);
  }
}

export function loggingMiddleware(request: Request, response: Response, next: NextFunction) {
  const requestId = request.header("x-request-id") ?? crypto.randomUUID();
  const startedAt = Date.now();

  response.setHeader("x-request-id", requestId);

  void Log(stackName, "debug", packageName, `${request.method} ${request.originalUrl} started`, requestId);

  response.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    void Log(stackName, "info", packageName, `${request.method} ${request.originalUrl} completed in ${durationMs}ms`, requestId);
  });

  next();
}

export function logApplicationError(error: unknown, requestId: string) {
  const message = error instanceof Error ? error.message : "Unexpected application error";
  void Log(stackName, "error", packageName, message, requestId);
}