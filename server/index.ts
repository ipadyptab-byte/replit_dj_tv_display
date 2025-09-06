import express from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";

// Basic server bootstrap to ensure API routes are registered and body parsing works
async function main() {
  const app = express();

  // Parse JSON and form bodies
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Register API routes
  await registerRoutes(app);

  const server = createServer(app);

  // Serve client via Vite in development, or static files in production
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  const PORT = Number(process.env.PORT || 3000);
  server.listen(PORT, () => {
    console.log(`[startup] Server listening on http://localhost:${PORT} (env=${process.env.NODE_ENV || "development"})`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
