import { upload, getSignedUploadUrl } from "@zeke/storage";
import { useState } from "react";

interface UploadParams {
  file: File;
  path: string[];
  bucket: string;
}

interface UploadResult {
  url: string;
  path: string[];
}

export function useUpload() {
  const [isLoading, setLoading] = useState<boolean>(false);

  const uploadFile = async ({
    file,
    path,
    bucket,
  }: UploadParams): Promise<UploadResult> => {
    setLoading(true);

    try {
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Full path including filename
      const fullPath = [...path, file.name].join("/");

      // Upload to MinIO
      const url = await upload({
        file: buffer,
        path: fullPath,
        bucket,
        contentType: file.type,
      });

      return {
        url,
        path,
      };
    } finally {
      setLoading(false);
    }
  };

  // Get a signed URL for direct upload (useful for large files)
  const getUploadUrl = async (
    bucket: string,
    path: string,
    contentType?: string,
  ): Promise<string> => {
    return getSignedUploadUrl(bucket, path, { contentType });
  };

  return {
    uploadFile,
    getUploadUrl,
    isLoading,
  };
}
