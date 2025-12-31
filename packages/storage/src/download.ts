import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client } from "./client";
import type { DownloadParams, SignedUrlOptions, FileMetadata } from "./types";

export async function download({
  bucket,
  path,
}: DownloadParams): Promise<ReadableStream | null> {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: path,
  });

  try {
    const response = await client.send(command);
    return response.Body?.transformToWebStream() ?? null;
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      return null;
    }
    throw error;
  }
}

export async function getSignedDownloadUrl(
  bucket: string,
  key: string,
  options: SignedUrlOptions = {},
): Promise<string> {
  const client = getS3Client();
  const { expiresIn = 3600, contentDisposition } = options;

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: contentDisposition,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export async function fileExists(
  bucket: string,
  path: string,
): Promise<boolean> {
  const client = getS3Client();

  const command = new HeadObjectCommand({
    Bucket: bucket,
    Key: path,
  });

  try {
    await client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

export async function getFileMetadata(
  bucket: string,
  path: string,
): Promise<FileMetadata | null> {
  const client = getS3Client();

  const command = new HeadObjectCommand({
    Bucket: bucket,
    Key: path,
  });

  try {
    const response = await client.send(command);
    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
      etag: response.ETag,
      metadata: response.Metadata,
    };
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
}
