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

// Files table for all file types (PDFs, images, documents, etc.)
export const files = sqliteTable("files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fileKey: text("file_key").notNull().unique(),
  originalFilename: text("original_filename").notNull(),
  fileSize: integer("file_size").notNull(),
  contentType: text("content_type").notNull(),
  fileType: text("file_type", {
    enum: ["pdf", "image", "document", "other"],
  })
    .notNull()
    .default("other"),
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

export type FileRecord = typeof files.$inferSelect;
export type NewFileRecord = typeof files.$inferInsert;

// Notes table for text-based notes
export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: integer("user_id"),
  createdBy: text("created_by"),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

// Legacy: Keep pdf_files as alias for backward compatibility
export const pdfFiles = files;
export type PdfFile = FileRecord;
export type NewPdfFile = NewFileRecord;
