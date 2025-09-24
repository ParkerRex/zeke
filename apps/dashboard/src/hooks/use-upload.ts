// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@zeke/supabase/client";
import { upload } from "@zeke/supabase/storage";
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
  const supabase: SupabaseClient = createClient();
  const [isLoading, setLoading] = useState<boolean>(false);

  const uploadFile = async ({
    file,
    path,
    bucket,
  }: UploadParams): Promise<UploadResult> => {
    setLoading(true);

    try {
      const url = await upload(supabase, {
        path,
        file,
        bucket,
      });

      return {
        url,
        path,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    uploadFile,
    isLoading,
  };
}
