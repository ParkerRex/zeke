#!/usr/bin/env node
/**
 * Simple test script to verify YouTube processing pipeline
 * This bypasses the API client issues and tests the core functionality
 */
import { extractAudio } from './extract/youtube-audio.js';
import { transcribeAudio } from './transcribe/whisper.js';
import { cleanupVideoTempFiles } from './utils/temp-files.js';
async function testYouTubeProcessing() {
    // Test with a short AI research video
    const testVideoId = 'dQw4w9WgXcQ'; // Rick Roll (short, well-known video for testing)
    const testVideoUrl = `https://www.youtube.com/watch?v=${testVideoId}`;
    console.log('🎬 Testing YouTube Processing Pipeline');
    console.log(`📹 Video: ${testVideoUrl}`);
    console.log('');
    try {
        // Step 1: Test audio extraction
        console.log('🎵 Step 1: Extracting audio...');
        const audioResult = await extractAudio(testVideoUrl, testVideoId);
        if (!audioResult.success) {
            throw new Error(`Audio extraction failed: ${audioResult.error}`);
        }
        console.log(`✅ Audio extracted successfully`);
        console.log(`   📁 File: ${audioResult.audioPath}`);
        console.log(`   ⏱️  Duration: ${audioResult.metadata.duration}s`);
        console.log(`   📺 Title: ${audioResult.metadata.title}`);
        console.log(`   👤 Channel: ${audioResult.metadata.uploader}`);
        console.log('');
        // Step 2: Test transcription
        console.log('🎤 Step 2: Transcribing audio...');
        const transcriptionResult = await transcribeAudio(audioResult.audioPath, testVideoId, {
            model: 'tiny', // Use fastest model for testing
            language: undefined, // Auto-detect
            wordTimestamps: true,
        });
        if (!transcriptionResult.success) {
            throw new Error(`Transcription failed: ${transcriptionResult.error}`);
        }
        console.log(`✅ Transcription completed successfully`);
        console.log(`   🌍 Language: ${transcriptionResult.language}`);
        console.log(`   📝 Text length: ${transcriptionResult.text.length} characters`);
        console.log(`   🎯 Segments: ${transcriptionResult.segments.length}`);
        console.log(`   ⚡ Processing time: ${Math.round(transcriptionResult.processingTimeMs / 1000)}s`);
        console.log(`   🤖 Model: ${transcriptionResult.modelUsed}`);
        console.log('');
        // Show first part of transcript
        const previewText = transcriptionResult.text.substring(0, 200);
        console.log('📄 Transcript preview:');
        console.log(`"${previewText}${transcriptionResult.text.length > 200 ? '...' : ''}"`);
        console.log('');
        // Show first few segments with timestamps
        if (transcriptionResult.segments.length > 0) {
            console.log('⏰ Timestamped segments (first 3):');
            const previewSegments = transcriptionResult.segments.slice(0, 3);
            for (const segment of previewSegments) {
                const startTime = formatTimestamp(segment.start);
                const endTime = formatTimestamp(segment.end);
                console.log(`   [${startTime} - ${endTime}] ${segment.text.trim()}`);
            }
            console.log('');
        }
        // Step 3: Test cleanup
        console.log('🧹 Step 3: Cleaning up temporary files...');
        await cleanupVideoTempFiles(testVideoId);
        console.log('✅ Cleanup completed');
        console.log('');
        console.log('🎉 YouTube processing pipeline test completed successfully!');
        console.log('');
        console.log('📊 Summary:');
        console.log(`   📹 Video ID: ${testVideoId}`);
        console.log(`   🎵 Audio duration: ${audioResult.metadata.duration}s`);
        console.log(`   🎤 Transcription: ${transcriptionResult.text.length} chars, ${transcriptionResult.segments.length} segments`);
        console.log(`   🌍 Language: ${transcriptionResult.language}`);
        console.log(`   ⚡ Total processing time: ~${Math.round(transcriptionResult.processingTimeMs / 1000)}s`);
        return {
            success: true,
            videoId: testVideoId,
            audioResult,
            transcriptionResult,
        };
    }
    catch (error) {
        console.error('❌ YouTube processing pipeline test failed:');
        console.error(`   Error: ${String(error)}`);
        console.log('');
        // Cleanup on error
        try {
            await cleanupVideoTempFiles(testVideoId);
            console.log('🧹 Cleanup completed after error');
        }
        catch (cleanupError) {
            console.error(`🚨 Cleanup failed: ${String(cleanupError)}`);
        }
        return {
            success: false,
            error: String(error),
        };
    }
}
/**
 * Format timestamp in seconds to MM:SS
 */
function formatTimestamp(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
/**
 * Test prerequisites
 */
async function testPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    // Check if yt-dlp is available
    try {
        const { spawn } = await import('child_process');
        const ytdlp = spawn('yt-dlp', ['--version']);
        const ytdlpAvailable = await new Promise((resolve) => {
            ytdlp.on('close', (code) => resolve(code === 0));
            ytdlp.on('error', () => resolve(false));
            setTimeout(() => resolve(false), 5000);
        });
        if (ytdlpAvailable) {
            console.log('✅ yt-dlp is available');
        }
        else {
            console.log('❌ yt-dlp is not available');
            return false;
        }
    }
    catch (error) {
        console.log('❌ yt-dlp check failed');
        return false;
    }
    // Check if whisper is available
    try {
        const { spawn } = await import('child_process');
        const whisper = spawn('whisper', ['--help']);
        const whisperAvailable = await new Promise((resolve) => {
            whisper.on('close', (code) => resolve(code === 0));
            whisper.on('error', () => resolve(false));
            setTimeout(() => resolve(false), 5000);
        });
        if (whisperAvailable) {
            console.log('✅ Whisper is available');
        }
        else {
            console.log('❌ Whisper is not available');
            return false;
        }
    }
    catch (error) {
        console.log('❌ Whisper check failed');
        return false;
    }
    console.log('✅ All prerequisites are available');
    console.log('');
    return true;
}
// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    (async () => {
        console.log('🧪 YouTube Processing Pipeline Test');
        console.log('=====================================');
        console.log('');
        // Check prerequisites first
        const prereqsOk = await testPrerequisites();
        if (!prereqsOk) {
            console.log('❌ Prerequisites not met. Please ensure yt-dlp and whisper are installed.');
            process.exit(1);
        }
        // Run the main test
        const result = await testYouTubeProcessing();
        if (result.success) {
            console.log('🎉 All tests passed!');
            process.exit(0);
        }
        else {
            console.log('❌ Test failed');
            process.exit(1);
        }
    })().catch((error) => {
        console.error('🚨 Unexpected error:', error);
        process.exit(1);
    });
}
export { testYouTubeProcessing, testPrerequisites };
