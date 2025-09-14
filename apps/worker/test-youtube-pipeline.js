#!/usr/bin/env node

// Test script to verify the complete YouTube processing pipeline
import 'dotenv/config';
import { extractAudio } from './dist/extract/extract-youtube-audio.js';
import { getVideoMetadata } from './dist/extract/get-youtube-metadata.js';
import { transcribeAudio } from './dist/transcribe/whisper.js';
import { cleanupVideoTempFiles } from './dist/utils/temp-files.js';

async function testYouTubePipeline() {
  // Use a short test video (Two Minute Papers - should be under 5 minutes)
  const testVideoId = 'nHBgc_oNfQw'; // Latest Two Minute Papers video
  const testVideoUrl = `https://www.youtube.com/watch?v=${testVideoId}`;

  const tempFiles = [];

  try {
    const metadata = await getVideoMetadata(testVideoId);

    // Check if video is too long for testing (allow up to 6 minutes for this test)
    if (metadata.duration && metadata.duration > 360) {
      return;
    }
    const audioResult = await extractAudio(testVideoUrl, testVideoId);
    tempFiles.push(audioResult.audioPath);
    const transcriptionResult = await transcribeAudio(
      audioResult.audioPath,
      testVideoId
    );
    tempFiles.push(...transcriptionResult.tempFiles);
  } catch (_error) {
  } finally {
    // Cleanup temp files
    if (tempFiles.length > 0) {
      try {
        await cleanupVideoTempFiles(tempFiles);
      } catch (_cleanupError) {}
    }
  }
}

testYouTubePipeline();
