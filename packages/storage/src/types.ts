export interface StorageConfig {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  region: string;
  buckets: {
    vault: string;
    inbox: string;
    assets: string;
  };
}

export interface UploadParams {
  file: Buffer | Blob | ReadableStream;
  path: string;
  bucket: string;
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

export interface DownloadParams {
  bucket: string;
  path: string;
}

export interface SignedUrlOptions {
  expiresIn?: number; // seconds, default 3600
  contentType?: string;
  contentDisposition?: string;
}

export interface FileMetadata {
  contentType?: string;
  contentLength?: number;
  lastModified?: Date;
  etag?: string;
  metadata?: Record<string, string>;
}
