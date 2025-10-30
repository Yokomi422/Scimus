import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

// Routes
app.get("/", (c) => {
  return c.json({
    message: "Welcome to Scimus API",
    version: "0.1.0",
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// API routes placeholder
const api = new Hono();

api.get("/", (c) => {
  return c.json({ message: "API v1" });
});

app.route("/api/v1", api);

const port = process.env.PORT || 3001;

export default {
  port,
  fetch: app.fetch,
};

console.log(`🚀 Server running at http://localhost:${port}`);
