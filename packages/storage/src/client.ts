import { S3Client } from "@aws-sdk/client-s3";
import type { StorageConfig } from "./types";

let _s3Client: S3Client | null = null;
let _config: StorageConfig | null = null;

export function getStorageConfig(): StorageConfig {
  if (_config) return _config;

  const endpoint = process.env.MINIO_ENDPOINT;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;

  if (!endpoint || !accessKey || !secretKey) {
    throw new Error(
      "Missing required storage environment variables: MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY",
    );
  }

  _config = {
    endpoint,
    accessKey,
    secretKey,
    region: "us-east-1", // MinIO requires a region but ignores it
    buckets: {
      vault: process.env.MINIO_BUCKET_VAULT || "vault",
      inbox: process.env.MINIO_BUCKET_INBOX || "inbox",
      assets: process.env.MINIO_BUCKET_ASSETS || "assets",
    },
  };

  return _config;
}

export function getS3Client(): S3Client {
  if (_s3Client) return _s3Client;

  const config = getStorageConfig();

  _s3Client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: true, // Required for MinIO
  });

  return _s3Client;
}

// Export singleton client
export const s3Client = {
  get instance(): S3Client {
    return getS3Client();
  },
};
