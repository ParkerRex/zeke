#!/bin/bash
# Quick test script for arXiv provider

echo "🧪 Testing arXiv Provider..."
echo ""

# Test arXiv paper URL (a famous paper on attention mechanisms)
TEST_PAPER="https://arxiv.org/abs/1706.03762"

echo "📄 Testing arXiv paper ingestion: $TEST_PAPER"
echo "(Attention Is All You Need - Transformer paper)"
curl -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$TEST_PAPER\"}" \
  | jq '.'

echo ""
echo "📚 Testing source info extraction..."
curl -X POST http://localhost:8787/source \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$TEST_PAPER\"}" \
  | jq '.'

echo ""
echo "✅ arXiv test complete!"
