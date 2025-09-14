import { log } from '../log.js';

export type TranscriptData = {
  vttContent: string;
  transcriptUrl: string;
  success: boolean;
  error?: string;
};

export function prepareYouTubeTranscript(
  videoId: string,
  vttContent: string,
  plainText: string
): TranscriptData {
  try {
    log('youtube_transcript_prepare_start', {
      videoId,
      vttSize: vttContent.length,
      txtSize: plainText.length,
    });
    if (!(vttContent.trim() && plainText.trim())) {
      throw new Error('Empty transcript content');
    }
    const transcriptUrl = `youtube://${videoId}`;
    log('youtube_transcript_prepare_success', {
      videoId,
      transcriptUrl,
      vttSize: vttContent.length,
      txtSize: plainText.length,
    });
    return { vttContent, transcriptUrl, success: true };
  } catch (error) {
    const errorMessage = String(error);
    log(
      'youtube_transcript_prepare_error',
      { videoId, error: errorMessage },
      'error'
    );
    return {
      vttContent: '',
      transcriptUrl: '',
      success: false,
      error: errorMessage,
    };
  }
}
