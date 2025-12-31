import { getSession } from "@zeke/auth/server";
import { getSignedDownloadUrl } from "@zeke/storage";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const filePath = requestUrl.searchParams.get("filePath");

  const session = await getSession();

  if (!session || !filePath) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Get signed URL from MinIO storage
    const signedUrl = await getSignedDownloadUrl("vault", filePath);

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Failed to get signed URL:", error);
    return new NextResponse("File not found", { status: 404 });
  }
}
