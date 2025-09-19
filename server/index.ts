import express from "express";
import cors from "cors";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";

// Bootstrap the Express app and HTTP server
async function main() {
  const app = express();

  // Basic security/json middlewares
  app.use(express.json({ limit: "10mb" }));

  // CORS so external sites (e.g., www.devi-jewellers.com) can fetch public rates
  const allowedOrigins = [
    "https://www.devi-jewellers.com",
    "https://devi-jewellers.com",
    // Allow localhost during development
    "http://localhost:3000",
    "http://localhost:5173",
  ];
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, true); // fallback: allow all to avoid breaking existing clients
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );

  // Register API routes (returns an http server bound to this app)
  const httpServer = await registerRoutes(app);

  // In dev, mount Vite for the client; in prod, serve built static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
