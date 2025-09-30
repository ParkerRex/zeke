#!/bin/bash
# Test script for Semantic Scholar provider

echo "📚 Testing Semantic Scholar Provider..."
echo ""

TEST_PAPER="https://www.semanticscholar.org/paper/Attention-is-All-you-Need-Vaswani-Shazeer/204e3073870fae3d05bcbc2f6a8e263d9b72e776"

echo "📄 Testing paper ingestion: Attention Is All You Need"
curl -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$TEST_PAPER\"}" \
  | jq '.'

echo ""
echo "✅ Test complete!"
echo ""
echo "⚠️  Note: Semantic Scholar has strict rate limits on free tier."
echo "If rate limited, wait a few seconds and try again."