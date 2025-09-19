#!/usr/bin/env node

// Simple test script to verify YouTube API client functionality
import 'dotenv/config';
import { getChannelUploads } from './dist/lib/youtube/get-channel-uploads.js';
import { searchVideos } from './dist/lib/youtube/search-videos.js';
import { createYouTubeClient } from './dist/lib/youtube/youtube-client.js';

async function testYouTubeAPI() {
  if (!process.env.YOUTUBE_API_KEY) {
    process.exit(1);
  }

  try {
    const client = createYouTubeClient();
    const videos = await searchVideos(client, {
      query: 'AI research',
      maxResults: 2,
    });

    if (videos.length > 0) {
      const _video = videos[0];
    }
    const channelVideos = await getChannelUploads(
      client,
      'UUbfYPyITQ-7l4upoX8nvctg',
      2
    );

    if (channelVideos.length > 0) {
      const _channelVideo = channelVideos[0];
    }
  } catch (error) {
    if (error.response) {
    }
    process.exit(1);
  }
}

testYouTubeAPI();
