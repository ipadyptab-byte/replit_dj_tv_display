import "dotenv/config";
import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

async function bootstrap() {
  // Register API routes and create HTTP server
  const httpServer = await registerRoutes(app);

  // Attach Vite middleware in development, or serve static in production
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || 5000);

  httpServer.listen(port, () => {
    log(`Listening on http://localhost:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Server bootstrap failed:", err);
  process.exit(1);
});
