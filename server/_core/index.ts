import "dotenv/config";
import express, { type Request, type Response } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeScheduler, stopAllScheduledTasks } from "../scheduler";
import { initializeWeeklyScheduler, stopWeeklyScheduler } from "../weekly-scheduler";
import { verifyFirebaseToken } from "./firebaseAdmin";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as db from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => { server.close(() => resolve(true)); });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  try {
    await initializeScheduler();
    initializeWeeklyScheduler();
  } catch (error) {
    console.error("Failed to initialize scheduler:", error);
  }

  process.on("SIGTERM", () => {
    console.log("SIGTERM received, stopping scheduler...");
    stopAllScheduledTasks();
    stopWeeklyScheduler();
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("SIGINT received, stopping scheduler...");
    stopAllScheduledTasks();
    stopWeeklyScheduler();
    process.exit(0);
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ─── Firebase Auth Login ────────────────────────────────────────────────────
  app.post("/api/auth/firebase-login", async (req: Request, res: Response) => {
    const { idToken } = req.body as { idToken?: string };

    if (!idToken) {
      res.status(400).json({ error: "idToken manquant" });
      return;
    }

    try {
      const userInfo = await verifyFirebaseToken(idToken);

      await db.upsertUser({
        openId: userInfo.uid,
        name: userInfo.name,
        email: userInfo.email,
        loginMethod: userInfo.loginMethod,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.uid, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error("[Firebase Auth] Erreur de vérification du token:", detail);
      res.status(401).json({ error: `Token Firebase invalide: ${detail}` });
    }
  });

  // ─── Logout ─────────────────────────────────────────────────────────────────
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ success: true });
  });

  // ─── tRPC API ────────────────────────────────────────────────────────────────
  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );

  // ─── Static / Vite ───────────────────────────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) console.log(`Port ${preferredPort} busy, using ${port}`);

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
