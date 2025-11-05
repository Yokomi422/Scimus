import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Example table - replace with your actual schema
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// PDF Files table for metadata management
export const pdfFiles = sqliteTable("pdf_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fileKey: text("file_key").notNull().unique(),
  originalFilename: text("original_filename").notNull(),
  fileSize: integer("file_size").notNull(),
  contentType: text("content_type").notNull().default("application/pdf"),
  bucket: text("bucket").notNull(),
  storageProvider: text("storage_provider").notNull().default("minio"),
  etag: text("etag"),
  userId: integer("user_id"),
  uploadedBy: text("uploaded_by"),
  processingStatus: text("processing_status", {
    enum: ["pending", "processing", "completed", "failed"],
  })
    .notNull()
    .default("pending"),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
});

export type PdfFile = typeof pdfFiles.$inferSelect;
export type NewPdfFile = typeof pdfFiles.$inferInsert;
