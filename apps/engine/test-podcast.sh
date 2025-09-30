#!/bin/bash
# Test script for Apple Podcasts provider

echo "🎙️  Testing Apple Podcasts Provider..."
echo ""

TEST_PODCAST="https://podcasts.apple.com/us/podcast/lex-fridman-podcast/id1434243584"

echo "📻 Testing latest episode ingestion: $TEST_PODCAST"
curl -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$TEST_PODCAST\"}" \
  | jq '.'

echo ""
echo "📡 Testing podcast source info..."
curl -X POST http://localhost:8787/source \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$TEST_PODCAST\"}" \
  | jq '.'

echo ""
echo "✅ Test complete!"