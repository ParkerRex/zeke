#!/usr/bin/env node

// Test script to verify the complete YouTube processing pipeline
import 'dotenv/config';
import { extractAudio, getVideoMetadata } from './dist/extract/youtube-audio.js';
import { transcribeAudio } from './dist/transcribe/whisper.js';
import { cleanupVideoTempFiles } from './dist/utils/temp-files.js';

async function testYouTubePipeline() {
  console.log('🧪 Testing YouTube Processing Pipeline...');

  // Use a short test video (Two Minute Papers - should be under 5 minutes)
  const testVideoId = 'nHBgc_oNfQw'; // Latest Two Minute Papers video
  const testVideoUrl = `https://www.youtube.com/watch?v=${testVideoId}`;

  let tempFiles = [];

  try {
    console.log(`\n📹 Testing with video: ${testVideoUrl}`);

    // Step 1: Extract video metadata
    console.log('\n📊 Step 1: Extracting video metadata...');
    const metadata = await getVideoMetadata(testVideoId);
    console.log('✅ Metadata extracted successfully');
    console.log(`   - Title: ${metadata.title}`);
    console.log(`   - Duration: ${metadata.duration} seconds`);
    console.log(`   - View Count: ${metadata.viewCount?.toLocaleString() || 'N/A'}`);
    console.log(`   - Upload Date: ${metadata.uploadDate}`);

    // Check if video is too long for testing (allow up to 6 minutes for this test)
    if (metadata.duration && metadata.duration > 360) {
      // 6 minutes
      console.log('⚠️  Video is longer than 6 minutes, skipping audio extraction for this test');
      console.log('✅ Metadata extraction test completed successfully!');
      return;
    }

    // Step 2: Extract audio
    console.log('\n🎵 Step 2: Extracting audio...');
    const audioResult = await extractAudio(testVideoUrl, testVideoId);
    tempFiles.push(audioResult.audioPath);
    console.log('✅ Audio extracted successfully');
    console.log(`   - Audio file: ${audioResult.audioPath}`);
    console.log(`   - File size: ${(audioResult.fileSizeBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Extraction time: ${audioResult.extractionTimeMs}ms`);

    // Step 3: Transcribe audio
    console.log('\n📝 Step 3: Transcribing audio...');
    const transcriptionResult = await transcribeAudio(audioResult.audioPath, testVideoId);
    tempFiles.push(...transcriptionResult.tempFiles);
    console.log('✅ Audio transcribed successfully');
    console.log(`   - Language: ${transcriptionResult.language}`);
    console.log(`   - Text length: ${transcriptionResult.text.length} characters`);
    console.log(`   - Transcription time: ${transcriptionResult.transcriptionTimeMs}ms`);
    console.log(`   - Text preview: ${transcriptionResult.text.substring(0, 200)}...`);

    console.log('\n🎉 Complete YouTube processing pipeline test successful!');
    console.log('\n📈 Performance Summary:');
    console.log(
      `   - Total processing time: ${audioResult.extractionTimeMs + transcriptionResult.transcriptionTimeMs}ms`
    );
    console.log(`   - Audio file size: ${(audioResult.fileSizeBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(
      `   - Transcription efficiency: ${(
        (transcriptionResult.text.length / transcriptionResult.transcriptionTimeMs) *
        1000
      ).toFixed(2)} chars/sec`
    );
  } catch (error) {
    console.error('❌ YouTube pipeline test failed:', error.message);
    console.error('   Stack trace:', error.stack);
  } finally {
    // Cleanup temp files
    if (tempFiles.length > 0) {
      console.log('\n🧹 Cleaning up temporary files...');
      try {
        await cleanupVideoTempFiles(tempFiles);
        console.log('✅ Cleanup completed');
      } catch (cleanupError) {
        console.error('⚠️  Cleanup warning:', cleanupError.message);
      }
    }
  }
}

testYouTubePipeline();
