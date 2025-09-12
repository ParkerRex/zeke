import { spawn } from "node:child_process";
import { log } from "../log.js";

const WHITESPACE_REGEX = /\s+/;

export async function getSupportedFormats(videoUrl: string): Promise<string[]> {
  try {
    const ytDlpArgs = [videoUrl, "--list-formats", "--no-playlist"];
    const formatsPromise = new Promise<string>((resolve, reject) => {
      const ytDlp = spawn("yt-dlp", ytDlpArgs);
      let stdout = "";
      ytDlp.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      ytDlp.on("close", (code) =>
        code === 0
          ? resolve(stdout)
          : reject(new Error(`yt-dlp list-formats failed with code ${code}`))
      );
    });

    const output = await formatsPromise;
    const formats = output
      .split("\n")
      .filter((line) => line.includes("audio only"))
      .map((line) => line.split(WHITESPACE_REGEX)[0])
      .filter((format) => format && !format.includes("format"));
    return formats;
  } catch (error) {
    log(
      "youtube_formats_check_error",
      { videoUrl, error: String(error) },
      "error"
    );
    return [];
  }
}
