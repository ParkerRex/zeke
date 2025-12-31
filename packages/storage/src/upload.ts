import {
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client, getStorageConfig } from "./client";
import type { UploadParams, SignedUrlOptions } from "./types";

export async function upload({
  file,
  path,
  bucket,
  contentType,
  metadata,
  cacheControl = "max-age=3600",
}: UploadParams): Promise<string> {
  const client = getS3Client();
  const config = getStorageConfig();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: path,
    Body: file,
    ContentType: contentType,
    CacheControl: cacheControl,
    Metadata: metadata,
  });

  await client.send(command);

  // Return the public URL
  return `${config.endpoint}/${bucket}/${path}`;
}

export async function uploadBuffer(
  buffer: Buffer,
  path: string,
  bucket: string,
  contentType?: string,
): Promise<string> {
  return upload({
    file: buffer,
    path,
    bucket,
    contentType,
  });
}

export async function getSignedUploadUrl(
  bucket: string,
  key: string,
  options: SignedUrlOptions = {},
): Promise<string> {
  const client = getS3Client();
  const { expiresIn = 3600, contentType } = options;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const client = getS3Client();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: path,
  });

  await client.send(command);
}

export async function deleteFiles(
  bucket: string,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return;

  const client = getS3Client();

  const command = new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: {
      Objects: paths.map((path) => ({ Key: path })),
      Quiet: true,
    },
  });

  await client.send(command);
}
