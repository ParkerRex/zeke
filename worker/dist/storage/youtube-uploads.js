import { log } from '../log.js';
/**
 * Prepare YouTube transcript data for storage
 * Simple approach: store VTT content and generate URL pattern
 */
export async function prepareYouTubeTranscript(videoId, vttContent, plainText) {
    try {
        log('youtube_transcript_prepare_start', {
            videoId,
            vttSize: vttContent.length,
            txtSize: plainText.length,
        });
        // Validate content
        if (!vttContent.trim() || !plainText.trim()) {
            throw new Error('Empty transcript content');
        }
        // Generate a simple URL pattern for the transcript
        // This will be used by the frontend to identify YouTube transcripts
        const transcriptUrl = `youtube://${videoId}`;
        log('youtube_transcript_prepare_success', {
            videoId,
            transcriptUrl,
            vttSize: vttContent.length,
            txtSize: plainText.length,
        });
        return {
            vttContent,
            transcriptUrl,
            success: true,
        };
    }
    catch (error) {
        const errorMessage = String(error);
        log('youtube_transcript_prepare_error', {
            videoId,
            error: errorMessage,
        }, 'error');
        return {
            vttContent: '',
            transcriptUrl: '',
            success: false,
            error: errorMessage,
        };
    }
}
/**
 * Generate VTT content from Whisper transcription result
 * Converts Whisper segments to WebVTT format with timestamps
 */
export function generateVTTContent(transcriptionResult) {
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
/**
 * Format seconds to VTT timestamp format (HH:MM:SS.mmm)
 */
function formatVTTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    const s = secs.toFixed(3).padStart(6, '0');
    return `${h}:${m}:${s}`;
}
