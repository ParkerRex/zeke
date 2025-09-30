#!/bin/bash
# Quick test script for RSS provider

echo "🧪 Testing RSS Provider..."
echo ""

# Test RSS feed URL (Hacker News)
TEST_FEED="https://hnrss.org/newest?points=100"

echo "📰 Testing RSS feed ingestion: $TEST_FEED"
curl -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$TEST_FEED\"}" \
  | jq '.'

echo ""
echo "📡 Testing source info extraction..."
curl -X POST http://localhost:8787/source \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$TEST_FEED\"}" \
  | jq '.'

echo ""
echo "✅ RSS test complete!"
