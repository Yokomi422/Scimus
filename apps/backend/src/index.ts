import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { bodyLimit } from "hono/body-limit";
import path from "path";
import { createStorageService } from "./services/storage.service";

const app = new Hono();

// Initialize storage service
const storageService = createStorageService();

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

// Get presigned URL for direct upload to MinIO/S3
api.post("/upload/presigned-url", async (c) => {
  try {
    const body = await c.req.json();
    const { fileName, fileType, fileSize } = body;

    // Validation
    if (!fileName || !fileType) {
      return c.json(
        {
          error: "必須パラメータが不足しています",
          message: "fileName と fileType は必須です",
        },
        400
      );
    }

    // PDF validation
    if (fileType !== "application/pdf") {
      return c.json(
        {
          error: "無効なファイル形式",
          message: "PDFファイルのみアップロード可能です",
        },
        415
      );
    }

    // File size validation
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || "104857600");
    if (fileSize && fileSize > maxSize) {
      return c.json(
        {
          error: "ファイルサイズが大きすぎます",
          message: `最大${(maxSize / 1024 / 1024).toFixed(0)}MBまでアップロード可能です`,
        },
        413
      );
    }

    // Generate unique file name
    const timestamp = Date.now();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectName = `${timestamp}_${safeFileName}`;

    // Get bucket name from storage service
    const bucketName = (storageService as any).getBucketName();

    // Generate presigned URL (5 minutes expiry)
    const expirySeconds = parseInt(process.env.PRESIGNED_URL_EXPIRY || "300");
    const uploadUrl = await storageService.getPresignedUploadUrl(
      bucketName,
      objectName,
      expirySeconds
    );

    return c.json({
      success: true,
      uploadUrl,
      objectName,
      bucketName,
      expiresIn: expirySeconds,
    });
  } catch (error) {
    console.error("Presigned URL generation error:", error);
    return c.json(
      {
        error: "署名付きURL生成エラー",
        message: error instanceof Error ? error.message : "不明なエラーが発生しました",
      },
      500
    );
  }
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

      // Upload to MinIO/S3 or local storage based on configuration
      const storageType = process.env.STORAGE_TYPE || "local";
      const bucketName = (storageService as any).getBucketName?.() || "pdf-uploads";

      if (storageType === "minio" || storageType === "s3") {
        // Upload to MinIO/S3
        await storageService.uploadFile(bucketName, fileName, file);
        console.log(`✅ File uploaded to ${storageType.toUpperCase()}: ${fileName} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

        return c.json({
          success: true,
          message: "ファイルのアップロードに成功しました",
          storageType,
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
            savedAs: fileName,
            bucket: bucketName,
            uploadedAt: new Date().toISOString(),
          },
        });
      } else {
        // Fallback to local file system
        const arrayBuffer = await file.arrayBuffer();
        await Bun.write(filePath, arrayBuffer);
        console.log(`✅ File uploaded locally: ${fileName} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

        return c.json({
          success: true,
          message: "ファイルのアップロードに成功しました",
          storageType: "local",
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
            savedAs: fileName,
            uploadedAt: new Date().toISOString(),
          },
        });
      }
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
