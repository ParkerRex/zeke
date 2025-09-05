#!/usr/bin/env node

// Simple test script to verify YouTube API client functionality
import 'dotenv/config';
import { YouTubeAPIClient } from './dist/clients/youtube-api.js';

async function testYouTubeAPI() {
  console.log('🧪 Testing YouTube API Client...');
  
  if (!process.env.YOUTUBE_API_KEY) {
    console.error('❌ YOUTUBE_API_KEY not found in environment');
    process.exit(1);
  }
  
  try {
    const client = new YouTubeAPIClient();
    console.log('✅ YouTube API client created successfully');
    
    // Test 1: Search for a simple video
    console.log('\n📹 Testing video search...');
    const videos = await client.searchVideos('AI research', 2);
    console.log(`✅ Found ${videos.length} videos`);
    
    if (videos.length > 0) {
      const video = videos[0];
      console.log(`   - Title: ${video.title}`);
      console.log(`   - Channel: ${video.channelTitle}`);
      console.log(`   - Video ID: ${video.videoId}`);
      console.log(`   - Published: ${video.publishedAt}`);
    }
    
    // Test 2: Get channel uploads (using Two Minute Papers as test)
    console.log('\n📺 Testing channel uploads...');
    const channelVideos = await client.getChannelUploads('UUbfYPyITQ-7l4upoX8nvctg', 2);
    console.log(`✅ Found ${channelVideos.length} channel videos`);
    
    if (channelVideos.length > 0) {
      const channelVideo = channelVideos[0];
      console.log(`   - Title: ${channelVideo.title}`);
      console.log(`   - Channel: ${channelVideo.channelTitle}`);
      console.log(`   - Video ID: ${channelVideo.videoId}`);
    }
    
    console.log('\n🎉 YouTube API client test completed successfully!');
    
  } catch (error) {
    console.error('❌ YouTube API test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testYouTubeAPI();
