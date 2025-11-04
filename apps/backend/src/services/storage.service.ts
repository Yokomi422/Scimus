import * as Minio from "minio";

/**
 * Storage Service Interface
 * Provides unified API for file storage (MinIO/S3)
 */
export interface IStorageService {
  uploadFile(bucket: string, objectName: string, file: File): Promise<void>;
  getPresignedUploadUrl(bucket: string, objectName: string, expirySeconds: number): Promise<string>;
  deleteFile(bucket: string, objectName: string): Promise<void>;
  ensureBucket(bucket: string): Promise<void>;
}

/**
 * MinIO Storage Service
 * Local development storage using MinIO
 */
export class MinIOStorageService implements IStorageService {
  private client: Minio.Client;
  private bucketName: string;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT || "localhost";
    const port = parseInt(process.env.MINIO_PORT || "9000");
    const useSSL = process.env.MINIO_USE_SSL === "true";
    const accessKey = process.env.MINIO_ACCESS_KEY || "minioadmin";
    const secretKey = process.env.MINIO_SECRET_KEY || "minioadmin";
    this.bucketName = process.env.MINIO_BUCKET_NAME || "pdf-uploads";

    console.log(`🪣 Initializing MinIO Client (LOCAL DEV):`);
    console.log(`   Endpoint: ${endpoint}:${port}`);
    console.log(`   SSL: ${useSSL}`);
    console.log(`   Bucket: ${this.bucketName}`);

    this.client = new Minio.Client({
      endPoint: endpoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
  }

  async ensureBucket(bucket: string): Promise<void> {
    try {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        await this.client.makeBucket(bucket, "us-east-1");
        console.log(`✅ Created bucket: ${bucket}`);
      }
    } catch (error) {
      console.error(`❌ Error ensuring bucket ${bucket}:`, error);
      throw error;
    }
  }

  async uploadFile(bucket: string, objectName: string, file: File): Promise<void> {
    try {
      await this.ensureBucket(bucket);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await this.client.putObject(bucket, objectName, buffer, buffer.length, {
        "Content-Type": file.type,
      });

      console.log(`✅ Uploaded to MinIO: ${bucket}/${objectName}`);
    } catch (error) {
      console.error(`❌ MinIO upload error:`, error);
      throw error;
    }
  }

  async getPresignedUploadUrl(
    bucket: string,
    objectName: string,
    expirySeconds: number = 300
  ): Promise<string> {
    try {
      await this.ensureBucket(bucket);

      const url = await this.client.presignedPutObject(bucket, objectName, expirySeconds);
      console.log(`🔗 Generated presigned URL for: ${bucket}/${objectName} (expires in ${expirySeconds}s)`);
      return url;
    } catch (error) {
      console.error(`❌ Error generating presigned URL:`, error);
      throw error;
    }
  }

  async deleteFile(bucket: string, objectName: string): Promise<void> {
    try {
      await this.client.removeObject(bucket, objectName);
      console.log(`🗑️  Deleted from MinIO: ${bucket}/${objectName}`);
    } catch (error) {
      console.error(`❌ MinIO delete error:`, error);
      throw error;
    }
  }

  getBucketName(): string {
    return this.bucketName;
  }
}

/**
 * Storage Service Factory
 * Returns the appropriate storage service based on environment
 */
export function createStorageService(): IStorageService {
  const storageType = process.env.STORAGE_TYPE || "local";
  const isLocalDev = process.env.IS_LOCAL_DEV === "true";

  if (isLocalDev && storageType === "minio") {
    console.log("🏠 Using MinIO for local development");
    return new MinIOStorageService();
  }

  // TODO: Add S3StorageService for production
  // if (storageType === "s3") {
  //   return new S3StorageService();
  // }

  console.warn("⚠️  No storage service configured, using MinIO as default");
  return new MinIOStorageService();
}
