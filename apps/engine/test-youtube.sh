#!/bin/bash
# Quick test script for YouTube provider

echo "🧪 Testing YouTube Provider..."
echo ""

# Test video URL
TEST_VIDEO="https://www.youtube.com/watch?v=dQw4w9WgXcQ"

echo "📹 Testing video ingestion: $TEST_VIDEO"
curl -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$TEST_VIDEO\"}" \
  | jq '.'

echo ""
echo "🏥 Testing health endpoint..."
curl http://localhost:8787/health | jq '.'

echo ""
echo "✅ Test complete!"
