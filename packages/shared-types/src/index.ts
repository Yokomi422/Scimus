// Shared types between frontend and backend

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// File types
export type FileType = "pdf" | "image" | "document" | "other";
export type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

export interface FileRecord {
  id: number;
  fileKey: string;
  originalFilename: string;
  fileSize: number;
  contentType: string;
  fileType: FileType;
  bucket: string;
  storageProvider: string;
  etag?: string | null;
  userId?: number | null;
  uploadedBy?: string | null;
  processingStatus: ProcessingStatus;
  uploadedAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown> | null;
}

// Legacy: PdfFile is now an alias for FileRecord
export type PdfFile = FileRecord;

export interface PdfFileMetadata {
  pages?: number;
  author?: string;
  title?: string;
  subject?: string;
  keywords?: string;
  creationDate?: string;
  [key: string]: unknown;
}

export interface UploadResponse extends ApiResponse<PdfFile> {
  file?: {
    name: string;
    size: number;
    type: string;
    savedAs: string;
    bucket?: string;
    uploadedAt: string;
  };
  storageType?: string;
}

export interface DownloadUrlResponse extends ApiResponse {
  downloadUrl?: string;
  expiresIn?: number;
}

// Note types
export interface Note {
  id: number;
  title: string;
  content: string;
  userId?: number | null;
  createdBy?: string | null;
  tags?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown> | null;
}

export interface NewNote {
  title: string;
  content: string;
  userId?: number;
  createdBy?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

// Add more shared types here
