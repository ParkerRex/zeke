import { stripSpecialCharacters } from "@zeke/utils";

type ResumableUploadParams = {
  file: File;
  path: string[];
  bucket: string;
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
};

/**
 * Upload a file to MinIO storage via signed URL
 * Note: TUS resumable upload is not yet implemented for MinIO
 * This is a simple direct upload for now
 */
export async function resumableUpload({
  file,
  path,
  bucket,
  onProgress,
}: ResumableUploadParams) {
  const filename = stripSpecialCharacters(file.name);
  const fullPath = [...path, filename].join("/");

  try {
    // Get signed upload URL from the API
    const response = await fetch("/api/storage/upload-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bucket,
        path: fullPath,
        contentType: file.type,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get upload URL");
    }

    const { uploadUrl } = await response.json();

    // Upload file using XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(event.loaded, event.total);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            filename,
            file,
          });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  } catch (error) {
    throw error;
  }
}
