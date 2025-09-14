const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const PADDING_HOURS_MINUTES = 2;
const PADDING_SECONDS = 6;
const DECIMAL_PLACES = 3;

type TranscriptionSegment = { start?: number; end?: number; text?: string };
type TranscriptionResult = { segments?: TranscriptionSegment[] };

function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const secs = seconds % SECONDS_PER_MINUTE;
  const h = hours.toString().padStart(PADDING_HOURS_MINUTES, '0');
  const m = minutes.toString().padStart(PADDING_HOURS_MINUTES, '0');
  const s = secs.toFixed(DECIMAL_PLACES).padStart(PADDING_SECONDS, '0');
  return `${h}:${m}:${s}`;
}

export function generateVTTContent(
  transcriptionResult: TranscriptionResult
): string {
  const segments = transcriptionResult.segments || [];
  let vttContent = 'WEBVTT\n\n';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const startTime = formatVTTTime(segment.start || 0);
    const endTime = formatVTTTime(segment.end || segment.start || 0);
    const text = (segment.text || '').trim();
    if (text) {
      vttContent += `${i + 1}\n`;
      vttContent += `${startTime} --> ${endTime}\n`;
      vttContent += `${text}\n\n`;
    }
  }
  return vttContent;
}
