import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import cookieParser from "cookie-parser";
import type { NextFunction, Request, Response } from "express";

import { initMongoDB } from "./database/initMongoDb.js";
import { printRoutes } from "./helpers/printRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import router from "./routes/index.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { env } from "./utils/env.js";

const app = express();

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  optionsSuccessStatus: 204,
};

const getRequestOrigin = (req: Request) =>
  req.header("origin") ?? req.header("referer") ?? "unknown";

const originEchoMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestOrigin = getRequestOrigin(req);
  res.setHeader("X-Served-For-Origin", requestOrigin);

  const originalJson = res.json.bind(res);
  const customJson: Response["json"] = (body?: unknown) => {
    if (body && typeof body === "object" && !Array.isArray(body)) {
      (body as Record<string, unknown>).servedForOrigin = requestOrigin;
    }
    return originalJson(body);
  };

  res.json = customJson;
  next();
};

app.use(express.json());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(cookieParser());
app.use(originEchoMiddleware);

app.use(initMongoDB);

app.use(requestLogger);

app.use(router);

app.use(errorHandler);

printRoutes(app);
export const handler = serverless(app);

if (process.env.NODE_ENV !== "production") {
  const PORT = env("PORT", "3001");
  app.listen(PORT, () => {
    console.log(`🚀 Express server running on http://localhost:${PORT}`);
  });
}
