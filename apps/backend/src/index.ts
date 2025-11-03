import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { bodyLimit } from "hono/body-limit";
import path from "path";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
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

// API routes
const api = new Hono();

api.get("/", (c) => {
  return c.json({ message: "API v1" });
});

// Upload endpoint with body size limit
api.post(
  "/upload",
  bodyLimit({
    maxSize: 100 * 1024 * 1024, // 100MB
    onError: (c) => {
      return c.json(
        {
          error: "ファイルサイズが大きすぎます",
          message: "最大100MBまでアップロード可能です",
        },
        413
      );
    },
  }),
  async (c) => {
    try {
      const body = await c.req.parseBody();
      const file = body["file"];

      // ファイルが存在するかチェック
      if (!file || !(file instanceof File)) {
        return c.json(
          {
            error: "ファイルが見つかりません",
            message: "ファイルをアップロードしてください",
          },
          400
        );
      }

      // PDFファイルかチェック
      if (file.type !== "application/pdf") {
        return c.json(
          {
            error: "無効なファイル形式",
            message: "PDFファイルのみアップロード可能です",
          },
          415
        );
      }

      // ファイルサイズチェック（念のため）
      if (file.size > 100 * 1024 * 1024) {
        return c.json(
          {
            error: "ファイルサイズが大きすぎます",
            message: "最大100MBまでアップロード可能です",
          },
          413
        );
      }

      // ファイル名を生成（タイムスタンプ + オリジナルファイル名）
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `${timestamp}_${safeFileName}`;
      const uploadDir = path.join(import.meta.dir, "../uploads");
      const filePath = path.join(uploadDir, fileName);

      // Bunのネイティブ機能でファイルを保存
      const arrayBuffer = await file.arrayBuffer();
      await Bun.write(filePath, arrayBuffer);

      console.log(`✅ File uploaded: ${fileName} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

      return c.json({
        success: true,
        message: "ファイルのアップロードに成功しました",
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          savedAs: fileName,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      return c.json(
        {
          error: "アップロードエラー",
          message: error instanceof Error ? error.message : "不明なエラーが発生しました",
        },
        500
      );
    }
  }
);

app.route("/api/v1", api);

const port = process.env.PORT || 3001;

// Bunのサーバーを起動（maxRequestBodySizeを設定）
export default {
  port,
  fetch: app.fetch,
  // Bunのサーバー設定
  maxRequestBodySize: 100 * 1024 * 1024, // 100MB
};

console.log(`🚀 Server running at http://localhost:${port}`);
